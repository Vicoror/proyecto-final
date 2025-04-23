import mysql from 'mysql2/promise';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

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

const organizarPorCategoria = (productos) => {
  return productos.reduce((acc, producto) => {
    if (!acc[producto.categoria]) {
      acc[producto.categoria] = [];
    }
    acc[producto.categoria].push({
      id: producto.id_productos,
      name: producto.nombre,
      price: producto.precio,
      description: producto.descripcion,
      image: producto.imagen,
      active: producto.activo
    });
    return acc;
  }, {});
};

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const type = searchParams.get('type');
    const search = searchParams.get('search');

    if (id) {
      let table = type === 'personalizados' ? 'productos_personalizados' : 'productos';
      const idField = type === 'personalizados' ? 'id_productosPerso' : 'id_productos';
      const [rows] = await pool.query(`SELECT * FROM ${table} WHERE ${idField} = ?`, [id]);
      if (rows.length === 0) {
        return new Response(JSON.stringify({ message: 'Producto no encontrado' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      return new Response(JSON.stringify(rows[0]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (search) {
      let table = type === 'personalizados' ? 'productos_personalizados' : 'productos';
      const nameField = type === 'personalizados' ? 'nombrePerso' : 'nombre';
      const idField = type === 'personalizados' ? 'id_productosPerso' : 'id_productos';
      const [rows] = await pool.query(
        `SELECT * FROM ${table} WHERE ${nameField} LIKE ? OR ${idField} LIKE ? ORDER BY ${nameField}`,
        [`%${search}%`, `%${search}%`]
      );
      return new Response(JSON.stringify(rows), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const [productos] = await pool.query(
      `SELECT * FROM productos WHERE activo = true ORDER BY categoria, nombre`
    );
    const productosPorCategoria = organizarPorCategoria(productos);
    return new Response(JSON.stringify(productosPorCategoria), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error en API:', error);
    return new Response(JSON.stringify({ message: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    const id = formData.get('id');
    const name = formData.get('name');
    const price = formData.get('price');
    const description = formData.get('description');
    const category = formData.get('category');
    const active = formData.get('active') === 'true';
    const image = formData.get('image');

    const [existing] = await pool.query('SELECT id_productos FROM productos WHERE id_productos = ?', [id]);
    if (existing.length > 0) {
      return new Response(JSON.stringify({ message: 'El ID ya existe. Por favor use otro.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    let imagePath = '';
    if (image && image.size > 0) {
      const buffer = await image.arrayBuffer();
      const base64Image = Buffer.from(buffer).toString('base64');
      const dataUrl = `data:${image.type};base64,${base64Image}`;
      const result = await cloudinary.uploader.upload(dataUrl);
      imagePath = result.secure_url;
    }

    const [insert] = await pool.query(
      'INSERT INTO productos (id_productos, nombre, precio, descripcion, categoria, imagen, activo) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, name, price, description, category, imagePath, active]
    );

    return new Response(JSON.stringify({ success: true, id: insert.insertId }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error en API:', error);
    return new Response(JSON.stringify({ message: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function PUT(request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'principal';
    const formData = await request.formData();

    const id = formData.get('id');
    const name = formData.get('name');
    const price = formData.get('price');
    const description = formData.get('description');
    const category = formData.get('category');
    const active = formData.get('active') === 'true';
    const image = formData.get('image');

    const table = type === 'personalizados' ? 'productos_personalizados' : 'productos';
    const idField = type === 'personalizados' ? 'id_productosPerso' : 'id_productos';

    const [existing] = await pool.query(`SELECT ${idField} FROM ${table} WHERE ${idField} = ?`, [id]);
    if (existing.length === 0) {
      return new Response(JSON.stringify({ message: 'Producto no encontrado' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    let updateFields = {
      nombre: name,
      precio: parseFloat(price),
      categoria: category,
      activo: active ? 1 : 0
    };

    if (image && image.size > 0) {
      const buffer = await image.arrayBuffer();
      const base64Image = Buffer.from(buffer).toString('base64');
      const dataUrl = `data:${image.type};base64,${base64Image}`;
      const result = await cloudinary.uploader.upload(dataUrl);
      updateFields.imagen = result.secure_url;
    }

    if (type === 'principal' && description) {
      updateFields.descripcion = description;
    }

    const setClause = Object.keys(updateFields).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(updateFields), id];

    const [result] = await pool.query(`UPDATE ${table} SET ${setClause} WHERE ${idField} = ?`, values);

    if (result.affectedRows === 0) {
      return new Response(JSON.stringify({ message: 'No se realizaron cambios en el producto' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ success: true, message: 'Producto actualizado correctamente', changes: result.affectedRows }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error en API:', error);
    return new Response(JSON.stringify({ message: 'Error al actualizar el producto', error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
