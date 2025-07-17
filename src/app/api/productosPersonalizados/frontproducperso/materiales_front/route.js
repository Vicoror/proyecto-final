import { NextResponse } from "next/server";
import { query } from "../../../../../lib/database"; 

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 });

  try {
    const metales = await query (`
      SELECT m.id_metal AS id, m.nombreM AS nombre, m.precioM, m.imagenM AS imagen, pm.gramos
      FROM producto_metal pm
      JOIN metal m ON m.id_metal = pm.id_metal
      WHERE pm.id_ProPer = ? AND pm.ActivarM = 1
    `, [id]);

    const hilos = await query(`
      SELECT h.id_hilo AS id, h.color AS color, h.precioH, h.imagenH AS imagen, ph.metros
      FROM producto_hilo ph
      JOIN hilo h ON h.id_hilo = ph.id_hilo
      WHERE ph.id_ProPer = ? AND ph.ActivarH = 1
    `, [id]);

   const piedras = await query (`
      SELECT p.id_piedra AS id, p.nombrePiedra AS nombre, p.precioP, p.imagenPiedra AS imagen, pp.gramos
      FROM producto_piedra pp
      JOIN piedra p ON p.id_piedra = pp.id_piedra
      WHERE pp.id_ProPer = ? AND pp.ActivarP = 1
    `, [id]);
console.log("Metales:", metales, "Hilos:", hilos, "Piedras:", piedras);

    return NextResponse.json({ metales, hilos, piedras });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error al obtener materiales" }, { status: 500 });
  }
}
