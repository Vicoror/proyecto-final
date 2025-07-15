import mysql from 'mysql2/promise';

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

// GET: obtener productos (con filtros y paginación opcional)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoria = searchParams.get('categoria');
    const pagina = parseInt(searchParams.get('pagina')) || 1;
    const porPagina = parseInt(searchParams.get('porPagina')) || 100;
    const offset = (pagina - 1) * porPagina;

    let query = `
      SELECT 
        id_productos AS id,
        nombre,
        precio,
        stock,
        descripcion,
        categoria,
        imagen,
        activo,
        DATE_FORMAT(fecha_creacion, '%Y-%m-%d %H:%i:%s') AS fecha_creacion
      FROM productos
      WHERE 1 = 1
    `;

    const params = [];

    if (categoria) {
      query += ' AND categoria = ?';
      params.push(categoria);
    }

    query += ' ORDER BY fecha_creacion DESC LIMIT ? OFFSET ?';
    params.push(porPagina, offset);

    const [productos] = await pool.query(query, params);

    // total para paginación
    let countQuery = 'SELECT COUNT(*) AS total FROM productos WHERE 1=1';
    const countParams = [];

    if (categoria) {
      countQuery += ' AND categoria = ?';
      countParams.push(categoria);
    }

    const [[{ total }]] = await pool.query(countQuery, countParams);

    return new Response(JSON.stringify({
      success: true,
      data: productos,
      paginacion: {
        paginaActual: pagina,
        porPagina,
        totalProductos: total,
        totalPaginas: Math.ceil(total / porPagina)
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error al obtener productos:', error);
    return new Response(JSON.stringify({
      success: false,
      message: 'Error al obtener productos',
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// PUT: actualizar stock y/o estado del producto
export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, stock, activo } = body;

    if (!id) {
      return new Response(JSON.stringify({
        success: false,
        message: 'ID del producto es obligatorio'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const fields = [];
    const values = [];

    if (stock !== undefined) {
      fields.push('stock = ?');
      values.push(stock);
    }

    if (activo !== undefined) {
      fields.push('activo = ?');
      values.push(activo);
    }

    if (fields.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        message: 'No se especificaron campos a actualizar'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    values.push(id); // para el WHERE

    const updateQuery = `
      UPDATE productos
      SET ${fields.join(', ')}
      WHERE id_productos = ?
    `;

    const [result] = await pool.query(updateQuery, values);

    if (result.affectedRows === 0) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Producto no encontrado o sin cambios'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Producto actualizado correctamente'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error en PUT:', error);
    return new Response(JSON.stringify({
      success: false,
      message: 'Error interno al actualizar el producto',
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
