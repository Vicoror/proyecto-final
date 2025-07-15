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

// ✅ PUT para subir imágenes/video + enlaces
export async function PUT(req) {
  try {
    const data = await req.formData();
    const archivos = {};
    const enlaces = {};

    // Separamos archivos y enlaces
    for (const key of data.keys()) {
      const valor = data.get(key);

      if (valor && valor.name) {
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
      } else {
        // Es un texto (enlace)
        enlaces[key] = valor;
      }
    }

    await guardarEnDB(archivos, enlaces);

    return NextResponse.json({ mensaje: "Archivos y enlaces subidos" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Error al subir contenido" }, { status: 500 });
  }
}

// ✅ Función para insertar tipo, url y enlace
async function guardarEnDB(archivos, enlaces) {
  const conn = await pool.getConnection();
  try {
    // Recorremos cada archivo subido
    for (const key of Object.keys(archivos)) {
      const { tipo, url } = archivos[key];
      let enlace = null;

      if (key.startsWith("imagen")) {
        const num = key.replace("imagen", "");
        enlace = enlaces[`enlace${num}`] || null;
      }
      if (key === "video") {
        enlace = enlaces["enlaceVideo"] || null;
      }

      // Calculamos el ID (imagen1 = id 1, imagen2 = 2, ..., video = 6)
      const id = key === "video" ? 6 : parseInt(key.replace("imagen", ""), 10);

      // Verificamos si ya existe un registro con ese ID
      const [existente] = await conn.query("SELECT id FROM publicidad WHERE id = ?", [id]);

      if (existente.length > 0) {
        // Actualizamos
        await conn.query(
          "UPDATE publicidad SET tipo = ?, url = ?, enlace = ? WHERE id = ?",
          [tipo, url, enlace, id]
        );
      } else {
        // Insertamos
        await conn.query(
          "INSERT INTO publicidad (id, tipo, url, enlace) VALUES (?, ?, ?, ?)",
          [id, tipo, url, enlace]
        );
      }
    }
  } finally {
    conn.release();
  }
}

// ✅ GET para mostrar publicidad actual
export async function GET() {
  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.query("SELECT tipo, url, enlace FROM publicidad");
    return NextResponse.json(rows);
  } catch (err) {
    console.error("Error al obtener publicidad:", err);
    return NextResponse.json({ error: "Error al obtener la publicidad" }, { status: 500 });
  } finally {
    conn.release();
  }
}
