import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import formidable from "formidable";

export const config = {
  api: {
    bodyParser: false,
  },
};

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '12345678',
  database: process.env.DB_NAME || 'mi_proyecto_final',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 10000 // Aumenta el timeout a 10 segundos
});

// Función para organizar productos por categoría
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

    // Búsqueda por ID específico
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

    // Búsqueda por palabra clave (nueva funcionalidad)
    if (search) {
      let table = type === 'personalizados' ? 'productos_personalizados' : 'productos';
      const nameField = type === 'personalizados' ? 'nombrePerso' : 'nombre';
      const idField = type === 'personalizados' ? 'id_productosPerso' : 'id_productos';

      const [rows] = await pool.query(
        `SELECT * FROM ${table} 
        WHERE ${nameField} LIKE ? OR ${idField} LIKE ?
        ORDER BY ${nameField}`,
        [`%${search}%`, `%${search}%`]
      );

      return new Response(JSON.stringify(rows), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Si no hay parámetros, devolver todos los productos activos organizados por categoría
    const [productos] = await pool.query(`
      SELECT * FROM productos 
      WHERE activo = true
      ORDER BY categoria, nombre
    `);

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
  return new Promise((resolve, reject) => {
    const form = new formidable.IncomingForm({
      keepExtensions: true,
      uploadDir: path.join(process.cwd(), 'public/uploads'),
      maxFileSize: 5 * 1024 * 1024 // 5MB
    });

    if (!fs.existsSync(form.uploadDir)) {
      fs.mkdirSync(form.uploadDir, { recursive: true });
    }

    form.parse(request, async (err, fields, files) => {
      if (err) {
        console.error('Error al parsear formulario:', err);
        return resolve(new Response(JSON.stringify({ message: 'Error al procesar el formulario' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }));
      }

      try {
        const { id, name, price, description, category, active } = fields;
        const image = files.image?.[0];

        const [existing] = await pool.query(
          'SELECT id_productos FROM productos WHERE id_productos = ?',
          [id]
        );

        if (existing.length > 0) {
          return resolve(new Response(JSON.stringify({
            message: 'El ID ya existe. Por favor use otro.'
          }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          }));
        }

        let imagePath = '';

        if (image) {
          const uniqueName = `${Date.now()}_${image.originalFilename}`;
          imagePath = `/uploads/${uniqueName}`;
          fs.renameSync(image.filepath, path.join(process.cwd(), 'public', 'uploads', uniqueName));
        }

        const [result] = await pool.query(
          'INSERT INTO productos (id_productos, nombre, precio, descripcion, categoria, imagen, activo) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [id, name, price, description, category, imagePath, active === 'true']
        );

        return resolve(new Response(JSON.stringify({
          success: true,
          id: result.insertId
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }));
      } catch (error) {
        console.error('Error al guardar producto:', error);
        return resolve(new Response(JSON.stringify({ message: error.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }));
      }
    });
  });
}

// La función PUT queda sin cambios
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

    const [existing] = await pool.query(
      `SELECT ${idField} FROM ${table} WHERE ${idField} = ?`,
      [id]
    );

    if (existing.length === 0) {
      return new Response(JSON.stringify({
        message: 'Producto no encontrado'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    let imagePath = null;
    let updateFields = {
      nombre: name,
      precio: parseFloat(price),
      categoria: category,
      activo: active ? 1 : 0
    };

    if (image && image.size > 0) {
      const uploadDir = path.join(process.cwd(), 'public/uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      imagePath = `/uploads/${Date.now()}_${image.name}`;
      const buffer = await image.arrayBuffer();
      fs.writeFileSync(path.join(process.cwd(), 'public', imagePath), Buffer.from(buffer));
      updateFields.imagen = imagePath;
    }

    if (type === 'principal' && description) {
      updateFields.descripcion = description;
    }

    const setClause = Object.keys(updateFields)
      .map(key => `${key} = ?`)
      .join(', ');

    const values = [...Object.values(updateFields), id];

    const [result] = await pool.query(
      `UPDATE ${table} SET ${setClause} WHERE ${idField} = ?`,
      values
    );

    if (result.affectedRows === 0) {
      return new Response(JSON.stringify({
        message: 'No se realizaron cambios en el producto'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Producto actualizado correctamente',
      changes: result.affectedRows
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error en API:', error);
    return new Response(JSON.stringify({
      message: 'Error al actualizar el producto',
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
