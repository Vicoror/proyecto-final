import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

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
        'SELECT phone_e164, default_message, help, terminos, updated_at FROM whatsapp_config WHERE id = 1'
      );
      
      if (!rows.length) {
        return NextResponse.json({ phone_e164: null, default_message: null, help: null, terminos: null }, { status: 200 });
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
    const { phone_e164, default_message, help, terminos, updated_by } = await request.json();

    // Validaciones básicas
    if (!phone_e164 || !isE164(phone_e164)) {
      return NextResponse.json({ error: 'phone_e164 debe ir en formato E.164, por ejemplo +5215512345678' }, { status: 400 });
    }

    if (!terminos || terminos.trim().length === 0) {
      return NextResponse.json({ error: 'El campo de términos no puede estar vacío' }, { status: 400 });
    }

    const connection = await pool.getConnection();
    try {
      await connection.execute(
        `INSERT INTO whatsapp_config (id, phone_e164, default_message, help, terminos, updated_by) 
         VALUES (1, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE 
           phone_e164 = VALUES(phone_e164), 
           default_message = VALUES(default_message), 
           help = VALUES(help),
           terminos = VALUES(terminos),
           updated_by = VALUES(updated_by)`,
        [phone_e164, default_message || null, help || null, terminos, updated_by || null]
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

// POST: inactivar cuenta de usuario
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