import { connectDatabase, getPool, closeDatabase } from './database/connection.js';
import { initializeDatabase } from './database/schema.js';
import bcryptjs from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import path from 'node:path';
import XLSX from 'xlsx';

dotenv.config();

async function seed() {
  try {
    console.log('🌱 Iniciando siembra de datos...\n');

    // Conectar a la BD
    await connectDatabase();
    const pool = getPool();

    // Crear tablas
    await initializeDatabase();

    // Crear únicamente las cuentas administrativas iniciales.
    const users = [
      {
        username: 'admin',
        password: 'admin123',
        nombre: 'Administrador Sistema',
        email: 'admin@humax.com',
        area: 'TI',
        rol: 'administrador'
      },
      {
        username: 'admin_global',
        password: 'adminGlobal123',
        nombre: 'Administrador Global',
        email: 'admin.global@humax.com',
        area: 'TI',
        rol: 'admin_global'
      }
    ];

    await pool.request().query(`
      DELETE FROM notifications
      WHERE userId IN (SELECT id FROM users WHERE username IN ('jperez', 'hgarces', 'mgomez', 'mrevelo', 'agutierrez'));
      DELETE u FROM users u
      WHERE u.username IN ('jperez', 'hgarces', 'mgomez', 'mrevelo', 'agutierrez')
        AND NOT EXISTS (SELECT 1 FROM actas a WHERE a.solicitanteId = u.id);
    `);

    console.log('👤 Creando usuarios de prueba...');
    for (const user of users) {
      try {
        const hashedPassword = await bcryptjs.hash(user.password, 10);
        const id = uuidv4();

        await pool.request()
          .input('id', id)
          .input('username', user.username)
          .input('password', hashedPassword)
          .input('nombre', user.nombre)
          .input('email', user.email)
          .input('area', user.area)
          .input('rol', user.rol)
          .query(`
            IF NOT EXISTS (SELECT 1 FROM users WHERE username = @username)
            INSERT INTO users (id, username, password, nombre, email, area, rol, status)
            VALUES (@id, @username, @password, @nombre, @email, @area, @rol, 'activo')
          `);

        console.log(`  ✓ ${user.username} (${user.nombre}) - ${user.rol}`);
      } catch (err) {
        console.log(`  ✗ ${user.username} - ${err.message}`);
      }
    }

    // Cargar el maestro desde el Excel entregado por el usuario.
    const workbook = XLSX.readFile(path.resolve(process.cwd(), '../cecos.xlsx'));
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { defval: '' });
    const empresaAliases = {
      COH1: { code: 'CO11', name: 'Humax' },
      COF1: { code: 'CO12', name: 'Farmatech' },
      COC1: { code: 'CO13', name: 'Cambridge' },
      CO11: { code: 'CO11', name: 'Humax' },
      CO12: { code: 'CO12', name: 'Farmatech' },
      CO13: { code: 'CO13', name: 'Cambridge' },
    };
    const cecos = rows.map((row) => ({
      empresaCode: empresaAliases[String(row.Empresa || '').trim().toUpperCase()]?.code || String(row.Empresa || '').trim(),
      empresa: empresaAliases[String(row.Empresa || '').trim().toUpperCase()]?.name || String(row.Empresa_1 || '').trim(),
      ceco: String(row.Ceco || '').trim(),
      denominacion: String(row['Denominación'] || '').trim(),
      responsable: String(row.Responsable || '').trim(),
      departamento: String(row.Departamento || '').trim(),
      tipoCosto: String(row.CeCo || '').trim(),
      moneda: String(row['Mon.'] || '').trim(),
      status: String(row.Status || 'Activo').trim(),
    })).filter((ceco) => ceco.empresaCode && ceco.empresa && ceco.ceco && ceco.denominacion);

    console.log(`\n🏢 Cargando ${cecos.length} centros de costos desde cecos.xlsx...`);
    for (const { empresaCode, empresa, ceco, denominacion, responsable, departamento, tipoCosto, moneda, status } of cecos) {
      const id = `${empresaCode}-${ceco}`;
      await pool.request()
        .input('id', id)
        .input('empresaCode', empresaCode)
        .input('empresa', empresa)
        .input('ceco', ceco)
        .input('denominacion', denominacion)
        .input('responsable', responsable)
        .input('departamento', departamento)
        .input('tipoCosto', tipoCosto)
        .input('moneda', moneda)
        .input('status', status)
        .query(`
          IF NOT EXISTS (SELECT 1 FROM cecos WHERE empresaCode = @empresaCode AND ceco = @ceco)
          INSERT INTO cecos (id, empresaCode, empresa, ceco, denominacion, responsable, departamento, tipoCosto, moneda, status)
          VALUES (@id, @empresaCode, @empresa, @ceco, @denominacion, @responsable, @departamento, @tipoCosto, @moneda, @status)
        `);
    }

    console.log('\n✅ Base de datos lista para usar\n');
    console.log('🔐 Credenciales de prueba:');
    console.log('   Usuario: admin       | Contraseña: admin123        | Rol: administrador');
    console.log('   Usuario: admin_global | Contraseña: adminGlobal123 | Rol: admin_global\n');

    await closeDatabase();
  } catch (error) {
    console.error('❌ Error en seed:', error.message);
    process.exit(1);
  }
}

seed();
