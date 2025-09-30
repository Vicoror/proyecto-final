import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import Stripe from 'stripe';
import nodemailer from 'nodemailer';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
};

// Nodemailer
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
  tls: { rejectUnauthorized: false },
});

// Función para formatear materiales legiblemente
const formatMateriales = (materiales) => {
  if (!materiales) return '';
  let str = '';
  for (const key of Object.keys(materiales)) {
    const mat = materiales[key];
    if (mat) {
      str += `${key}: ${mat.nombre || mat.color || ''}\n`;
    }
  }
  return str;
};

export async function POST(req) {
  try {
    const body = await req.json();
    const { paymentIntentId, cartItems = [], envioSeleccionado = {}, subtotal, total, userId } = body;

    if (!paymentIntentId || !cartItems.length || !userId) {
      return NextResponse.json({ success: false, error: 'Datos incompletos' }, { status: 400 });
    }

    let metodoPago = 'card';
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      if (paymentIntent.payment_method) {
        const paymentMethod = await stripe.paymentMethods.retrieve(paymentIntent.payment_method);
        metodoPago = paymentMethod.type;
      } else if (paymentIntent.payment_method_types?.includes('oxxo')) {
        metodoPago = 'oxxo';
      }
    } catch (e) {
      console.warn('Stripe error:', e);
    }

    const connection = await mysql.createConnection(dbConfig);

    // Obtener datos del cliente
    const [userRows] = await connection.execute(
      `SELECT id_cliente, nombre, apellidos, correo FROM crear_usuario WHERE id_cliente = ? LIMIT 1`,
      [userId]
    );
    const user = userRows[0];
    const userEmail = user ? user.correo : null;

    // Dirección
    const [direccionRows] = await connection.execute(
      `SELECT * FROM direccion WHERE id_cliente = ? LIMIT 1`,
      [userId]
    );
    const direccion = direccionRows[0] || {};
    const direccionText = direccion
      ? `${direccion.calle || ''} ${direccion.numExt || ''} ${direccion.numInt || ''}, ${direccion.colonia || ''}, ${direccion.municipio || ''}, ${direccion.estado || ''}, C.P. ${direccion.codPostal || ''}`
      : 'No proporcionada';

    // Teléfonos
    const [telefonosRows] = await connection.execute(
      `SELECT * FROM telefonos_usuario WHERE id_cliente = ?`,
      [userId]
    );
    const telefonoText = telefonosRows.length
      ? `Principal: ${telefonosRows[0].telefono_principal || 'N/A'}, Secundario: ${telefonosRows[0].telefono_secundario || 'N/A'}`
      : 'No proporcionados';

    const fecha = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const codigoPedido = `PED-${fecha}-${randomNum}`;

    // Insertar pedido
    const [pedidoResult] = await connection.execute(
      `INSERT INTO pedidos 
       (codigo_pedido, payment_intent_id, id_cliente, id_envio, tipo_envio, precio_envio, estado, subtotal, total, metodo_pago) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        codigoPedido,
        paymentIntentId,
        userId,
        envioSeleccionado.id_envio || null,
        envioSeleccionado.descripcion_envio || envioSeleccionado.tipo || 'Estándar',
        envioSeleccionado.precio_envio || 0,
        'en_proceso',
        subtotal || 0,
        total || 0,
        metodoPago
        
      ]
    );
    const pedidoId = pedidoResult.insertId;

    // Insertar items
    for (const item of cartItems) {
      try {
        const tipoProducto = item.tipo === 'personalizado' ? 'personalizado' : 'normal';
        const nombre = item.name || item.nombre || 'Producto';
        const precio = item.price || item.precio || 0;
        const cantidad = item.quantity || 1;
        const itemSubtotal = precio * cantidad;

        let categoria = 'General';
        if ((item.tipo === 'normal' || item.tipo === undefined) && item.id) {
          const [producto] = await connection.execute(
            `SELECT categoria FROM productos WHERE id_productos = ?`,
            [item.id]
          );
          if (producto.length > 0) categoria = producto[0].categoria;
        } else if (item.tipo === 'personalizado') {
          categoria = item.categoria || 'Personalizado';
        }

        let materialesJSON = null;
        if (item.tipo === 'personalizado' && item.materiales) {
          materialesJSON = JSON.stringify(item.materiales);
        }

          console.log('Item a insertar:', item);

await connection.execute(
  `INSERT INTO purchase_items 
   (pedido_id, tipo_producto, nombre_producto, precio_unitario, cantidad, subtotal, categoria, imagen_principal, id_producto_normal, stock_original, id_producto_personalizado, tiempo_entrega_original, precio_mano_obra_original, materiales, talla) 
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  [
    pedidoId,
    tipoProducto,
    nombre,
    precio,
    cantidad,
    itemSubtotal,
    categoria,
    item.imagen || item.image || '',
    item.tipo === 'personalizado' ? null : item.id,
    item.stock || null,
    item.tipo === 'personalizado' ? item.id_ProPer || null : null,
    item.tiempoEntrega || null,
    item.PrecioManoObra || null,
    materialesJSON,
    item.talla || null
  ]
);

      // Descontar stock productos normales
      if (tipoProducto === 'normal' && item.id && item.categoria !== 'Anillos') {
        console.log('Descontando stock producto normal:', item.id, cantidad);
        await connection.execute(
          `UPDATE productos SET stock = stock - ? WHERE id_productos = ? AND stock >= ?`,
          [cantidad, item.id, cantidad]
        );
      }

// Descontar stock anillos
        if (item.categoria === 'Anillos' && item.talla) {
          console.log('Descontando stock anillos:', item.id, item.talla, cantidad);
          await connection.execute(
            `UPDATE stock_anillos 
            SET stock = stock - ? 
            WHERE id_stock = ? AND stock >= ?`,
            [cantidad, item.id_stock, cantidad]
          );
        }
// Después de descontar stock anillos
console.log('✅ Stock descontado para anillo:', {
  id_producto: item.id,
  id_stock: item.id_stock,
  talla: item.talla,
  cantidad_descontada: cantidad
});

// Verificar stock actual
const [stockActual] = await connection.execute(
  `SELECT stock FROM stock_anillos WHERE id_stock = ?`,
  [item.id_stock]
);
console.log('📦 Stock actualizado:', stockActual[0].stock);

      } catch (itemError) {
        console.error('Error insertando item:', itemError);
      }
    }

    // Correos de admins
    const [admins] = await connection.execute(
      `SELECT correo FROM crear_usuario WHERE rol = 'admin'`
    );
    const adminEmails = admins.map(a => a.correo);

    await connection.end();

    // Crear resumen HTML con materiales, dirección y teléfono
    const itemsHTML = cartItems.map((i) => {
      let materialesText = '';
      if (i.materiales) {
        materialesText = '<p><b>Materiales:</b><br>' + formatMateriales(i.materiales).replace(/\n/g,'<br>') + '</p>';
      }
      let imagenTag = '';
      if (i.imagen || i.image) {
        imagenTag = `<img src="${i.imagen || i.image}" alt="${i.nombre || i.name}" style="max-width:150px;"/>`;
      }
      return `<div style="margin-bottom:10px">
          <p><b>${i.nombre || i.name}</b> x ${i.quantity || 1} → $${(i.price || i.precio) * (i.quantity || 1)}</p>
          ${i.talla ? `<p><b>Talla:</b> ${i.talla}</p>` : ''}
          ${materialesText}
          ${imagenTag}
        </div>`;
    }).join("");

    const resumenHTML = `
      <h2>Pedido ${codigoPedido}</h2>
      <p><b>Cliente:</b> ${user.nombre} ${user.apellidos}</p>
      <p><b>Correo:</b> ${userEmail}</p>
      <p><b>Teléfonos:</b> ${telefonoText}</p>
      <p><b>Dirección:</b> ${direccionText}</p>
      <p><b>Método de pago:</b> ${metodoPago}</p>
      <p><b>Tipo de envío:</b> ${envioSeleccionado.tipo || envioSeleccionado.descripcion_envio || 'Estándar'}</p>
      <p><b>Precio de envío:</b> $${envioSeleccionado.precio_envio || 0}</p>
      <p><b>Subtotal:</b> $${subtotal}</p>
      <p><b>Total:</b> $${total}</p>
      <h3>Artículos:</h3>
      ${itemsHTML}
    `;

    // Correo cliente
    if (userEmail) {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: userEmail,
        subject: `Confirmación de tu pedido ${codigoPedido}`,
        html: `<h2>¡Gracias por tu compra!</h2><p>Tu pedido ha sido procesado con éxito.</p>${resumenHTML}`,
      });
    }

    // Correo admins
    if (adminEmails.length > 0) {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: adminEmails,
        subject: `Nuevo pedido recibido ${codigoPedido}`,
        html: `<h2>Nuevo pedido recibido</h2><p>ID Cliente: ${userId}</p>${resumenHTML}`,
      });
    }

    return NextResponse.json({
      success: true,
      pedido_id: pedidoId,
      codigo_pedido: codigoPedido,
      id_cliente: userId,
      total,
      metodo_pago: metodoPago,
      message: 'Pedido creado y correos enviados'
    });

  } catch (error) {
    console.error('Error general en API:', error);
    return NextResponse.json(
      { success: false, error: 'Error procesando el pedido', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Método no permitido' }, { status: 405 });
}

export async function OPTIONS() {
  return new NextResponse(null, { 
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
}
