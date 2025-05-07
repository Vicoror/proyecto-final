import mysql from "mysql2/promise";
import { NextResponse } from "next/server";  // Importa NextResponse

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

// Manejador para el método GET
export async function GET(req) {
  try {
    const [rows] = await pool.execute(
      "SELECT id, titulo, activo FROM anuncios ORDER BY actualizado_en DESC LIMIT 3"
    );
    return NextResponse.json(rows);  // Usa NextResponse para devolver la respuesta
  } catch (error) {
    console.error("Error en GET:", error);
    return NextResponse.json({ error: "Error al obtener anuncios." }, { status: 500 });
  }
}

// Manejador para el método POST
// Manejador para el método POST
export async function POST(req) {
  try {
    const { nuevosAnuncios } = await req.json();
    if (!Array.isArray(nuevosAnuncios)) {
      throw new Error("nuevosAnuncios no es un array");
    }

    const promises = nuevosAnuncios.map(({ id, titulo, activo }) => {
      // Si 'titulo' está vacío, lo reemplaza por una cadena vacía
      const validTitulo = titulo || "";
      // Si 'activo' no es un booleano, lo configura como 'false'
      const validActivo = typeof activo === "boolean" ? activo : false;

      return pool.execute("UPDATE anuncios SET titulo = ?, activo = ? WHERE id = ?", [
        validTitulo,
        validActivo,
        id,
      ]);
    });

    await Promise.all(promises);
    return NextResponse.json({ message: "Anuncios actualizados correctamente." });
  } catch (error) {
    console.error("Error en POST:", error);
    return NextResponse.json({ error: "Error al actualizar anuncios." }, { status: 500 });
  }
}
