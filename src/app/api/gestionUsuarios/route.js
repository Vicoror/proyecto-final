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

// GET - Obtener todos los usuarios
export async function GET() {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.execute(
      'SELECT id_cliente, nombre, apellidos, correo, fecha_registro, rol, activar_usuario FROM crear_usuario ORDER BY fecha_registro DESC LIMIT 30'
    );
    connection.release();
    
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Error al obtener los usuarios' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar usuario (rol o estado de activación)
export async function PUT(request) {
  try {
    const { id_cliente, rol, activar_usuario } = await request.json();
    
    if (!id_cliente) {
      return NextResponse.json(
        { error: 'ID de cliente es requerido' },
        { status: 400 }
      );
    }
    
    const connection = await pool.getConnection();
    
    // Construir la consulta dinámicamente según los campos proporcionados
    let query = 'UPDATE crear_usuario SET ';
    const values = [];
    
    if (rol !== undefined) {
      query += 'rol = ?';
      values.push(rol);
    }
    
    if (activar_usuario !== undefined) {
      if (values.length > 0) query += ', ';
      query += 'activar_usuario = ?';
      values.push(activar_usuario);
    }
    
    query += ' WHERE id_cliente = ?';
    values.push(id_cliente);
    
    const [result] = await connection.execute(query, values);
    connection.release();
    
    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Error al actualizar el usuario' },
      { status: 500 }
    );
  }
}