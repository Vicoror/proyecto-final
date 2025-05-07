import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'tu_usuario',
  password: process.env.DB_PASSWORD || 'tu_contraseña',
  database: process.env.DB_NAME || 'mi_proyecto_final',
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 11561,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export async function GET() {
  try {
    const connection = await pool.getConnection();

    const [carruselRows] = await connection.query(
      'SELECT imagen_url, texto, activo FROM carrusel LIMIT 5'
    );
    const [segundoRows] = await connection.query(
      'SELECT imagen_url, texto, activo FROM seccion_media LIMIT 1'
    );
    const [terceroRows] = await connection.query(
      'SELECT imagen_url, texto, activo FROM imagen_final LIMIT 1'
    );

    connection.release();

    return NextResponse.json({
      carrusel: carruselRows,
      segundo: segundoRows[0],
      tercero: terceroRows[0],
    });
  } catch (error) {
    console.error('Error al obtener presentación:', error);
    return NextResponse.json({ error: 'Error al obtener datos' }, { status: 500 });
  }
}
