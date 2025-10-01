import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import { v2 as cloudinary } from 'cloudinary';

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

// Configuración de Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const termino = searchParams.get('termino');
    const id = searchParams.get('id');
    const mode = searchParams.get('mode');

    // Modo para obtener solo materiales (metales, piedras, hilos)
    if (mode === 'materiales') {
      const [metales] = await pool.query('SELECT id_metal as id, nombreM as nombre FROM metal');
      const [piedras] = await pool.query('SELECT id_piedra as id, nombrePiedra as nombre FROM piedra');
      const [hilos] = await pool.query('SELECT id_hilo as id, color as nombre FROM hilo');
      
      return NextResponse.json({
        metales,
        piedras,
        hilos
      }, { status: 200 });
    }

    // Obtener producto específico por ID (para el formulario)
    if (id) {
      // 1. Obtener producto base
      const [producto] = await pool.query(
        'SELECT * FROM productospersonalizados WHERE id_ProPer = ?', 
        [id]
      );

      if (!producto.length) {
        return NextResponse.json(
          { error: 'Producto no encontrado' }, 
          { status: 404 }
        );
      }

      // 2. Obtener metales asociados
      const [metales] = await pool.query(`
        SELECT 
          m.id_metal as id,
          m.nombreM as nombre,
          pm.gramos,
          pm.ActivarM as activo
        FROM producto_metal pm
        JOIN metal m ON pm.id_metal = m.id_metal
        WHERE pm.id_ProPer = ?`, 
        [id]
      );

      // 3. Obtener piedras asociadas
      const [piedras] = await pool.query(`
        SELECT 
          p.id_piedra as id,
          p.nombrePiedra as nombre,
          pp.gramos,
          pp.ActivarP as activo
        FROM producto_piedra pp
        JOIN piedra p ON pp.id_piedra = p.id_piedra
        WHERE pp.id_ProPer = ?`,
        [id]
      );

      // 4. Obtener hilos asociados
      const [hilos] = await pool.query(`
        SELECT 
          h.id_hilo as id,
          h.color as nombre,
          ph.metros,
          ph.ActivarH as activo
        FROM producto_hilo ph
        JOIN hilo h ON ph.id_hilo = h.id_hilo
        WHERE ph.id_ProPer = ?`,
        [id]
      );

      return NextResponse.json({
        ...producto[0],
        metales: metales || [],
        piedras: piedras || [],
        hilos: hilos || []
      }, { status: 200 });
    }

    // Búsqueda por término (para el buscador)
    if (termino && termino.trim().length >= 3) {
      const terminoBusqueda = `%${termino}%`;
      
      const [productos] = await pool.query(
        `SELECT 
          id_ProPer, 
          nombreModelo, 
          categoria, 
          ImagenPP
         FROM productospersonalizados
         WHERE nombreModelo LIKE ? OR categoria LIKE ?
         ORDER BY nombreModelo
         LIMIT 20`,
        [terminoBusqueda, terminoBusqueda]
      );

      return NextResponse.json(productos, { status: 200 });
    }

    // Si no hay parámetros, devolver lista básica de productos
    const [productos] = await pool.query(
      'SELECT id_ProPer, nombreModelo, categoria, ImagenPP FROM productospersonalizados'
    );
    return NextResponse.json(productos, { status: 200 });

  } catch (error) {
    console.error('Error en la API:', error);
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
}
// app/api/productosPersonalizados/route.js (parte PUT)
export async function PUT(request) {
  let connection;
  
  try {
    let datos;
    const contentType = request.headers.get('content-type');
    
    // Manejar tanto JSON como FormData
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      datos = JSON.parse(formData.get('datos'));
      
      // Procesar imagen si existe
      const imagen = formData.get('imagen');
      if (imagen && imagen.size > 0) {
        // Convertir la imagen a buffer
        const bytes = await imagen.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Subir a Cloudinary usando promesas
        const resultado = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            { 
              folder: "productosPersonalizados",
              resource_type: "auto"
            },
            (error, result) => {
              if (error) {
                reject(new Error("Error al subir la imagen a Cloudinary"));
              } else {
                resolve(result);
              }
            }
          ).end(buffer);
        });

        // Asignar la nueva URL de la imagen
        datos.ImagenPP = resultado.secure_url;
      }

    } else {
      datos = await request.json();
    }

    // Validación básica
    if (!datos.id_ProPer || !datos.nombreModelo || !datos.categoria) {
      return NextResponse.json(
        { success: false, message: 'Datos incompletos' },
        { status: 400 }
      );
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    // 1. Actualizar producto base - Asegúrate que ImagenPP se actualice
    await connection.query(
      `UPDATE productospersonalizados 
       SET nombreModelo = ?, categoria = ?, tiempoEntrega = ?, 
           PrecioManoObra = ?, Activar = ?, ImagenPP = ?
       WHERE id_ProPer = ?`,
      [
        datos.nombreModelo,
        datos.categoria,
        datos.tiempoEntrega || 1,
        datos.PrecioManoObra || 0,
        datos.Activar ? 1 : 0,
        datos.ImagenPP || null, // ✅ Aquí se actualiza la imagen
        datos.id_ProPer
      ]
    );

    // 2. Actualizar relaciones con materiales
    await actualizarMateriales(connection, datos.id_ProPer, datos.metales, 'producto_metal', 'id_metal', 'gramos', 'ActivarM');
    await actualizarMateriales(connection, datos.id_ProPer, datos.piedras, 'producto_piedra', 'id_piedra', 'gramos', 'ActivarP');
    await actualizarMateriales(connection, datos.id_ProPer, datos.hilos, 'producto_hilo', 'id_hilo', 'metros', 'ActivarH');

    await connection.commit();
    connection.release();

    return NextResponse.json(
      { success: true, message: 'Producto actualizado correctamente' },
      { status: 200 }
    );

  } catch (error) {
    if (connection) {
      await connection.rollback();
      connection.release();
    }
    console.error('Error en PUT:', error);
    return NextResponse.json(
      { success: false, message: 'Error al actualizar producto', error: error.message },
      { status: 500 }
    );
  }
}

// Función auxiliar para actualizar materiales
async function actualizarMateriales(connection, productId, materiales, tableName, idColumn, valueColumn, activarColumn) {
  // 1. Eliminar relaciones existentes
  await connection.query(
    `DELETE FROM ${tableName} WHERE id_ProPer = ?`,
    [productId]
  );

  // 2. Insertar nuevas relaciones
  if (materiales && materiales.length > 0) {
    const valores = materiales
      .filter(m => m[activarColumn])
      .map(m => [
        productId,
        m.id,
        m[valueColumn] || 0,
        1 // Activar = true
      ]);

    if (valores.length > 0) {
      await connection.query(
        `INSERT INTO ${tableName} 
         (id_ProPer, ${idColumn}, ${valueColumn}, ${activarColumn}) 
         VALUES ?`,
        [valores]
      );
    }
  }
}