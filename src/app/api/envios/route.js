import { NextResponse } from 'next/server';
import mysql from "mysql2/promise";

// Pool de conexiones
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

// GET → obtener todos los envíos
export async function GET() {
  let connection;
  try {
    connection = await pool.getConnection();
    const [rows] = await connection.query('SELECT * FROM tipo_envio ORDER BY id_envio ASC');

    // Si no hay registros, creamos 5 por defecto
    if (rows.length === 0) {
      await connection.query(`
        INSERT INTO tipo_envio (id_envio, descripcion_envio, precio_envio, activar_envio) 
        VALUES (1, '', 0, 0), (2, '', 0, 0), (3, '', 0, 0), (4, '', 0, 0), (5, '', 0, 0)
      `);

      const [newRows] = await connection.query('SELECT * FROM tipo_envio ORDER BY id_envio ASC');
      return NextResponse.json(newRows);
    }

    return NextResponse.json(rows);
  } catch (error) {
    return NextResponse.json(
      { message: 'Error al obtener los envíos', error: error.message },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}

// PUT → actualizar un envío
export async function PUT(request) {
  let connection;
  try {
    // Intentar obtener ID desde query params (ej. /api/envios?id=2)
    const { searchParams } = new URL(request.url);
    let id = searchParams.get("id");

    // Si no viene en la URL, leerlo del body
    const body = await request.json();
    if (!id) id = body.id;

    if (!id) {
      throw new Error('El ID del envío es obligatorio');
    }

    const { descripcion_envio, precio_envio, activar_envio } = body;

    // Validación de descripción
    const descripcionRegex = /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ\s.,;:¿?¡!()]*$/;
    if (!descripcionRegex.test(descripcion_envio)) {
      throw new Error('La descripción solo puede contener letras, números, espacios y signos de puntuación básicos');
    }
    if (descripcion_envio.length > 150) {
      throw new Error('La descripción no puede exceder 150 caracteres');
    }

    // Validación de precio
    const precioNum = Number(precio_envio);
    if (isNaN(precioNum) || precioNum < 0 || precioNum > 500) {
      throw new Error('El precio debe ser un número entre 0 y 500');
    }

    connection = await pool.getConnection();

    const [result] = await connection.query(
      `UPDATE tipo_envio 
       SET descripcion_envio = ?, precio_envio = ?, activar_envio = ? 
       WHERE id_envio = ?`,
      [descripcion_envio, precioNum, Number(!!activar_envio), id]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { message: 'Envío no encontrado' },
        { status: 404 }
      );
    }

    // Devolver registro actualizado
    const [updatedRow] = await connection.query(
      'SELECT * FROM tipo_envio WHERE id_envio = ?',
      [id]
    );

    return NextResponse.json({ 
      success: true,
      message: 'Envío actualizado correctamente',
      data: updatedRow[0]
    }, { status: 200 });

  } catch (error) {
    return NextResponse.json(
      { message: 'Error al actualizar el envío', error: error.message },
      { status: 400 }
    );
  } finally {
    if (connection) connection.release();
  }
}
