import { NextResponse } from 'next/server';
import mysql from "mysql2/promise";

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

export async function PUT(request, { params }) {
  let connection;
  try {
    const { id } = await context.params;
    const { descripcion_envio, precio_envio, activar_envio } = await request.json();

    if (!id) throw new Error('El ID del envío es obligatorio');

    const descripcionRegex = /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ\s.,;:¿?¡!()]*$/;
    if (!descripcionRegex.test(descripcion_envio)) {
      throw new Error('La descripción solo puede contener letras, números, espacios y signos de puntuación básicos');
    }
    if (descripcion_envio.length > 150) {
      throw new Error('La descripción no puede exceder 150 caracteres');
    }

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
      return NextResponse.json({ message: 'Envío no encontrado' }, { status: 404 });
    }

    const [updatedRow] = await connection.query(
      'SELECT * FROM tipo_envio WHERE id_envio = ?',
      [id]
    );

    return NextResponse.json({
      message: 'Envío actualizado correctamente',
      data: updatedRow[0]
    });

  } catch (error) {
    return NextResponse.json({ message: 'Error al actualizar', error: error.message }, { status: 400 });
  } finally {
    if (connection) connection.release();
  }
}
