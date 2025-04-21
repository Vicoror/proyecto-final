import { query } from '@/lib/database';

export async function GET() {
  try {
    // Consulta que une las tablas de productos y stock
    const stockData = await query(`
      SELECT 
        p.id_productos,
        p.nombre,
        p.categoria,
        gs.id_stock,
        gs.cantidad_disponible,
        gs.stock_minimo
      FROM 
        productos p
      LEFT JOIN 
        gestion_stock gs ON p.id_productos = gs.id_productos
      ORDER BY p.nombre ASC
    `);
    
    return new Response(JSON.stringify(stockData), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ 
      message: "Error al obtener stock de productos",
      error: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function POST(request) {
  try {
    const { id_productos, cantidad_disponible } = await request.json();
    
    // Verificar si ya existe un registro para este producto
    const existing = await query(`
      SELECT * FROM gestion_stock 
      WHERE id_productos = ?
    `, [id_productos]);
    
    if (existing.length > 0) {
      return new Response(JSON.stringify({ 
        message: 'Ya existe un registro de stock para este producto'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Crear nuevo registro de stock con valores por defecto
    const result = await query(`
      INSERT INTO gestion_stock 
        (id_productos, cantidad_disponible, cantidad_reservada, stock_minimo, stock_maximo)
      VALUES 
        (?, ?, 0, 1, 100)
    `, [id_productos, cantidad_disponible]);
    
    return new Response(JSON.stringify({ 
      message: 'Stock agregado correctamente',
      id_stock: result.insertId 
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ 
      message: "Error al agregar stock",
      error: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function PUT(request) {
  try {
    const { id_stock, cantidad_disponible } = await request.json();
    
    await query(`
      UPDATE gestion_stock 
      SET cantidad_disponible = ? 
      WHERE id_stock = ?
    `, [cantidad_disponible, id_stock]);
    
    return new Response(JSON.stringify({ 
      message: 'Stock actualizado correctamente'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ 
      message: "Error al actualizar stock",
      error: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}