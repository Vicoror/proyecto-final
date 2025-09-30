import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import { v2 as cloudinary } from 'cloudinary';

// Configuración de Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configuración de la conexión a la base de datos
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 11561,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

function isE164(phone) {
  return /^\+[1-9]\d{7,14}$/.test(phone);
}

// GET: obtener configuración
export async function GET() {
  try {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(
        'SELECT phone_e164, default_message, help, terminos, updated_at, foto_tallas_anillos FROM whatsapp_config WHERE id = 1'
      );
      
      if (!rows.length) {
        return NextResponse.json({ 
          phone_e164: null, 
          default_message: null, 
          help: null, 
          terminos: null, 
          foto_tallas_anillos: null 
        }, { status: 200 });
      }
      
      return NextResponse.json(rows[0], { status: 200 });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error en GET:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// PUT: actualizar configuración
export async function PUT(request) {
  try {
    const { phone_e164, default_message, help, terminos, updated_by, foto_tallas_anillos } = await request.json();

    // Validaciones básicas (sin modificar)
    if (!phone_e164 || !isE164(phone_e164)) {
      return NextResponse.json({ error: 'phone_e164 debe ir en formato E.164, por ejemplo +5215512345678' }, { status: 400 });
    }

    if (!terminos || terminos.trim().length === 0) {
      return NextResponse.json({ error: 'El campo de términos no puede estar vacío' }, { status: 400 });
    }

    const connection = await pool.getConnection();
    try {
      await connection.execute(
        `INSERT INTO whatsapp_config (id, phone_e164, default_message, help, terminos, updated_by, foto_tallas_anillos) 
         VALUES (1, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE 
           phone_e164 = VALUES(phone_e164), 
           default_message = VALUES(default_message), 
           help = VALUES(help),
           terminos = VALUES(terminos),
           updated_by = VALUES(updated_by),
           foto_tallas_anillos = VALUES(foto_tallas_anillos)`,
        [phone_e164, default_message || null, help || null, terminos, updated_by || null, foto_tallas_anillos || null]
      );

      return NextResponse.json({ ok: true });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error en PUT:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// POST: inactivar cuenta de usuario (sin modificar)
export async function POST(request) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'ID de usuario requerido' }, { status: 400 });
    }

    const connection = await pool.getConnection();
    try {
      // Inactivar la cuenta (establecer activar_usuario = 0)
      const [result] = await connection.execute(
        'UPDATE crear_usuario SET activar_usuario = 0 WHERE id_cliente = ?',
        [userId]
      );

      if (result.affectedRows === 0) {
        return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Cuenta inactivada correctamente' 
      }, { status: 200 });

    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error inactivando cuenta:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// NUEVO ENDPOINT: Subir foto de tallas de anillos a Cloudinary
export async function PATCH(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('foto_tallas_anillos');

    if (!file) {
      return NextResponse.json({ error: 'No se proporcionó ningún archivo' }, { status: 400 });
    }

    // Validar tipo de archivo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Formato de archivo no permitido. Use JPG, JPEG, PNG, WEBP o GIF' 
      }, { status: 400 });
    }

    // Validar tamaño (2MB máximo)
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: 'El archivo es demasiado grande. Tamaño máximo: 2MB' 
      }, { status: 400 });
    }

    // Convertir archivo a buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Subir a Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            resource_type: 'image',
            folder: 'tallas_anillos',
            transformation: [
              { width: 800, height: 800, crop: 'limit', quality: 'auto' }
            ]
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        )
        .end(buffer);
    });

    // Actualizar en la base de datos
    const connection = await pool.getConnection();
    try {
      await connection.execute(
        `UPDATE whatsapp_config SET foto_tallas_anillos = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1`,
        [uploadResult.secure_url, 'admin']
      );

      return NextResponse.json({ 
        success: true, 
        url: uploadResult.secure_url,
        public_id: uploadResult.public_id
      }, { status: 200 });

    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Error subiendo foto a Cloudinary:', error);
    return NextResponse.json({ error: 'Error interno del servidor al subir la imagen' }, { status: 500 });
  }
}

// NUEVO ENDPOINT: Eliminar foto de tallas de anillos
export async function DELETE(request) {
  try {
    const { public_id } = await request.json();

    if (public_id) {
      // Eliminar de Cloudinary
      await cloudinary.uploader.destroy(public_id);
    }

    // Actualizar en la base de datos
    const connection = await pool.getConnection();
    try {
      await connection.execute(
        `UPDATE whatsapp_config SET foto_tallas_anillos = NULL, updated_by = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1`,
        ['admin']
      );

      return NextResponse.json({ 
        success: true, 
        message: 'Foto eliminada correctamente' 
      }, { status: 200 });

    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Error eliminando foto:', error);
    return NextResponse.json({ error: 'Error interno del servidor al eliminar la imagen' }, { status: 500 });
  }
}