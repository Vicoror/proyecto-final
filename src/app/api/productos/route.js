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
      image2: producto.imagen2,
      image3: producto.imagen3,
      stock: producto.stock,
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

      let producto = rows[0];

      // 🔹 Si es un anillo, traer tallas con stock
      if (producto.categoria === "Anillos") {
        const [tallas] = await pool.query(
          `SELECT t.talla, s.stock 
           FROM stock_anillos s
           JOIN tallas_anillos t ON s.id_talla = t.id_talla
           WHERE s.id_producto = ?`,
          [producto.id_productos]
        );
        producto.tallas = tallas;
      }

      return new Response(JSON.stringify(producto), {
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
    const stock = parseInt(formData.get('stock'), 10);
    const active = formData.get('active') === 'true';
    const stockPorTalla = formData.get('stockPorTalla')
      ? JSON.parse(formData.get('stockPorTalla'))
      : null;

    const image = formData.get('image');
    const image2 = formData.get('image2');
    const image3 = formData.get('image3');

    const [existing] = await pool.query('SELECT id_productos FROM productos WHERE id_productos = ?', [id]);
    if (existing.length > 0) {
      return new Response(JSON.stringify({ message: 'El ID ya existe. Por favor use otro.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const subirImagen = async (img) => {
      if (img && img.size > 0) {
        const buffer = await img.arrayBuffer();
        const base64 = Buffer.from(buffer).toString('base64');
        const dataUrl = `data:${img.type};base64,${base64}`;
        const result = await cloudinary.uploader.upload(dataUrl);
        return result.secure_url;
      }
      return "";
    };

    const imageUrl = await subirImagen(image);
    const image2Url = await subirImagen(image2);
    const image3Url = await subirImagen(image3);

    await pool.query(
      'INSERT INTO productos (id_productos, nombre, precio, descripcion, categoria, imagen, imagen2, imagen3, stock, activo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, name, price, description, category, imageUrl, image2Url, image3Url, stock, active]
    );

    // 🔹 Guardar stock por talla si es anillo
    // 🔹 Guardar stock por talla si es anillo
       // Guardar stock por talla si es anillo
      if (category === "Anillos" && stockPorTalla) {
        for (const [id_talla, stockValue] of Object.entries(stockPorTalla)) {
          const stockInt = stockValue === "" ? 0 : parseInt(stockValue, 10);
          await pool.query(
            'INSERT INTO stock_anillos (id_producto, id_talla, stock) VALUES (?, ?, ?)',
            [id, id_talla, stockInt]
          );
        }
      }



    return new Response(JSON.stringify({ success: true, id }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error en API POST:', error);
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
    const stock = parseInt(formData.get('stock'), 10);
    const active = formData.get('active') === 'true';
    const stockPorTalla = formData.get('stockPorTalla')
      ? JSON.parse(formData.get('stockPorTalla'))
      : null;

    const image = formData.get('image');
    const image2 = formData.get('image2');
    const image3 = formData.get('image3');

    const table = type === 'personalizados' ? 'productos_personalizados' : 'productos';
    const idField = type === 'personalizados' ? 'id_productosPerso' : 'id_productos';

    const [existing] = await pool.query(`SELECT ${idField} FROM ${table} WHERE ${idField} = ?`, [id]);
    if (existing.length === 0) {
      return new Response(JSON.stringify({ message: 'Producto no encontrado' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const subirImagen = async (img) => {
      if (img && img.size > 0) {
        const buffer = await img.arrayBuffer();
        const base64 = Buffer.from(buffer).toString('base64');
        const dataUrl = `data:${img.type};base64,${base64}`;
        const result = await cloudinary.uploader.upload(dataUrl);
        return result.secure_url;
      }
      return "";
    };

    const updateFields = {
      nombre: name,
      precio: parseFloat(price),
      categoria: category,
      stock,
      activo: active ? 1 : 0
    };

    if (description) updateFields.descripcion = description;
    if (image && image.size > 0) updateFields.imagen = await subirImagen(image);
    if (image2 && image2.size > 0) updateFields.imagen2 = await subirImagen(image2);
    if (image3 && image3.size > 0) updateFields.imagen3 = await subirImagen(image3);

    const setClause = Object.keys(updateFields).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(updateFields), id];

    await pool.query(`UPDATE ${table} SET ${setClause} WHERE ${idField} = ?`, values);

    // 🔹 Actualizar stock por talla
    if (category === "Anillos" && stockPorTalla) {
      for (const talla of stockPorTalla) {
        await pool.query(
          `INSERT INTO stock_anillos (id_producto, id_talla, stock) 
           VALUES (?, ?, ?)
           ON DUPLICATE KEY UPDATE stock = VALUES(stock)`,
          [id, talla.id_talla, talla.stock]
        );
      }
    }

    return new Response(JSON.stringify({ success: true, message: 'Producto actualizado correctamente' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error en API PUT:', error);
    return new Response(JSON.stringify({ message: 'Error al actualizar el producto', error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
