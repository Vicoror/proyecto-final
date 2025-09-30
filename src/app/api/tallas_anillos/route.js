import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 11561,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// 🔹 GET → todas las tallas disponibles o stock por producto
export async function GET(request) {
  try {
    const { searchParams } = request ? new URL(request.url) : { searchParams: null };

    // Si viene id_producto, devolvemos stock de ese producto
    if (searchParams && searchParams.get('id_producto')) {
      const id_producto = searchParams.get('id_producto');
      const mostrarTodas = searchParams.get('mostrar_todas');
      
      let query = `
        SELECT s.id_stock, s.id_talla, s.stock, t.talla
        FROM stock_anillos s 
        JOIN tallas_anillos t ON s.id_talla = t.id_talla
        WHERE s.id_producto = ?
      `;
      
      // Si no se pide mostrar todas, filtrar por stock >= 1
      if (!mostrarTodas) {
        query += ' AND s.stock >= 1';
      }
      
      query += ' ORDER BY t.talla';
      
      const [rows] = await pool.query(query, [id_producto]);
      
      // 🔹 SIEMPRE devolver un array
      return new Response(JSON.stringify(rows || []), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Si no viene id_producto, devolvemos todas las tallas
    const [rows] = await pool.query('SELECT * FROM tallas_anillos ORDER BY talla');
    return new Response(JSON.stringify(rows || []), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error("Error en GET tallas_anillos:", error);
    // 🔹 SIEMPRE devolver una respuesta
    return new Response(JSON.stringify({ 
      message: error.message,
      data: [] 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// 🔹 POST → agregar una talla
export async function POST(request) {
  try {
    const { talla } = await request.json();
    
    if (!talla) {
      return new Response(JSON.stringify({ message: "Falta el parámetro 'talla'" }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    await pool.query('INSERT INTO tallas_anillos (talla) VALUES (?)', [talla]);
    return new Response(JSON.stringify({ success: true, talla }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error("Error en POST tallas_anillos:", error);
    return new Response(JSON.stringify({ message: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// 🔹 PUT → actualizar stock de un producto/talla
export async function PUT(request) {
  try {
    const { id_stock, stock } = await request.json();

    if (!id_stock || stock == null) {
      return new Response(JSON.stringify({ message: "Faltan parámetros" }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    await pool.query('UPDATE stock_anillos SET stock = ? WHERE id_stock = ?', [stock, id_stock]);

    return new Response(JSON.stringify({ success: true, id_stock, stock }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error("Error en PUT stock_anillos:", error);
    return new Response(JSON.stringify({ message: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// 🔹 DELETE → eliminar una talla o un stock específico
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);

    const id_talla = searchParams.get('id_talla');
    const id_stock = searchParams.get('id_stock');

    if (id_stock) {
      await pool.query('DELETE FROM stock_anillos WHERE id_stock = ?', [id_stock]);
      return new Response(JSON.stringify({ success: true, id_stock }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (id_talla) {
      await pool.query('DELETE FROM tallas_anillos WHERE id_talla = ?', [id_talla]);
      return new Response(JSON.stringify({ success: true, id_talla }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ message: "Faltan parámetros (id_stock o id_talla)" }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error("Error en DELETE tallas/stock:", error);
    return new Response(JSON.stringify({ message: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// 🔹 IMPORTANTE: Manejar otros métodos HTTP
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
}