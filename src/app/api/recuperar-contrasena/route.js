// app/api/recuperar-contrasena/route.js

import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

const dbConfig = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 15000,
  acquireTimeout: 15000,
  timeout: 15000,
};

const pool = mysql.createPool(dbConfig);

async function verifyCaptcha(token) {
  try {
    const secretKey = process.env.RECAPTCHA_SECRET_KEY;
    if (!secretKey || !token || token === 'null' || token === 'undefined') return false;

    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${secretKey}&response=${token}`,
    });

    const data = await response.json();
    return data.success === true;
  } catch (error) {
    console.error('Error verificando CAPTCHA:', error.message);
    return false;
  }
}

function createEmailTransporter() {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    throw new Error('Variables de entorno de email no configuradas');
  }

  return nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
    secure: true,
    tls: {
      rejectUnauthorized: false,
    },
  });
}

async function ensureResetTokensTable(connection) {
  try {
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        token_hash VARCHAR(255) NOT NULL,
        expires_at DATETIME NOT NULL,
        used TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES crear_usuario(id_cliente) ON DELETE CASCADE,
        INDEX (token_hash),
        INDEX (expires_at)
      )
    `);
  } catch (error) {
    console.error('Error creando tabla de tokens:', error.message);
    throw error;
  }
}

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

    const body = await request.json();
    const { email, captchaToken } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email no proporcionado o formato incorrecto' },
        { status: 400 }
      );
    }

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

    await ensureResetTokensTable(connection);

    const [users] = await connection.query(
      'SELECT id_cliente, nombre FROM crear_usuario WHERE correo = ?',
      [email]
    );

    if (!users || users.length === 0) {
      return NextResponse.json(
        { 
          success: true, 
          message: 'Si el email existe en nuestro sistema, recibirás un enlace de recuperación.' 
        },
        { status: 200 }
      );
    }

    const user = users[0];

    // Marcar tokens anteriores como usados
    await connection.execute(
      'UPDATE password_reset_tokens SET used = 1 WHERE user_id = ? AND used = 0',
      [user.id_cliente]
    );

    // Generar token seguro
    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = await bcrypt.hash(resetToken, 12);

    // Fecha de expiración UTC (1 hora)
    const expiresAt = new Date(Date.now() + 3600000);
    const expiresAtUTC = expiresAt.toISOString().slice(0, 19).replace('T', ' ');

    // Insertar token nuevo
    await connection.execute(
      'INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)',
      [user.id_cliente, tokenHash, expiresAtUTC]
    );

    // Configurar y verificar transporter
    let transporter;
    try {
      transporter = createEmailTransporter();
      await transporter.verify();
    } catch (transporterError) {
      console.error('Error en configuración de email:', transporterError.message);
      return NextResponse.json(
        { error: 'Error de configuración del servidor de correo.' },
        { status: 500 }
      );
    }

    // Crear enlace de restablecimiento
    const resetLink = `${process.env.NEXTAUTH_URL || process.env.APP_URL || 'https://proyecto-final-zeta-ten.vercel.app/'}/login/restablecer-contrasena?token=${resetToken}&email=${encodeURIComponent(email)}`;

    const mailOptions = {
      from: `"Soporte Bernarda" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Restablecer contraseña - Bernarda Sierra',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #7B2710; text-align: center;">Restablecer Contraseña</h2>
          <p>Hola ${user.nombre},</p>
          <p>Recibimos una solicitud para restablecer tu contraseña. Haz clic en el siguiente enlace para crear una nueva contraseña:</p>
          <div style="text-align: center; margin: 25px 0;">
            <a href="${resetLink}" 
               style="background-color: #7B2710; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 5px; font-weight: bold;">
              Restablecer Contraseña
            </a>
          </div>
          <p style="color: #666; font-size: 0.9em;">
            O copia y pega este enlace en tu navegador:<br>
            <span style="word-break: break-all;">${resetLink}</span>
          </p>
          <p style="color: #ff6b6b; font-size: 0.9em;">
            ⚠️ Este enlace expirará en 1 hora por motivos de seguridad.
          </p>
          <p>Si no solicitaste restablecer tu contraseña, puedes ignorar este mensaje.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #666; font-size: 0.9em;">— El equipo de Bernarda Sierra</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json(
      {
        success: true,
        message: 'Se ha enviado un enlace de restablecimiento a tu correo electrónico.',
      },
      { status: 200, headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );

  } catch (error) {
    console.error('Error general en el proceso:', error.message);
    return NextResponse.json(
      { error: 'Error interno del servidor. Por favor, contacta al administrador.' },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}
