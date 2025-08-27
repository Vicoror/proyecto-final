import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

// Reutilizar el mismo pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export async function GET() {
  let connection;
  try {
    connection = await pool.getConnection();

    const [pedidos] = await connection.execute(`
      SELECT p.*, c.nombre as cliente_nombre 
      FROM pedidos p 
      LEFT JOIN crear?usuario c ON p.id_cliente = c.id 
      ORDER BY p.fecha_creacion DESC
    `);

    return NextResponse.json(pedidos);

  } catch (error) {
    console.error('Error fetching pedidos:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

export async function POST(request) {
  let connection;
  try {
    const body = await request.json();
    
    connection = await pool.getConnection();

    const [result] = await connection.execute(
      `INSERT INTO pedidos (codigo_pedido, id_cliente, subtotal, total, metodo_pago) 
       VALUES (?, ?, ?, ?, ?)`,
      [body.codigo_pedido, body.id_cliente, body.subtotal, body.total, body.metodo_pago]
    );

    return NextResponse.json({ 
      message: 'Pedido creado correctamente',
      id: result.insertId 
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating pedido:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  } finally {
    if (connection) {
      connection.release();
    }
  }
}