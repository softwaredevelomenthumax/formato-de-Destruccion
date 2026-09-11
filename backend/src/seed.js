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

    // Insertar usuarios de prueba
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
        username: 'jperez',
        password: 'pass123',
        nombre: 'Juan Pérez',
        email: 'jperez@humax.com',
        area: 'Operaciones',
        rol: 'solicitante'
      },
      {
        username: 'hgarces',
        password: 'pass123',
        nombre: 'Héctor Garcés',
        email: 'hgarces@humax.com',
        area: 'HSE',
        rol: 'hse'
      },
      {
        username: 'mgomez',
        password: 'pass123',
        nombre: 'María Gómez',
        email: 'mgomez@humax.com',
        area: 'Calidad',
        rol: 'aprobador_area'
      },
      {
        username: 'mrevelo',
        password: 'pass123',
        nombre: 'Miguel Revelo',
        email: 'mrevelo@humax.com',
        area: 'Finanzas',
        rol: 'costos'
      },
      {
        username: 'agutierrez',
        password: 'pass123',
        nombre: 'Ana Gutiérrez',
        email: 'agutierrez@humax.com',
        area: 'Planeación',
        rol: 'planeacion'
      }
    ];

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
    const cecos = rows.map((row) => ({
      empresaCode: String(row.Empresa || '').trim(),
      empresa: String(row.Empresa_1 || '').trim(),
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

    const testProducts = [
      ['ROH', 0, '001', 'Lactosa monohidrato', 'MP'], ['ROH', 0, '002', 'Celulosa microcristalina', 'MP'],
      ['ROH', 1, '003', 'Codeína fosfato', 'MP'], ['ROH', 1, '004', 'Fenobarbital', 'MP'],
      ['FERT', 0, '005', 'Tabletas de vitamina C 500 mg', 'PT'], ['FERT', 0, '006', 'Jarabe multivitamínico 120 mL', 'PT'],
      ['FERT', 1, '007', 'Tabletas de clonazepam 2 mg', 'PT'], ['FERT', 1, '008', 'Solución oral de tramadol 100 mg', 'PT'],
      ['HALB', 0, '009', 'Granulado de acetaminofén', 'ST'], ['HALB', 0, '010', 'Mezcla para cápsulas de omeprazol', 'ST'],
      ['HALB', 1, '011', 'Granulado de codeína', 'ST'], ['HALB', 1, '012', 'Mezcla de morfina para ampollas', 'ST'],
      ['ME', 0, '013', 'Frasco PET ámbar 120 mL', 'ME'], ['ME', 0, '014', 'Etiqueta autoadhesiva estándar', 'ME'],
      ['ME', 1, '015', 'Etiqueta de seguridad para controlados', 'ME'], ['ME', 1, '016', 'Blíster de seguridad para controlados', 'ME'],
      ['UNBW', 0, '017', 'Reactivo de pH 7.00', 'UNBW'], ['UNBW', 0, '018', 'Material de referencia de cafeína', 'UNBW'],
      ['UNBW', 1, '019', 'Estándar de referencia de morfina', 'UNBW'], ['UNBW', 1, '020', 'Estándar de referencia de codeína', 'UNBW'],
    ];

    console.log(`\n💊 Cargando ${testProducts.length} productos INVIMA de prueba...`);
    for (const [materialCode, controlado, sequence, productName, clase] of testProducts) {
      const id = `inv-test-${sequence}`;
      const registryNumber = `INV-PRUEBA-${sequence}`;
      const sapCode = `SAP-PRUEBA-${sequence}`;
      const empresa = 'Humax';
      const empresaCode = 'CO11';
      await pool.request().input('id', id).input('codigoMaterial', `${materialCode}-${sequence}`).input('codigo', sapCode)
        .input('clase', clase).input('registryNumber', registryNumber).input('productName', productName)
        .input('empresa', empresa).input('empresaCode', empresaCode).input('tipoMedicamento', clase)
        .input('controlado', controlado).input('presentacion', productName).input('requiereSap', 1)
        .query(`IF EXISTS (SELECT 1 FROM invima_products WHERE id = @id OR registryNumber = @registryNumber)
          UPDATE invima_products SET codigoMaterial = @codigoMaterial, codigo = @codigo, clase = @clase, productName = @productName,
            registryNumber = @registryNumber, tipoMedicamento = @tipoMedicamento, controlado = @controlado, presentacion = @presentacion,
            empresaCode = @empresaCode, empresa = @empresa WHERE id = @id OR registryNumber = @registryNumber
          ELSE
          INSERT INTO invima_products (id, codigoMaterial, codigo, clase, productName, registryNumber, internalStatus, holder, tipoMedicamento, controlado, presentacion, empresaCode, empresa, requiereSap, requiereInvima)
          VALUES (@id, @codigoMaterial, @codigo, @clase, @productName, @registryNumber, '', @empresa, @tipoMedicamento, @controlado, @presentacion, @empresaCode, @empresa, @requiereSap, 1)`);
      await pool.request().input('id', `sap-test-${sequence}`).input('codigo', sapCode)
        .input('descripcion', productName).input('empresaCode', empresaCode).input('empresa', empresa)
        .input('invimaProductId', id).input('presentacion', productName).input('unidadMedida', 'UND')
        .query(`IF EXISTS (SELECT 1 FROM sap_codes WHERE id = @id OR (codigo = @codigo AND empresaCode = @empresaCode))
          UPDATE sap_codes SET codigo = @codigo, descripcion = @descripcion, empresaCode = @empresaCode, empresa = @empresa,
            invimaProductId = @invimaProductId, presentacion = @presentacion, unidadMedida = @unidadMedida
            WHERE id = @id OR (codigo = @codigo AND empresaCode = @empresaCode)
          ELSE
          INSERT INTO sap_codes (id, codigo, descripcion, empresaCode, empresa, invimaProductId, presentacion, unidadMedida, status)
          VALUES (@id, @codigo, @descripcion, @empresaCode, @empresa, @invimaProductId, @presentacion, @unidadMedida, 'Activo')`);
    }

    console.log('\n✅ Base de datos lista para usar\n');
    console.log('🔐 Credenciales de prueba:');
    console.log('   Usuario: admin       | Contraseña: admin123        | Rol: administrador');
    console.log('   Usuario: jperez      | Contraseña: pass123         | Rol: solicitante');
    console.log('   Usuario: hgarces     | Contraseña: pass123         | Rol: hse');
    console.log('   Usuario: mgomez      | Contraseña: pass123         | Rol: aprobador_area');
    console.log('   Usuario: mrevelo     | Contraseña: pass123         | Rol: costos');
    console.log('   Usuario: agutierrez  | Contraseña: pass123         | Rol: planeacion\n');

    await closeDatabase();
  } catch (error) {
    console.error('❌ Error en seed:', error.message);
    process.exit(1);
  }
}

seed();
