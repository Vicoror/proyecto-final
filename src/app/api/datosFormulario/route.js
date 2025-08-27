// app/api/usuario/perfil/route.js
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

// Helper para ejecutar consultas
async function query(sql, params) {
  const connection = await pool.getConnection();
  try {
    const [results] = await connection.execute(sql, params);
    return results;
  } finally {
    connection.release();
  }
}

function getUserIdFromHeaders(request) {
  const userId = request.headers.get('x-user-id');
  if (!userId) {
    throw new Error('ID de usuario no proporcionado');
  }
  return parseInt(userId, 10);
}

// Obtener perfil del usuario
export async function GET(request) {
  // En un caso real, deberías obtener el ID del usuario autenticado
  // Por ahora usaremos un ID hardcodeado para el ejemplo
  const userId = getUserIdFromHeaders(request);


  try {
    // Obtener datos básicos del usuario
    const [usuario] = await query(
      'SELECT id_cliente, nombre, apellidos, correo FROM crear_usuario WHERE id_cliente = ?', 
      [userId]
    );

    if (!usuario) {
      return NextResponse.json({ message: 'Usuario no encontrado' }, { status: 404 });
    }

    // Obtener dirección principal
    const [direccion] = await query(
      'SELECT * FROM direccion WHERE id_cliente = ?',
      [userId]
    );

    // Obtener teléfonos
    const telefonos = await query(
      'SELECT * FROM telefonos_usuario WHERE id_cliente = ?',
      [userId]
    );

    // Formatear respuesta
    const response = {
      nombre: usuario.nombre,
      apellidos: usuario.apellidos,
      correo: usuario.correo,
      direccion: direccion ? {
        calle: direccion.calle,
        numExt: direccion.numExt,
        numInt: direccion.numInt || '',
        colonia: direccion.colonia,
        codPostal: direccion.codPostal,
        municipio: direccion.municipio,
        estado: direccion.estado,
        infAdicional: direccion.infAdicional || ''
      } : {
        calle: '',
        numExt: '',
        numInt: '',
        colonia: '',
        codPostal: '',
        municipio: '',
        estado: '',
        infAdicional: ''
      },
      telefonos: {
        principal: telefonos.find(t => t.telefono_principal)?.telefono_principal || '',
        secundario: telefonos.find(t => t.telefono_secundario)?.telefono_secundario || ''
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    return NextResponse.json(
      { message: 'Error al obtener datos del perfil' },
      { status: 500 }
    );
  }
}

// Actualizar perfil del usuario
export async function PUT(request) {
  // En un caso real, deberías obtener el ID del usuario autenticado
  const userId = getUserIdFromHeaders(request);


  try {
    const data = await request.json();
    const { nombre, apellidos, correo, direccion, telefonos } = data;

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Actualizar datos básicos del usuario
      await connection.execute(
        'UPDATE crear_usuario SET nombre = ?, apellidos = ?, correo = ? WHERE id_cliente = ?',
        [nombre, apellidos, correo, userId]
      );

      // Actualizar o insertar dirección
      const [existingDir] = await connection.execute(
        'SELECT id_direccion FROM direccion WHERE id_cliente = ?',
        [userId]
      );

      if (existingDir.length > 0) {
        const idDireccion = existingDir[0].id_direccion;
        await connection.execute(
          `UPDATE direccion SET 
           calle = ?, numExt = ?, numInt = ?, colonia = ?, codPostal = ?,
           municipio = ?, estado = ?, infAdicional = ?
           WHERE id_direccion = ?`,
          [
            direccion.calle,
            direccion.numExt,
            direccion.numInt || null,
            direccion.colonia,
            direccion.codPostal,
            direccion.municipio,
            direccion.estado,
            direccion.infAdicional || null,
            existingDir[0].id_direccion
          ]
        );
      } else {
        await connection.execute(
          `INSERT INTO direccion 
           (id_cliente, calle, numExt, numInt, colonia, codPostal, pais, estado, municipio, infAdicional)
           VALUES (?, ?, ?, ?, ?, ?, 'México', ?, ?, ?)`,
          [
            userId,
            direccion.calle,
            direccion.numExt,
            direccion.numInt || null,
            direccion.colonia,
            direccion.codPostal,
            direccion.estado,
            direccion.municipio,
            direccion.infAdicional || null
          ]
        );
      }

      // Manejar teléfonos
      const [existingPhones] = await connection.execute(
        'SELECT * FROM telefonos_usuario WHERE id_cliente = ?',
        [userId]
      );

      // Actualizar o insertar teléfono principal
      const principalPhone = existingPhones.find(p => p.telefono_principal);
          if (principalPhone) {
            await connection.execute(
              'UPDATE telefonos_usuario SET telefono_principal = ? WHERE id_telefono = ?',
              [telefonos.principal, principalPhone.id_telefono]
            );
          } else if (telefonos.principal) {
            await connection.execute(
              'INSERT INTO telefonos_usuario (id_cliente, telefono_principal, lada_principal) VALUES (?, ?, "52")',
              [userId, telefonos.principal]
            );
          }


      // Actualizar o insertar teléfono secundario
      if (telefonos.secundario) {
        const secundaryPhone = existingPhones.find(p => p.telefono_secundario);
        if (secundaryPhone) {
          await connection.execute(
            'UPDATE telefonos_usuario SET telefono_secundario = ? WHERE id_telefono = ?',
            [telefonos.secundario, secundaryPhone.id_telefono]
          );
        } else {
          await connection.execute(
            'INSERT INTO telefonos_usuario (id_cliente, telefono_secundario, lada_secundaria, tipo_secundario) VALUES (?, ?, "52", "secundario")',
            [userId, telefonos.secundario]
          );
        }
      } else if (existingPhones.some(p => p.telefono_secundario)) {
        // Eliminar teléfono secundario si ya existía pero ahora no se envió
        await connection.execute(
          'UPDATE telefonos_usuario SET telefono_secundario = NULL WHERE id_cliente = ? AND telefono_secundario IS NOT NULL',
          [userId]
        );
      }

      await connection.commit();
      return NextResponse.json({ message: 'Perfil actualizado correctamente' });
    } catch (error) {
      await connection.rollback();
      console.error('Error en transacción:', error);
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error al actualizar perfil:', error);
    return NextResponse.json(
      { message: 'Error al actualizar el perfil' },
      { status: 500 }
    );
  }
}