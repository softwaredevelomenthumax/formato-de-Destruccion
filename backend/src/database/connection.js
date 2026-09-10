import sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config();

const dbName = process.env.DB_NAME || process.env.DB_DATABASE || 'DestruccionDB';
const dbHost = process.env.DB_HOST || process.env.DB_SERVER || 'localhost';
const dbPort = Number.parseInt(process.env.DB_PORT || '1433', 10);
const connectionTimeout = Number.parseInt(process.env.DB_CONNECTION_TIMEOUT || '15000', 10);
const requestTimeout = Number.parseInt(process.env.DB_REQUEST_TIMEOUT || '30000', 10);
const poolMax = Number.parseInt(process.env.DB_POOL_MAX || '30', 10);
const asBoolean = (value, fallback) => {
  if (value === undefined) return fallback;
  return ['true', '1', 'yes'].includes(String(value).toLowerCase());
};

const config = {
  server: dbHost,
  port: dbPort,
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || '',
  database: dbName,
  encrypt: asBoolean(process.env.DB_ENCRYPT, false),
  trustServerCertificate: asBoolean(process.env.DB_TRUST_CERT, true),
  connectionTimeout,
  requestTimeout,
  pool: {
    max: poolMax,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

let pool = null;

export async function connectDatabase() {
  if (pool) return pool;

  try {
    pool = new sql.ConnectionPool(config);
    await pool.connect();
    console.log(`✓ Conectado a SQL Server ${dbHost}:${dbPort}/${dbName}`);
    return pool;
  } catch (error) {
    pool = null;
    console.error('✗ Error conectando a SQL Server:', error.message);
    throw new Error(`No se pudo conectar a la base de datos ${dbName} en ${dbHost}:${dbPort}: ${error.message}`);
  }
}

export function getPool() {
  return pool;
}

export async function closeDatabase() {
  if (pool) {
    await pool.close();
    pool = null;
    console.log('Conexión a SQL Server cerrada');
  }
}
