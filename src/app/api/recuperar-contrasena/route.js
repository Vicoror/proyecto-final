// app/api/recuperar-contrasena/route.js
import { NextResponse } from 'next/server'
import mysql from 'mysql2/promise'

// Configuración de la conexión a la base de datos
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
}

const pool = mysql.createPool(dbConfig)

export async function POST(request) {
  let connection
  try {
    // Verificar el método y contenido
    if (request.method !== 'POST') {
      return NextResponse.json(
        { error: 'Método no permitido' },
        { status: 405 }
      )
    }

    const contentType = request.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      return NextResponse.json(
        { error: 'Content-Type debe ser application/json' },
        { status: 415 }
      )
    }

    const { email } = await request.json()

    // Validación básica del email
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email no proporcionado o formato incorrecto' },
        { status: 400 }
      )
    }

    // Obtener conexión explícita
    connection = await pool.getConnection()

    // Verificar si el email existe
    const [users] = await connection.query(
      'SELECT id FROM usuarios WHERE email = ?',
      [email]
    )

    if (users.length === 0) {
      return NextResponse.json(
        { error: 'No existe una cuenta con este correo electrónico' },
        { status: 404 }
      )
    }

    // Simular envío de correo (en producción usarías nodemailer)
    console.log(`Solicitud de recuperación recibida para: ${email}`)

    return NextResponse.json(
      {
        success: true,
        message: 'Si el email existe, recibirás instrucciones para restablecer tu contraseña'
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, max-age=0'
        }
      }
    )

  } catch (error) {
    console.error('Error en el servidor:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  } finally {
    if (connection) connection.release()
  }
}