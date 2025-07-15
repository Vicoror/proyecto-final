// app/api/recuperar-contrasena/route.js

import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import nodemailer from 'nodemailer';

// Configuración de la base de datos usando variables de entorno
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

const pool = mysql.createPool(dbConfig);

// Función para validar el CAPTCHA usando Google reCAPTCHA
async function verifyCaptcha(token) {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;

  const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `secret=${secretKey}&response=${token}`,
  });

  const data = await response.json();
  return data.success;
}

// POST para solicitar recuperación de contraseña
export async function POST(request) {
  let connection;

  try {
    if (request.method !== 'POST') {
      return NextResponse.json({ error: 'Método no permitido' }, { status: 405 });
    }

    const contentType = request.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return NextResponse.json(
        { error: 'Content-Type debe ser application/json' },
        { status: 415 }
      );
    }

    const { email, captchaToken } = await request.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email no proporcionado o formato incorrecto' },
        { status: 400 }
      );
    }

    // Validar captcha
    if (!captchaToken) {
      return NextResponse.json(
        { error: 'Token de captcha no proporcionado' },
        { status: 400 }
      );
    }
    const isCaptchaValid = await verifyCaptcha(captchaToken);
    if (!isCaptchaValid) {
      return NextResponse.json(
        { error: 'Captcha inválido. Intenta nuevamente.' },
        { status: 403 }
      );
    }

    connection = await pool.getConnection();

    const [users] = await connection.query(
      'SELECT contraseña FROM crear_usuario WHERE correo = ?',
      [email]
    );

    if (users.length === 0) {
      return NextResponse.json(
        { error: 'Correo no registrado' },
        { status: 404 }
      );
    }

    const password = users[0].contraseña;

    const transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const mailOptions = {
      from: `"Soporte Bernarda" <${process.env.EMAIL_FROM}>`,
      to: email,
      subject: 'Recuperación de contraseña - Bernarda Sierra',
      html: `
        <p>Hola,</p>
        <p>Solicitaste recuperar tu contraseña. Aquí está tu contraseña actual:</p>
        <p style="font-weight:bold; font-size:1.2em; color:#7B2710;">${password}</p>
        <p>Si no solicitaste este correo, por favor contáctanos inmediatamente.</p>
        <p>— El equipo de Bernarda Sierra</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json(
      {
        success: true,
        message: 'Tu contraseña ha sido enviada a tu correo electrónico',
      },
      {
        status: 200,
        headers: { 'Cache-Control': 'no-store, max-age=0' },
      }
    );
  } catch (error) {
    console.error('Error al enviar correo:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor al enviar el correo' },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}
