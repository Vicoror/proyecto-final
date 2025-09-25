// app/api/recuperar-contrasena/route.js

import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

// Configuración de la base de datos usando variables de entorno CON PUERTO
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

// Función para validar el CAPTCHA usando Google reCAPTCHA
async function verifyCaptcha(token) {
  try {
    const secretKey = process.env.RECAPTCHA_SECRET_KEY;
    if (!secretKey) return false;
    if (!token || token === 'null' || token === 'undefined') return false;

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

// Función para crear el transporter de email
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
      rejectUnauthorized: false
    }
  });
}

// Función para crear la tabla de tokens si no existe
async function ensureResetTokensTable(connection) 
{
  try {
    // Crear tabla con foreign key usando id_cliente
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
    console.log('Tabla de tokens creada con foreign key a id_cliente');
  } catch (error) {
    console.error('Error creando tabla de tokens:', error.message);
    throw error;
  }
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

    const body = await request.json();
    const { email, captchaToken } = body;

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

    // Verificar si la tabla de tokens existe, si no crearla
    await ensureResetTokensTable(connection);

    // Consultar usuario por correo
    const [users] = await connection.query(
      'SELECT id_cliente, nombre FROM crear_usuario WHERE correo = ?',
      [email]
    );

    // Por seguridad, no revelamos si el email existe o no
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

    // Generar token seguro
    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = await bcrypt.hash(resetToken, 12);
    
    // Fecha de expiración (1 hora)
    // Usar 24 horas temporalmente
    const expiresAt = new Date(Date.now() + 3600000); // 1 hora
    const expiresAtUTC = expiresAt.toISOString().slice(0, 19).replace('T', ' ');

    // Eliminar tokens previos no utilizados para este usuario
   await connection.execute(
      'INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)',
      [user.id_cliente, tokenHash, expiresAtUTC]  // ← Usar expiresAtUTC
    );

    // Guardar nuevo token
    await connection.execute(
      'INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)',
      [user.id_cliente, tokenHash, expiresAt]
    );

    // Configurar transporter de email
    let transporter;
    try {
      transporter = createEmailTransporter();
      await transporter.verify();
      console.log('Servidor de email configurado correctamente');
    } catch (transporterError) {
      console.error('ERROR EN CONFIGURACIÓN DE EMAIL:', transporterError.message);
      
      if (transporterError.message.includes('Invalid login')) {
        return NextResponse.json(
          { error: 'Error de autenticación con el servicio de email. Verifica las credenciales.' },
          { status: 500 }
        );
      } else {
        return NextResponse.json(
          { error: 'Error de configuración del servidor de correo.' },
          { status: 500 }
        );
      }
    }

    // Crear enlace de restablecimiento
    const resetLink = `${process.env.NEXTAUTH_URL || process.env.APP_URL || 'http://localhost:3000'}/login/restablecer-contrasena?token=${resetToken}&email=${encodeURIComponent(email)}`;

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

    // Enviar el correo
    try {
      console.log('Intentando enviar correo de restablecimiento a:', email);
      const info = await transporter.sendMail(mailOptions);
      console.log('Correo de restablecimiento enviado. Message ID:', info.messageId);
      
    } catch (mailError) {
      console.error('ERROR AL ENVIAR CORREO:', mailError.message);
      
      if (mailError.code === 'EAUTH') {
        return NextResponse.json(
          { error: 'Error de autenticación con el servicio de email.' },
          { status: 500 }
        );
      } else {
        return NextResponse.json(
          { error: 'Error al enviar el correo. Por favor, intenta más tarde.' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Se ha enviado un enlace de restablecimiento a tu correo electrónico.',
      },
      { status: 200, headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );

  } catch (error) {
    console.error('Error general en el proceso:', error.message);
    
    if (error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED') {
      return NextResponse.json(
        { error: 'Error de conexión con la base de datos. Intenta más tarde.' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Error interno del servidor. Por favor, contacta al administrador.' },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}