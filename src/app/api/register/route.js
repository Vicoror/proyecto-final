import { NextResponse } from "next/server";
import mysql from "mysql2/promise";

export async function POST(req) {
  try {
    const { name, email, password } = await req.json();

    // Conectar a la base de datos
    const db = await mysql.createConnection({
      host: "localhost",
      user: "root",
      password: "12345678",
      database: "mi_proyecto_final",
      port: 3306, // Asegúrate de que MySQL esté en este puerto
    });

    // Verificar si el correo ya está registrado
    const [existingUser] = await db.execute(
      "SELECT * FROM crear_usuario WHERE correo = ?",
      [email]
    );

    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: "El correo ya está registrado" },
        { status: 400 }
      );
    }

    // Insertar nuevo usuario
    const [result] = await db.execute(
      "INSERT INTO crear_usuario (nombre, correo, contraseña) VALUES (?, ?, ?)",
      [name, email, password]
    );

    return NextResponse.json(
      { message: "Usuario registrado con éxito", id: result.insertId },
      { status: 201 }
    );

  } catch (error) {
    return NextResponse.json(
      { error: "Error en el servidor: " + error.message },
      { status: 500 }
    );
  }
}
