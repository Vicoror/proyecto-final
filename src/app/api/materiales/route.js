import { v2 as cloudinary } from 'cloudinary';
import mysql from 'mysql2/promise';
import { NextResponse } from 'next/server';
import { IncomingForm } from 'formidable';
import { Readable } from 'stream';

export const config = {
  api: {
    bodyParser: false,
  },
};

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

async function parseForm(request) {
  const form = new IncomingForm({ keepExtensions: true });
  const buffers = [];
  const reader = request.body.getReader();
  let done = false;

  while (!done) {
    const { value, done: readerDone } = await reader.read();
    if (value) buffers.push(value);
    done = readerDone;
  }

  const bodyBuffer = Buffer.concat(buffers);

  const fakeReq = new Readable();
  const headers = {};
  for (const [key, value] of request.headers.entries()) {
    headers[key.toLowerCase()] = value;
  }
  fakeReq.headers = headers;
  fakeReq._read = () => {};
  fakeReq.push(bodyBuffer);
  fakeReq.push(null);

  return new Promise((resolve, reject) => {
    form.parse(fakeReq, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });
}

export async function GET() {
  try {
    const [metales] = await pool.query("SELECT * FROM metal");
    const [piedras] = await pool.query("SELECT * FROM piedra");
    const [hilos] = await pool.query("SELECT * FROM hilo");

    return NextResponse.json({ metales, piedras, hilos }, { status: 200 });
  } catch (error) {
    console.error("❌ Error al obtener materiales:", error);
    return NextResponse.json(
      { success: false, message: "Error al obtener materiales", error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    console.log("📥 POST materiales iniciado");

    const { fields, files } = await parseForm(request);
    const tipo = fields.tipo?.[0] || fields.tipo;

    if (!['metal', 'piedra', 'hilo'].includes(tipo)) {
      return NextResponse.json({ success: false, message: 'Tipo de material inválido' }, { status: 400 });
    }

    const nombreCampo = tipo === 'metal' ? 'nombreM' : tipo === 'piedra' ? 'nombrePiedra' : 'color';
    const precioCampo = tipo === 'metal' ? 'precioM' : tipo === 'piedra' ? 'precioP' : 'precioH';
    const imagenCampo = tipo === 'metal' ? 'imagenM' : tipo === 'piedra' ? 'imagenPiedra' : 'imagenH';
    const activarCampo = tipo === 'metal' ? 'activarM' : tipo === 'piedra' ? 'activarP' : 'activarH';

    const nombre = fields[nombreCampo]?.[0] || fields[nombreCampo];
    const precio = parseFloat(fields[precioCampo]?.[0] || fields[precioCampo]);
    const id = fields.id?.[0] || fields.id;
    const activar = fields[activarCampo]?.[0] || fields[activarCampo] || '1';

    if (!nombre || nombre.length > 50) {
      return NextResponse.json({ success: false, message: 'Nombre inválido o muy largo' }, { status: 400 });
    }

    if (isNaN(precio) || precio > 50000) {
      return NextResponse.json({ success: false, message: 'Precio inválido' }, { status: 400 });
    }

    let urlImagen = null;
    const imagenFile = Array.isArray(files.imagen) ? files.imagen[0] : files.imagen;

    if (imagenFile && imagenFile.filepath) {
      const result = await cloudinary.uploader.upload(imagenFile.filepath, {
        folder: `materiales/${tipo}`,
        resource_type: 'image',
      });
      urlImagen = result.secure_url;
    }

    if (id) {
      await pool.query(
        `UPDATE ${tipo} SET ${nombreCampo} = ?, ${precioCampo} = ?, ${activarCampo} = ?, ${imagenCampo} = COALESCE(?, ${imagenCampo}) WHERE id_${tipo} = ?`,
        [nombre, precio, activar, urlImagen, id]
      );
    } else {
      await pool.query(
        `INSERT INTO ${tipo} (${nombreCampo}, ${precioCampo}, ${imagenCampo}, ${activarCampo}) VALUES (?, ?, ?, ?)`,
        [nombre, precio, urlImagen, activar]
      );
    }

    return NextResponse.json({ success: true, message: 'Material guardado correctamente' }, { status: 201 });

  } catch (error) {
    console.error("❌ Error en POST materiales:", error);
    return NextResponse.json(
      { success: false, message: "Error al guardar material", error: error.message },
      { status: 500 }
    );
  }
}
