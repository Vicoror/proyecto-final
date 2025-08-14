// app/api/publicidad/route.js
import { NextResponse } from "next/server";
import mysql from "mysql2/promise";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 11561,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export async function PUT(req) {
  try {
    const data = await req.formData();
    const archivos = {};
    const enlaces = {};
    const activaciones = {};
    const fechasInicio = {};
    const fechasFin = {};

    // Procesar datos del formulario
    for (const key of data.keys()) {
      const valor = data.get(key);

      if (valor instanceof Blob && valor.name) {
        // Es un archivo
        const buffer = Buffer.from(await valor.arrayBuffer());
        
        await new Promise((resolve, reject) => {
          const upload = cloudinary.uploader.upload_stream(
            {
              resource_type: key === "video" ? "video" : "image",
              folder: "publicidad",
            },
            (error, result) => {
              if (error) {
                reject(error);
              } else {
                archivos[key] = {
                  tipo: key === "video" ? "video" : "imagen",
                  url: result.secure_url,
                };
                resolve();
              }
            }
          );
          upload.end(buffer);
        });
      } else if (key.startsWith('activar')) {
        // Simplificado: Convertir a 1 o 0 directamente
        activaciones[key] = valor === '1' ? 1 : 0;
      } else if (key.startsWith('fechaInicio')) {
        fechasInicio[key] = valor || null;
      } else if (key.startsWith('fechaFin')) {
        fechasFin[key] = valor || null;
      } else if (key.startsWith('enlace')) {
        enlaces[key] = valor;
      }
    }

    await guardarEnDB(archivos, enlaces, activaciones, fechasInicio, fechasFin);
    return NextResponse.json({ mensaje: "Publicidad actualizada correctamente", success: true });

  } catch (err) {
    console.error("Error en PUT:", err);
    return NextResponse.json(
      { error: "Error al actualizar la publicidad", details: err.message },
      { status: 500 }
    );
  }
}

async function guardarEnDB(archivos, enlaces, activaciones, fechasInicio, fechasFin) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Procesar archivos subidos (imágenes y video)
    for (const key of Object.keys(archivos)) {
      const { tipo, url } = archivos[key];
      const id = key === "video" ? 6 : parseInt(key.replace("imagen", ""), 10);
      
      const num = key === "video" ? "Video" : key.replace("imagen", "");
      const campoPrefijo = key === "video" ? "" : num;
      
      const enlace = enlaces[`enlace${campoPrefijo}`] || null;
      const activar = activaciones[`activar${campoPrefijo}`] ?? 0;
      const fechaInicio = fechasInicio[`fechaInicio${campoPrefijo}`] || null;
      const fechaFin = fechasFin[`fechaFin${campoPrefijo}`] || null;

      const [existente] = await conn.query("SELECT id FROM publicidad WHERE id = ?", [id]);

      if (existente.length > 0) {
        await conn.query(
          `UPDATE publicidad SET 
            tipo = ?, 
            url = ?, 
            enlace = ?, 
            activar = ?, 
            fechaInicio = ?, 
            fechaFin = ? 
          WHERE id = ?`,
          [tipo, url, enlace, activar, fechaInicio, fechaFin, id]
        );
      } else {
        await conn.query(
          `INSERT INTO publicidad 
            (id, tipo, url, enlace, activar, fechaInicio, fechaFin) 
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [id, tipo, url, enlace, activar, fechaInicio, fechaFin]
        );
      }
    }

    // 2. Procesar enlaces sin archivos nuevos
    for (const key of Object.keys(enlaces)) {
      if (key.startsWith("enlace")) {
        const num = key === "enlaceVideo" ? "Video" : key.replace("enlace", "");
        const id = key === "enlaceVideo" ? 6 : parseInt(num, 10);
        const tipo = key === "enlaceVideo" ? "video" : "imagen";
        
        const enlace = enlaces[key] || null;
        const activar = activaciones[`activar${num}`] ?? 0;
        const fechaInicio = fechasInicio[`fechaInicio${num}`] || null;
        const fechaFin = fechasFin[`fechaFin${num}`] || null;

        const [existente] = await conn.query("SELECT id FROM publicidad WHERE id = ?", [id]);

        if (existente.length > 0) {
          await conn.query(
            `UPDATE publicidad SET 
              enlace = ?, 
              activar = ?, 
              fechaInicio = ?, 
              fechaFin = ? 
            WHERE id = ?`,
            [enlace, activar, fechaInicio, fechaFin, id]
          );
        } else {
          await conn.query(
            `INSERT INTO publicidad 
              (id, tipo, url, enlace, activar, fechaInicio, fechaFin) 
            VALUES (?, ?, NULL, ?, ?, ?, ?)`,
            [id, tipo, enlace, activar, fechaInicio, fechaFin]
          );
        }
      }
    }

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    console.error("Error en guardarEnDB:", err);
    throw err;
  } finally {
    conn.release();
  }
}

export async function GET(req) {
  const conn = await pool.getConnection();
  try {
    const { searchParams } = new URL(req.url);
    const esAdmin = searchParams.get("admin") === "1";

    let query = `
      SELECT 
        id, 
        tipo, 
        url, 
        enlace, 
        activar, 
        DATE_FORMAT(fechaInicio, '%Y-%m-%d') as fechaInicio,
        DATE_FORMAT(fechaFin, '%Y-%m-%d') as fechaFin
      FROM publicidad
    `;

    if (!esAdmin) {
      query += `
        WHERE activar = 1 
        AND (fechaInicio IS NULL OR fechaInicio <= CURDATE())
        AND (fechaFin IS NULL OR fechaFin >= CURDATE())
      `;
    }

    query += " ORDER BY id";

    const [rows] = await conn.query(query);
    return NextResponse.json(rows);
  } catch (err) {
    console.error("Error en GET:", err);
    return NextResponse.json(
      { error: "Error al obtener publicidad" },
      { status: 500 }
    );
  } finally {
    conn.release();
  }
}
