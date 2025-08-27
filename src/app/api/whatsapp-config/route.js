// /app/api/whatsapp-config/route.js
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
  // E.164: + seguido de 8 a 15 dígitos (rango práctico)
  return /^\+[1-9]\d{7,14}$/.test(phone);
}

export async function GET() {
  try {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(
        'SELECT phone_e164, default_message, updated_at FROM whatsapp_config WHERE id = 1'
      );
      
      if (!rows.length) {
        return NextResponse.json({ phone_e164: null, default_message: null }, { status: 200 });
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

export async function PUT(request) {
  try {
    const { phone_e164, default_message, updated_by } = await request.json();

    if (!phone_e164 || !isE164(phone_e164)) {
      return NextResponse.json({ error: 'phone_e164 debe ir en formato E.164, por ejemplo +5215512345678' }, { status: 400 });
    }

    const connection = await pool.getConnection();
    try {
      await connection.execute(
        `INSERT INTO whatsapp_config (id, phone_e164, default_message, updated_by) 
         VALUES (1, ?, ?, ?)
         ON DUPLICATE KEY UPDATE 
           phone_e164 = VALUES(phone_e164), 
           default_message = VALUES(default_message), 
           updated_by = VALUES(updated_by)`,
        [phone_e164, default_message || null, updated_by || null]
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