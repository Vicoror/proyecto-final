// app/api/gestionPedidos/route.js
import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import mysql from 'mysql2/promise';

// Configuración del transporter de nodemailer
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Configuración de la conexión a la base de datos
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

// Crear pool de conexiones
const pool = mysql.createPool(dbConfig);

// Función para procesar materiales
const procesarMateriales = (producto) => {
  let materialesProcesados = {
    hilo: null,
    metal: null,
    metale: null,
    piedra: null
  };

  try {
    if (producto.materiales) {
      let materialesData;
      
      // Si es string, parsear como JSON
      if (typeof producto.materiales === 'string') {
        materialesData = JSON.parse(producto.materiales);
      } 
      // Si ya es objeto, usar directamente
      else if (typeof producto.materiales === 'object') {
        materialesData = producto.materiales;
      }

      // Procesar la estructura específica
      if (materialesData) {
        materialesProcesados = {
          hilo: materialesData.hilo || null,
          metal: materialesData.metal || null,
          metale: materialesData.metale || null,
          piedra: materialesData.piedra || null
        };
      }
    }
  } catch (e) {
    console.log('Error procesando materiales:', e);
    // En caso de error, mantener la estructura vacía
  }

  return {
    ...producto,
    materiales: materialesProcesados
  };
};

// GET: Obtener pedidos o un pedido específico
export async function GET(request) {
  let connection;
  try {
    connection = await pool.getConnection();
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (id) {
      // Obtener un pedido específico con toda su información
      const [pedidoRows] = await connection.execute(
        `SELECT p.*, 
                cu.nombre as nombre_cliente, 
                cu.apellidos as apellidos_cliente, 
                cu.correo as correo_cliente,
                CONCAT_WS(' ', 
                  d.calle, 
                  d.numExt, 
                  IFNULL(CONCAT('Int. ', d.numInt), ''),
                  d.colonia, 
                  d.municipio, 
                  d.estado, 
                  d.codPostal,
                  IFNULL(d.infAdicional, '')
                ) as direccion_completa,
                tu.telefono_principal,
                tu.telefono_secundario
         FROM pedidos p
         LEFT JOIN crear_usuario cu ON p.id_cliente = cu.id_cliente
         LEFT JOIN direccion d ON p.id_cliente = d.id_cliente
         LEFT JOIN telefonos_usuario tu ON p.id_cliente = tu.id_cliente
         WHERE p.id = ?`,
        [id]
      );
      
      if (pedidoRows.length === 0) {
        return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });
      }
      
      const pedido = pedidoRows[0];
      
      // Obtener items del pedido
      const [itemsRows] = await connection.execute(
        'SELECT * FROM purchase_items WHERE pedido_id = ?',
        [id]
      );
      
      // Procesar los materiales de cada item
      const itemsProcesados = itemsRows.map(procesarMateriales);
      
      pedido.items = itemsProcesados;
      
      return NextResponse.json({ pedido });
    } else {
      // Obtener todos los pedidos con información básica
      const [pedidosRows] = await connection.execute(
        `SELECT p.*, 
                cu.nombre as nombre_cliente, 
                cu.apellidos as apellidos_cliente, 
                cu.correo as correo_cliente,
                CONCAT_WS(' ', 
                  d.calle, 
                  d.numExt, 
                  IFNULL(CONCAT('Int. ', d.numInt), ''),
                  d.colonia, 
                  d.municipio, 
                  d.estado, 
                  d.codPostal,
                  IFNULL(d.infAdicional, '')
                ) as direccion_completa,
                tu.telefono_principal,
                tu.telefono_secundario
         FROM pedidos p
         LEFT JOIN crear_usuario cu ON p.id_cliente = cu.id_cliente
         LEFT JOIN direccion d ON p.id_cliente = d.id_cliente
         LEFT JOIN telefonos_usuario tu ON p.id_cliente = tu.id_cliente
         ORDER BY p.fecha_creacion DESC`
      );
      
      return NextResponse.json({ pedidos: pedidosRows });
    }
  } catch (error) {
    console.error('Error al obtener pedidos:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}

// PUT: Actualizar estado de un pedido
export async function PUT(request) {
  let connection;
  try {
    connection = await pool.getConnection();
    
    const { id, estado, empresa_envio, num_guia, mensaje } = await request.json();
    
    // Obtener información del pedido
    const [pedidoRows] = await connection.execute(
      `SELECT p.*, cu.correo, cu.nombre 
       FROM pedidos p 
       LEFT JOIN crear_usuario cu ON p.id_cliente = cu.id_cliente 
       WHERE p.id = ?`,
      [id]
    );
    
    if (pedidoRows.length === 0) {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });
    }
    
    const pedido = pedidoRows[0];
    
    // Actualizar el pedido
    const updateData = { estado };
    if (empresa_envio) updateData.empresa_envio = empresa_envio;
    if (num_guia) updateData.num_guia = num_guia;
    
    const updateFields = Object.keys(updateData).map(key => `${key} = ?`).join(', ');
    const updateValues = Object.values(updateData);
    updateValues.push(id);
    
    await connection.execute(
      `UPDATE pedidos SET ${updateFields} WHERE id = ?`,
      updateValues
    );
    
    // Si el estado es cancelado, restaurar el stock
    if (estado === 'cancelado') {
      const [itemsRows] = await connection.execute(
        'SELECT * FROM purchase_items WHERE pedido_id = ? AND tipo_producto = "normal" AND id_producto_normal IS NOT NULL',
        [id]
      );
      
      for (const item of itemsRows) {
        await connection.execute(
          'UPDATE productos SET stock = stock + ? WHERE id_productos = ?',
          [item.cantidad, item.id_producto_normal]
        );
      }
    }
    
    // Enviar correo si se proporcionó un mensaje
    if (mensaje && pedido.correo) {
      const asunto = `Actualización de tu pedido ${pedido.codigo_pedido}`;
      let texto = '';
      
      switch(estado) {
        case 'enviado':
          texto = `Tu pedido ${pedido.codigo_pedido} ha sido enviado.`;
          if (empresa_envio && num_guia) {
            texto += `\nEmpresa de envío: ${empresa_envio}\nNúmero de guía: ${num_guia}`;
          }
          break;
        case 'entregado':
          texto = `Tu pedido ${pedido.codigo_pedido} ha sido entregado.`;
          break;
        case 'cancelado':
          texto = `Tu pedido ${pedido.codigo_pedido} ha sido cancelado.`;
          break;
        default:
          texto = `El estado de tu pedido ${pedido.codigo_pedido} ha cambiado a ${estado}.`;
      }
      
      if (mensaje) {
        texto += `\n\nMensaje adicional:\n${mensaje}`;
      }
      
      try {
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: pedido.correo,
          subject: asunto,
          text: texto
        });
      } catch (emailError) {
        console.error('Error al enviar correo:', emailError);
        // No fallamos la operación principal si el correo falla
      }
    }
    
    return NextResponse.json({ 
      message: 'Estado actualizado correctamente'
    });
  } catch (error) {
    console.error('Error al actualizar pedido:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}