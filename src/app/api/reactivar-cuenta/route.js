import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

export async function POST(request) {
  let db;

  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'ID de usuario requerido' }, { status: 400 });
    }

    // Conectar a la base de datos (usando la misma configuración que tu login)
    db = await mysql.createConnection({
      host: "ballast.proxy.rlwy.net",
      user: "root",
      password: "UjoNIhdtAkcSYSzZBeNQKPejgbKulsyb",
      database: "mi_proyecto_final",
      port: 11561,
    });

    // Reactivar la cuenta (establecer activar_usuario = 1)
    const [result] = await db.execute(
      'UPDATE crear_usuario SET activar_usuario = 1 WHERE id_cliente = ?',
      [userId]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Cuenta reactivada correctamente' 
    }, { status: 200 });

  } catch (error) {
    console.error('Error reactivando cuenta:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  } finally {
    if (db) await db.end();
  }
}