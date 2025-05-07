import mysql from "mysql2/promise";
import { NextResponse } from "next/server";

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

// Manejador para el método PUT
export async function PUT(req, { params }) {
  try {
    // Accede al parámetro 'id' de la URL de la ruta
    const id = params.id;  // Asegúrate de usar 'params.id'
    
    // Obtén el cuerpo de la solicitud como JSON
    const { titulo, activo } = await req.json();

    // Realiza la actualización en la base de datos
    const [result] = await pool.execute(
      "UPDATE anuncios SET titulo = ?, activo = ? WHERE id = ?",
      [titulo, activo, id]
    );

    return NextResponse.json({ message: "Anuncio actualizado correctamente." });
  } catch (error) {
    console.error("Error en PUT:", error);
    return NextResponse.json({ error: "Error al actualizar el anuncio." }, { status: 500 });
  }
}
