// app/api/crear-pedido/route.js
import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
};

export async function POST(request) {
  console.log('✅ POST recibido en /api/crear-pedido');

  try {
    const body = await request.json();
    const { 
      paymentIntentId, 
      cartItems = [], 
      envioSeleccionado = {}, 
      subtotal, 
      total, 
      userId  // ← id_cliente EXISTENTE
    } = body;

    // ✅ VALIDACIONES ESENCIALES
    if (!paymentIntentId) {
      return NextResponse.json({ success: false, error: 'paymentIntentId es requerido' }, { status: 400 });
    }

    if (!cartItems || cartItems.length === 0) {
      return NextResponse.json({ success: false, error: 'El carrito está vacío' }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json({ success: false, error: 'ID de cliente es requerido' }, { status: 400 });
    }

    // ✅ OBTENER MÉTODO DE PAGO REAL DESDE STRIPE
    let metodoPago = 'card'; // Valor por defecto
    
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      console.log('PaymentIntent detalles:', {
        id: paymentIntent.id,
        status: paymentIntent.status,
        payment_method: paymentIntent.payment_method,
        payment_method_types: paymentIntent.payment_method_types
      });

      // Detectar método de pago real
      if (paymentIntent.payment_method) {
        const paymentMethod = await stripe.paymentMethods.retrieve(paymentIntent.payment_method);
        metodoPago = paymentMethod.type; // 'card' o 'oxxo'
        console.log('Método de pago detectado:', metodoPago);
      } else if (paymentIntent.payment_method_types && paymentIntent.payment_method_types.includes('oxxo')) {
        metodoPago = 'oxxo';
      }
      
    } catch (stripeError) {
      console.warn('Error obteniendo detalles de Stripe, usando valor por defecto:', stripeError);
      // Mantener el valor por defecto 'card'
    }

    const connection = await mysql.createConnection(dbConfig);

    // ✅ GENERAR CÓDIGO DE PEDIDO ÚNICO
    const fecha = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const codigoPedido = `PED-${fecha}-${randomNum}`;

    // ✅ 1. INSERTAR EN TABLA PEDIDOS CON MÉTODO DE PAGO REAL
    const [pedidoResult] = await connection.execute(
      `INSERT INTO pedidos 
       (codigo_pedido, payment_intent_id, id_cliente, id_envio, tipo_envio, precio_envio, estado, subtotal, total, metodo_pago) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        codigoPedido,
        paymentIntentId,
        userId,  // ← id_cliente EXISTENTE
        envioSeleccionado.id_envio || null,
        envioSeleccionado.descripcion_envio || envioSeleccionado.tipo || 'Estándar',
        envioSeleccionado.precio_envio || 0,
        'en_proceso',
        subtotal || 0,
        total || 0,
        metodoPago  // ← 'card' o 'oxxo' en lugar de 'stripe'
      ]
    );

    const pedidoId = pedidoResult.insertId;
    console.log('Pedido principal creado ID:', pedidoId, 'Método pago:', metodoPago);

    // ✅ 2. INSERTAR ITEMS EN PURCHASE_ITEMS (tu estructura exacta)
    let itemsInsertados = 0;
    for (const item of cartItems) {
  try {
    const tipoProducto = item.tipo === 'personalizado' ? 'personalizado' : 'normal';
    const nombre = item.name || item.nombre || 'Producto';
    const precio = item.price || item.precio || 0;
    const cantidad = item.quantity || 1;
    const itemSubtotal = precio * cantidad;

    // Preparar materiales para JSON (solo si es personalizado)
    let materialesJSON = null;
    if (item.tipo === 'personalizado' && item.materiales) {
      materialesJSON = JSON.stringify(item.materiales);
    }

    // Insertar en purchase_items
    await connection.execute(
      `INSERT INTO purchase_items 
       (pedido_id, tipo_producto, nombre_producto, precio_unitario, cantidad, subtotal, categoria, imagen_principal, id_producto_normal, stock_original, id_producto_personalizado, tiempo_entrega_original, precio_mano_obra_original, materiales) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        pedidoId,
        tipoProducto,
        nombre,
        precio,
        cantidad,
        itemSubtotal,
        item.categoria || 'General',
        item.imagen || item.image || '',
        item.tipo === 'personalizado' ? null : item.id,  // id del producto normal
        item.stock || null,
        item.tipo === 'personalizado' ? item.id_ProPer || null : null,
        item.tiempoEntrega || null,
        item.PrecioManoObra || null,
        materialesJSON
      ]
    );

    // ✅ Actualizar stock solo si es producto normal
    if (tipoProducto === 'normal' && item.id) {
      const [updateResult] = await connection.execute(
        `UPDATE productos 
         SET stock = stock - ? 
         WHERE id_productos = ? AND stock >= ?`,
        [cantidad, item.id, cantidad]
      );

      if (updateResult.affectedRows > 0) {
        console.log(`Stock actualizado para producto ${item.id}: -${cantidad}`);
      } else {
        console.warn(`⚠️ No se pudo actualizar stock para producto ${item.id} (stock insuficiente o no existe)`);
      }
    }

    itemsInsertados++;
    console.log('Item insertado:', nombre);

  } catch (itemError) {
    console.error('Error insertando item:', item, 'Error:', itemError);
    // Continuar con los demás items
  }
}

    await connection.end();

    // ✅ RESPONDER ÉXITO CON MÉTODO DE PAGO REAL
    return NextResponse.json({
      success: true,
      pedido_id: pedidoId,
      codigo_pedido: codigoPedido,
      id_cliente: userId,
      items_count: itemsInsertados,
      total: total,
      metodo_pago: metodoPago,  // ← Incluir el método real en la respuesta
      message: 'Pedido creado exitosamente'
    });

  } catch (error) {
    console.error('Error general en API:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error procesando el pedido',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// Manejar otros métodos HTTP
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