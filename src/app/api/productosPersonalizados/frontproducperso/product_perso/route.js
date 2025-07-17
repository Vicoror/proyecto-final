import { NextResponse } from "next/server";
import { query } from "../../../../../lib/database"; 

export async function GET() {
  try {
    const rows = await query("SELECT * FROM productospersonalizados WHERE Activar = 1");
    return NextResponse.json(rows); // ✅ Devuelve un array directamente
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error al obtener productos" }, { status: 500 });
  }
}

