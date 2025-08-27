// app/api/pedidos/cliente/[idCliente]/route.js
import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
});

export async function GET(request, { params }) {
  let connection;
  try {
    const { idCliente } = await params;
    
    if (!idCliente) {
      return NextResponse.json({ error: 'ID de cliente no válido' }, { status: 400 });
    }

    connection = await pool.getConnection();

    // 1. Obtener TODOS los pedidos del cliente
    const [pedidosRows] = await connection.execute(
      `SELECT * FROM pedidos WHERE id_cliente = ? ORDER BY fecha_creacion DESC`,
      [idCliente]
    );

    if (pedidosRows.length === 0) {
      return NextResponse.json({ 
        message: 'No se encontraron pedidos para este cliente',
        pedidos: [] 
      }, { status: 200 });
    }

    // 2. Para cada pedido, obtener sus productos
    const pedidosConProductos = await Promise.all(
      pedidosRows.map(async (pedido) => {
        const [productosRows] = await connection.execute(
          `SELECT * FROM purchase_items WHERE pedido_id = ?`,
          [pedido.id]
        );

        // Procesar materiales JSON
        const productosProcesados = productosRows.map(producto => {
  let materialesProcesados = {
    hilo: null,
    metal: null,
    metale: null, // Nota: parece que hay typo en el nombre (metale vs metal)
    piedra: null
  };

  try {
    if (producto.materiales) {
      let materialesData;
      
      // Si es string, parsear como JSON
      if (typeof producto.materiales === 'string') {
        materialesData = JSON.parse(producto.materiales);
      } 
      // Si ya es objeto, usar directamente
      else if (typeof producto.materiales === 'object') {
        materialesData = producto.materiales;
      }

      // Procesar la estructura específica
      if (materialesData) {
        materialesProcesados = {
          hilo: materialesData.hilo || null,
          metal: materialesData.metal || null,
          metale: materialesData.metale || null, // Manejar posible typo
          piedra: materialesData.piedra || null
        };
      }
    }
  } catch (e) {
    console.log('Error procesando materiales:', e);
    // En caso de error, mantener la estructura vacía
  }

    return {
    ...producto,
    materiales: materialesProcesados
  };
});

        return {
          ...pedido,
          productos: productosProcesados
        };
      })
    );

    return NextResponse.json({
      success: true,
      totalPedidos: pedidosConProductos.length,
      pedidos: pedidosConProductos
    });

  } catch (error) {
    console.error('Error fetching pedidos por cliente:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}