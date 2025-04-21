import mysql from 'mysql2/promise';

// Configuración de conexión MySQL
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export async function query(sql, params) {
  let connection;
  try {
    connection = await pool.getConnection();
    const [results] = await connection.execute(sql, params || []);
    return results;
  } catch (error) {
    console.error('Error en la consulta MySQL:', error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}