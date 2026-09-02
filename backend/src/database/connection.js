import sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config();

const dbName = process.env.DB_NAME || 'DestruccionDB';

const config = {
  server: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '1433'),
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || '',
  database: dbName,
  trustServerCertificate: true,
  encrypt: false,
  connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT || '15000'),
  requestTimeout: parseInt(process.env.DB_REQUEST_TIMEOUT || '30000'),
  pool: {
    max: 30,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

let pool = null;

export async function connectDatabase() {
  try {
    pool = new sql.ConnectionPool(config);
    await pool.connect();
    console.log('✓ Conectado a SQL Server');
    
    // Crear la base de datos si no existe
    try {
      const masterPool = new sql.ConnectionPool({
        ...config,
        database: 'master',
      });
      await masterPool.connect();
      
      await masterPool.request().query(`
        IF NOT EXISTS (SELECT 1 FROM sys.databases WHERE name = '${dbName}')
        CREATE DATABASE ${dbName}
      `);
      
      await masterPool.close();
      console.log(`✓ Base de datos ${dbName} lista`);
    } catch (err) {
      console.log(`📝 Base de datos ${dbName} ya existe`);
    }
    
    return pool;
  } catch (error) {
    console.error('✗ Error conectando a SQL Server:', error.message);
    return null;
  }
}

export function getPool() {
  return pool;
}

export async function closeDatabase() {
  if (pool) {
    await pool.close();
    console.log('Conexión a SQL Server cerrada');
  }
}
