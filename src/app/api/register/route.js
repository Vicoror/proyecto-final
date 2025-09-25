import { NextResponse } from "next/server";
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";

// Función para validar el CAPTCHA con Google reCAPTCHA
async function verifyCaptcha(token) {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;

  const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: `secret=${secretKey}&response=${token}`,
  });

  const data = await response.json();
  return data.success;
}

export async function POST(req) {
  let db;
  try {
    // Recibimos name, email, password y captchaToken del frontend
    const { name, email, password, captchaToken } = await req.json();

    // Validar CAPTCHA antes de proceder
    const isCaptchaValid = await verifyCaptcha(captchaToken);
    if (!isCaptchaValid) {
      console.log("Captcha Inválido")
      return NextResponse.json({ error: "Captcha inválido. Intenta nuevamente." }, { status: 403 });
    }
    console.log("Captcha Válido")

    // Conectar a la base de datos
    const dbConfig = {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    };

    db = await mysql.createConnection(dbConfig);

    // Verificar si el correo ya está registrado
    const [existingUser] = await db.execute(
      "SELECT * FROM crear_usuario WHERE correo = ?",
      [email]
    );

    if (existingUser.length > 0) {
      await db.end();
      return NextResponse.json(
        { error: "El correo ya está registrado" },
        { status: 400 }
      );
    }

    // Encriptar la contraseña antes de guardarla
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insertar nuevo usuario con la contraseña encriptada
    const [result] = await db.execute(
      "INSERT INTO crear_usuario (nombre, correo, contraseña) VALUES (?, ?, ?)",
      [name, email, hashedPassword]
    );

    await db.end();

    return NextResponse.json(
      { message: "Usuario registrado con éxito", id: result.insertId },
      { status: 201 }
    );

  } catch (error) {
    if (db) await db.end();
    return NextResponse.json(
      { error: "Error en el servidor: " + error.message },
      { status: 500 }
    );
  }
}