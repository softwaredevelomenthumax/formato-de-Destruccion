import XLSX from 'xlsx';
import sql from 'mssql';
import path from 'node:path';
import { connectDatabase, getPool, closeDatabase } from './database/connection.js';
import { initializeDatabase } from './database/schema.js';

const sourcePath = path.resolve(process.cwd(), '../ZMM059 SEPT 10..XLSX');
const companies = {
  COH1: { code: 'CO11', name: 'Humax' },
  COF1: { code: 'CO12', name: 'Farmatech' },
  COC1: { code: 'CO13', name: 'Cambridge' },
  CO11: { code: 'CO11', name: 'Humax' },
  CO12: { code: 'CO12', name: 'Farmatech' },
  CO13: { code: 'CO13', name: 'Cambridge' },
};

const text = (value) => String(value ?? '').trim();
const numberValue = (value) => {
  const normalized = text(value).replace(/\./g, '').replace(',', '.');
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};

async function importZmm059() {
  await connectDatabase();
  await initializeDatabase();
  const workbook = XLSX.readFile(sourcePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false });
  const pool = getPool();
  const table = new sql.Table('invima_products');
  table.create = false;
  table.columns.add('id', sql.NVarChar(50), { nullable: false });
  table.columns.add('codigoMaterial', sql.NVarChar(100), { nullable: true });
  table.columns.add('codigo', sql.NVarChar(100), { nullable: true });
  table.columns.add('productName', sql.NVarChar(255), { nullable: true });
  table.columns.add('clase', sql.NVarChar(100), { nullable: true });
  table.columns.add('unidadMedidaBase', sql.NVarChar(50), { nullable: true });
  table.columns.add('precioEstandar', sql.Decimal(18, 4), { nullable: true });
  table.columns.add('centro', sql.NVarChar(20), { nullable: true });
  table.columns.add('empresaCode', sql.NVarChar(20), { nullable: true });
  table.columns.add('empresa', sql.NVarChar(100), { nullable: true });
  table.columns.add('pbNivelCentro', sql.NVarChar(100), { nullable: true });
  table.columns.add('statusMaterialTodosCentros', sql.NVarChar(100), { nullable: true });
  table.columns.add('statusMaterialCentro', sql.NVarChar(100), { nullable: true });
  table.columns.add('planifNecesidades', sql.NVarChar(100), { nullable: true });
  table.columns.add('registryNumber', sql.NVarChar(100), { nullable: true });
  table.columns.add('internalStatus', sql.NVarChar(50), { nullable: true });
  table.columns.add('holder', sql.NVarChar(255), { nullable: true });
  table.columns.add('tipoMedicamento', sql.NVarChar(255), { nullable: true });
  table.columns.add('controlado', sql.Bit, { nullable: true });
  table.columns.add('presentacion', sql.NVarChar(255), { nullable: true });
  table.columns.add('requiereSap', sql.Bit, { nullable: true });
  table.columns.add('requiereInvima', sql.Bit, { nullable: true });

  for (const [index, row] of rows.entries()) {
    const material = text(row.Material);
    const materialType = text(row['Tipo material']).toUpperCase();
    const sourceCenter = text(row.Centro).toUpperCase();
    const company = companies[sourceCenter] || { code: sourceCenter, name: text(row.Empresa) || sourceCenter };
    table.rows.add(
      `zmm059-${index + 1}`, material, material, text(row['Texto breve de material']),
      materialType, text(row['Unidad medida base']), numberValue(row['Precio estándar']),
      sourceCenter, company.code, company.name, text(row['PB nivel centro']),
      text(row['Status mat.todos ce.']), text(row['Stat.mat.específ.ce.']), text(row['Planif.necesidades']),
      'N/A', '', company.name, materialType, materialType === 'PT' || materialType === 'FERT' ? 1 : 0, text(row['Texto breve de material']), 1, 0,
    );
  }

  await pool.request().query("DELETE FROM invima_products WHERE id LIKE 'zmm059-%'");
  await pool.request().bulk(table);
  console.log(`Importados ${table.rows.length} de ${rows.length} registros del archivo ZMM059.`);
  await closeDatabase();
}

importZmm059().catch(async (error) => {
  console.error('Error importando ZMM059:', error.message);
  await closeDatabase();
  process.exitCode = 1;
});
