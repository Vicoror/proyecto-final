import { NextResponse } from "next/server";
import mysql from "mysql2/promise";

// Función para verificar el CAPTCHA con Google reCAPTCHA
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

// Método POST para iniciar sesión
export async function POST(req) {
  let db;

  try {
    // Obtener los datos del cuerpo de la solicitud
    const { email, password, captchaToken } = await req.json();

    // ✅ Validar el token del CAPTCHA
    const isCaptchaValid = await verifyCaptcha(captchaToken);
    if (!isCaptchaValid) {
      console.log("Captcha inválido");
      return NextResponse.json({ error: "Captcha inválido. Intenta nuevamente." }, { status: 403 });
    }
    console.log("Captcha válido");

    // Conectar a la base de datos (local o remota)
    db = await mysql.createConnection({
      host: "ballast.proxy.rlwy.net",
      user: "root",
      password: "UjoNIhdtAkcSYSzZBeNQKPejgbKulsyb",
      database: "mi_proyecto_final",
      port: 11561,
    });

    // Buscar usuario en la base de datos
    const [rows] = await db.execute(
      "SELECT id_cliente, nombre, correo, rol FROM crear_usuario WHERE correo = ? AND contraseña = ?",
      [email, password]
    );

    // Cerrar la conexión
    await db.end();

    // Validar si las credenciales son correctas
    if (rows.length === 0) {
      return NextResponse.json({ error: "Credenciales incorrectas" }, { status: 401 });
    }

    const user = rows[0]; // Extraer datos del usuario

    // Enviar respuesta con datos del usuario (sin contraseña)
    return NextResponse.json(
      { message: "Inicio de sesión exitoso", user },
      { status: 200 }
    );

  } catch (error) {
    if (db) await db.end(); // Asegurarse de cerrar la conexión
    return NextResponse.json(
      { error: "Error en el servidor: " + error.message },
      { status: 500 }
    );
  }
}
