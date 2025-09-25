import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 11561,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Helper para condicionar fechas
const getDateFilter = (fechaInicio, fechaFin, table = "fecha_creacion") => {
  if (fechaInicio && fechaFin) {
    return `WHERE ${table} BETWEEN '${fechaInicio}' AND '${fechaFin}'`;
  }
  return "";
};

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const fechaInicio = searchParams.get("fechaInicio");
    const fechaFin = searchParams.get("fechaFin");
    const filtrarFechas = fechaInicio && fechaFin;

    // 1. Top productos vendidos (máximo 10)
    const [topProductos] = await pool.query(
      `
      SELECT nombre_producto, SUM(cantidad) as cantidad
      FROM purchase_items
      ${filtrarFechas ? getDateFilter(fechaInicio, fechaFin, "fecha_creacion") : ""}
      GROUP BY id_producto_normal, nombre_producto
      ORDER BY cantidad DESC
      LIMIT 10;
      `
    );

    // 2. Tipo de producto
    const [tipoProducto] = await pool.query(
      `
      SELECT tipo_producto, COUNT(*) as cantidad
      FROM purchase_items
      ${filtrarFechas ? getDateFilter(fechaInicio, fechaFin, "fecha_creacion") : ""}
      GROUP BY tipo_producto;
      `
    );

    // 3. Categoría más vendida
    const [categorias] = await pool.query(
      `
      SELECT categoria, COUNT(*) as cantidad
      FROM purchase_items
      ${filtrarFechas ? getDateFilter(fechaInicio, fechaFin, "fecha_creacion") : ""}
      GROUP BY categoria
      ORDER BY cantidad DESC;
      `
    );

    // 4. Ganancias de ventas
    const [ganancias] = await pool.query(
      `
      SELECT id_producto_normal, nombre_producto, SUM(precio_unitario * cantidad) as total, SUM(cantidad) as cantidad_total
      FROM purchase_items
      ${filtrarFechas ? getDateFilter(fechaInicio, fechaFin, "fecha_creacion") : ""}
      GROUP BY id_producto_normal, nombre_producto
      ORDER BY total DESC;
      `
    );

    // 5. Tipo de envío
    const [tipoEnvio] = await pool.query(
      `
      SELECT tipo_envio, COUNT(*) as cantidad
      FROM pedidos
      ${filtrarFechas ? getDateFilter(fechaInicio, fechaFin, "fecha_creacion") : ""}
      GROUP BY tipo_envio;
      `
    );

    // 6. Empresa de envíos
    const [empresaEnvio] = await pool.query(
      `
      SELECT empresa_envio, COUNT(*) as cantidad
      FROM pedidos
      ${filtrarFechas ? getDateFilter(fechaInicio, fechaFin, "fecha_creacion") : ""}
      GROUP BY empresa_envio;
      `
    );

    // 7. Estado de pedidos
    const [estados] = await pool.query(
      `
      SELECT estado, COUNT(*) as cantidad
      FROM pedidos
      ${filtrarFechas ? getDateFilter(fechaInicio, fechaFin, "fecha_creacion") : ""}
      GROUP BY estado;
      `
    );

    // 8. Método de pago
    const [metodosPago] = await pool.query(
      `
      SELECT metodo_pago, COUNT(*) as cantidad
      FROM pedidos
      ${filtrarFechas ? getDateFilter(fechaInicio, fechaFin, "fecha_creacion") : ""}
      GROUP BY metodo_pago;
      `
    );

     const [ventasMensuales] = await pool.query(
      `
      SELECT 
        MONTH(fecha_creacion) as mes,
        YEAR(fecha_creacion) as anio,
        SUM(precio_unitario * cantidad) as total
      FROM purchase_items
      ${filtrarFechas ? getDateFilter(fechaInicio, fechaFin, "fecha_creacion") : ""}
      GROUP BY YEAR(fecha_creacion), MONTH(fecha_creacion)
      ORDER BY anio, mes;
      `
    );

     return NextResponse.json({
      topProductos,
      tipoProducto,
      categorias,
      ganancias,
      tipoEnvio,
      empresaEnvio,
      estados,
      metodosPago,
      ventasMensuales, // ← Agregar esto
    });
  } catch (error) {
    console.error("Error en API reportes:", error);
    return NextResponse.json({ error: "Error al obtener los reportes" }, { status: 500 });
  }
}
