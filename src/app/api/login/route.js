import { NextResponse } from "next/server";
import mysql from "mysql2/promise";
import bcrypt from 'bcryptjs';

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

    // Conectar a la base de datos
    db = await mysql.createConnection({
      host: "ballast.proxy.rlwy.net",
      user: "root",
      password: "UjoNIhdtAkcSYSzZBeNQKPejgbKulsyb",
      database: "mi_proyecto_final",
      port: 11561,
    });

    // ✅ MODIFICADO: Incluir el campo activar_usuario en la consulta
    const [users] = await db.execute(
      "SELECT id_cliente, nombre, correo, contraseña, rol, activar_usuario FROM crear_usuario WHERE correo = ?",
      [email]
    );

    // Verificar si el usuario existe
    if (users.length === 0) {
      await db.end();
      return NextResponse.json({ error: "Credenciales incorrectas" }, { status: 401 });
    }

    const user = users[0];

    // ✅ CORREGIDO: Comparar contraseña con bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.contraseña);
    
    if (!isPasswordValid) {
      await db.end();
      return NextResponse.json({ error: "Credenciales incorrectas" }, { status: 401 });
    }

    // ✅ NUEVO: Verificar si la cuenta está inactiva
    if (user.activar_usuario === 0) {
      await db.end();
      return NextResponse.json({ 
        error: "Cuenta inactiva",
        cuentaInactiva: true,
        userId: user.id_cliente
      }, { status: 403 });
    }

    // Cerrar la conexión
    await db.end();

    // ✅ Enviar respuesta exitosa (sin enviar la contraseña)
    const userWithoutPassword = {
      id_cliente: user.id_cliente,
      nombre: user.nombre,
      correo: user.correo,
      rol: user.rol
    };

    return NextResponse.json(
      { 
        message: "Inicio de sesión exitoso", 
        user: userWithoutPassword 
      },
      { status: 200 }
    );

  } catch (error) {
    if (db) await db.end();
    console.error("Error en login:", error);
    return NextResponse.json(
      { error: "Error en el servidor: " + error.message },
      { status: 500 }
    );
  }
}