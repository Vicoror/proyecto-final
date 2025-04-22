import { NextResponse } from "next/server";
import mysql from "mysql2/promise";

export async function POST(req) {
  let db;
  try {
    const { email, password } = await req.json();

    // Conectar a la base de datos
    db = await mysql.createConnection({
      host: "ballast.proxy.rlwy.net",
      user: "root",
      password: "UjoNIhdtAkcSYSzZBeNQKPejgbKulsyb",
      database: "mi_proyecto_final",
      port: 11561,
    });

    // Buscar usuario en la base de datos, incluyendo su rol
    const [rows] = await db.execute(
      "SELECT id_cliente, nombre, correo, rol FROM crear_usuario WHERE correo = ? AND contraseña = ?",
      [email, password]
    );

    // Cerrar la conexión
    await db.end();

    if (rows.length === 0) {
      return NextResponse.json({ error: "Credenciales incorrectas" }, { status: 401 });
    }

    // Extraer los datos del usuario
    const user = rows[0];

    return NextResponse.json({ 
      message: "Inicio de sesión exitoso", 
      user 
    }, { status: 200 });

  } catch (error) {
    if (db) await db.end(); // Cerrar la conexión si hubo un error
    return NextResponse.json({ error: "Error en el servidor: " + error.message }, { status: 500 });
  }
}
