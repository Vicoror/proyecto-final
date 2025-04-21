// app/api/productos/route.js
import mysql from 'mysql2/promise';

// Configuración de la conexión a la base de datos
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

/**
 * Endpoint GET para obtener la lista de productos
 * Soporta filtrado por categoría y paginación básica
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoria = searchParams.get('categoria');
    const pagina = parseInt(searchParams.get('pagina')) || 1;
    const porPagina = parseInt(searchParams.get('porPagina')) || 10;

    // Calcular offset para paginación
    const offset = (pagina - 1) * porPagina;

    // Construir la consulta SQL
    let query = `
      SELECT 
        id_productos as id,
        nombre,
        precio,
        descripcion,
        categoria,
        imagen,
        activo,
        DATE_FORMAT(fecha_creacion, '%Y-%m-%d %H:%i:%s') as fecha_creacion
      FROM productos
      WHERE 1=1
    `;

    const params = [];

    // Aplicar filtro de categoría si existe
    if (categoria) {
      query += ' AND categoria = ?';
      params.push(categoria);
    }

    // Ordenación y paginación
    query += ' ORDER BY fecha_creacion DESC LIMIT ? OFFSET ?';
    params.push(porPagina, offset);

    // Obtener productos
    const [productos] = await pool.query(query, params);

    // Consulta para el total de productos (para paginación)
    let countQuery = 'SELECT COUNT(*) as total FROM productos WHERE 1=1';
    const countParams = [];

    if (categoria) {
      countQuery += ' AND categoria = ?';
      countParams.push(categoria);
    }

    const [[{ total }]] = await pool.query(countQuery, countParams);

    // Estructura de respuesta
    const responseData = {
      success: true,
      data: productos,
      paginacion: {
        paginaActual: pagina,
        porPagina,
        totalProductos: total,
        totalPaginas: Math.ceil(total / porPagina)
      },
      filtros: {
        categoria
      }
    };

    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60' // Cache de 1 minuto
      }
    });

  } catch (error) {
    console.error('Error al obtener productos:', error);
    
    return new Response(JSON.stringify({
      success: false,
      message: 'Error al obtener la lista de productos',
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}