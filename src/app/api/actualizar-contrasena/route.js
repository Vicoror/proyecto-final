import { NextResponse } from 'next/server'
import mysql from 'mysql2/promise'
import bcrypt from 'bcryptjs'

const dbConfig = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
}

const pool = mysql.createPool(dbConfig)

export async function POST(request) {
  let connection
  try {
    const { token, email, password } = await request.json()

    if (!token || !email || !password) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
    }

    connection = await pool.getConnection()

    // Buscar usuario
    const [users] = await connection.query(
      'SELECT id_cliente FROM crear_usuario WHERE correo = ?',
      [email]
    )

    if (users.length === 0) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    const user = users[0]

    // Buscar y validar token
    const [tokens] = await connection.query(
      `SELECT token_hash, expires_at, used 
      FROM password_reset_tokens 
      WHERE user_id = ? AND used = 0 AND expires_at > UTC_TIMESTAMP()`,  // ← UTC_TIMESTAMP()
      [user.id_cliente]
    );

    if (tokens.length === 0) {
      return NextResponse.json({ error: 'Token inválido o expirado' }, { status: 400 })
    }

    const tokenValid = await bcrypt.compare(token, tokens[0].token_hash)
    if (!tokenValid) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 400 })
    }

    // Actualizar contraseña
    const hashedPassword = await bcrypt.hash(password, 12)
    await connection.query(
      'UPDATE crear_usuario SET contraseña = ? WHERE id_cliente = ?',
      [hashedPassword, user.id_cliente]
    )

    // Marcar token como usado
    await connection.query(
      'UPDATE password_reset_tokens SET used = 1 WHERE id = ?',
      [tokens[0].id]
    )

    return NextResponse.json({ message: 'Contraseña actualizada correctamente' }, { status: 200 })

  } catch (error) {
    console.error('Error actualizando contraseña:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  } finally {
    if (connection) connection.release()
  }
}