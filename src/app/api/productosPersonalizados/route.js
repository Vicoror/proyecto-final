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

// Configuración de Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configuración de MySQL
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

// Convierte el request de Next.js App Router a un stream para formidable
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

// GET: Obtener materiales
export async function GET() {
  try {
    const [metales] = await pool.query('SELECT id_metal AS id, nombreM AS nombre FROM metal');
    const [piedras] = await pool.query('SELECT id_piedra AS id, nombrePiedra AS nombre FROM piedra');
    const [hilos] = await pool.query('SELECT id_hilo AS id, color AS nombre FROM hilo');

    return NextResponse.json({ metales, piedras, hilos }, { status: 200 });
  } catch (error) {
    console.error('Error en GET productosPersonalizados:', error);
    return NextResponse.json(
      { success: false, message: 'Error al obtener datos', error: error.message },
      { status: 500 }
    );
  }
}

// POST: Guardar producto personalizado
export async function POST(request) {
  try {
    const { fields, files } = await parseForm(request);

     console.log("📦 Campos:", fields);   // Aquí ves lo que enviaste como texto (nombre, activar, etc.)
    console.log("🖼️ Archivos:", files); 

    if (!fields.nombreModelo || !fields.categoria) {
      return NextResponse.json(
        { success: false, message: 'Nombre y categoría son obligatorios' },
        { status: 400 }
      );
    }
    
    let urlImagen = null; // ← Esta línea es la que faltaba

    const imagenFile = Array.isArray(files.imagen) ? files.imagen[0] : files.imagen;

if (imagenFile && imagenFile.filepath) {
  try {
    const uploadResult = await cloudinary.uploader.upload(imagenFile.filepath, {
      folder: 'productos_personalizados',
      resource_type: 'image', // <-- ojo, no 'imagen'
    });
    urlImagen = uploadResult.secure_url;
    console.log("✅ Imagen subida con URL:", urlImagen);
  } catch (uploadError) {
    console.error('❌ Error al subir imagen:', uploadError);
    return NextResponse.json(
      { success: false, message: 'Error al subir imagen', error: uploadError.message },
      { status: 500 }
    );
  }
} else {
  console.warn("⚠️ Imagen no encontrada o filepath vacío");
}

    const activarValue = ['true', 'on', '1'].includes(String(fields.activar)) ? 1 : 0;

  const [resultado] = await pool.query(
  `INSERT INTO productospersonalizados
   (nombreModelo, categoria, ImagenPP,descriptionPP,tiempoEntrega, Activar, PrecioManoObra)
   VALUES (?, ?, ?, ?, ?, ?, ?)`,
  [
    fields.nombreModelo,
    fields.categoria,
    urlImagen || null,
    fields.descriptionPP,
    parseInt(fields.tiempoEntrega) || 1,
    activarValue,
    parseFloat(fields.precioManoObra) || 0,
  ]
);

    const idProducto = resultado.insertId;

    const materiales = {
      metales: JSON.parse(fields.metales || '[]'),
      piedras: JSON.parse(fields.piedras || '[]'),
      hilos: JSON.parse(fields.hilos || '[]'),
    };
    console.log("📦 Materiales a guardar:", materiales);
    
    await Promise.all([
  ...materiales.metales.map((m) =>
    pool.query(
      'INSERT INTO producto_metal (id_ProPer, id_metal, gramos, ActivarM) VALUES (?, ?, ?, ?)',
      [idProducto, m.id, m.valor, 1]
    ).catch((e) => console.error('Error insertando metal:', e))
  ),
  ...materiales.piedras.map((p) =>
    pool.query(
      'INSERT INTO producto_piedra (id_ProPer, id_piedra, gramos, ActivarP) VALUES (?, ?, ?, ?)',
      [idProducto, p.id, p.valor, 1]
    ).catch((e) => console.error('Error insertando piedra:', e))
  ),
  ...materiales.hilos.map((h) =>
    pool.query(
      'INSERT INTO producto_hilo (id_ProPer, id_hilo, metros, ActivarH) VALUES (?, ?, ?, ?)',
      [idProducto, h.id, h.valor, 1]
    ).catch((e) => console.error('Error insertando hilo:', e))
  ),
]);


    return NextResponse.json(
      { success: true, message: 'Producto guardado correctamente', id: idProducto },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error en POST productosPersonalizados:', error);
    return NextResponse.json(
      { success: false, message: 'Error al guardar producto', error: error.message },
      { status: 500 }
    );
  }
}