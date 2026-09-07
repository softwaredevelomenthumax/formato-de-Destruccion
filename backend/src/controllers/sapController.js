import { getPool } from '../database/connection.js';
import { v4 as uuidv4 } from 'uuid';

export async function getSapCodes(req, res) {
  try {
    const request = getPool().request();
    const { empresaCode, invimaProductId } = req.query;
    let query = "SELECT * FROM sap_codes WHERE status = 'Activo'";
    if (empresaCode) { request.input('empresaCode', empresaCode); query += ' AND empresaCode = @empresaCode'; }
    if (invimaProductId) { request.input('invimaProductId', invimaProductId); query += ' AND invimaProductId = @invimaProductId'; }
    const result = await request.query(`${query} ORDER BY codigo`);
    res.json(result.recordset);
  } catch (error) { res.status(500).json({ error: error.message }); }
}

export async function createSapCode(req, res) {
  try {
    const { codigo, descripcion, empresaCode, empresa, invimaProductId, presentacion, unidadMedida, status } = req.body;
    const id = uuidv4();
    await getPool().request().input('id', id).input('codigo', codigo).input('descripcion', descripcion)
      .input('empresaCode', empresaCode).input('empresa', empresa).input('invimaProductId', invimaProductId)
      .input('presentacion', presentacion).input('unidadMedida', unidadMedida).input('status', status || 'Activo')
      .query(`INSERT INTO sap_codes (id, codigo, descripcion, empresaCode, empresa, invimaProductId, presentacion, unidadMedida, status)
        VALUES (@id, @codigo, @descripcion, @empresaCode, @empresa, @invimaProductId, @presentacion, @unidadMedida, @status)`);
    res.status(201).json({ id, ...req.body, status: status || 'Activo' });
  } catch (error) { res.status(500).json({ error: error.message }); }
}