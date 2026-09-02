import { getPool } from '../database/connection.js';
import { v4 as uuidv4 } from 'uuid';

export async function getCecos(req, res) {
  try {
    const result = await getPool().request().query('SELECT * FROM cecos ORDER BY empresa, ceco');
    res.json(result.recordset);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function createCeco(req, res) {
  try {
    const { empresaCode, empresa, ceco, denominacion, responsable, departamento, tipoCosto, moneda, status } = req.body;
    const id = uuidv4();
    const pool = getPool();
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
      .input('status', status || 'Activo')
      .query(`
        INSERT INTO cecos (id, empresaCode, empresa, ceco, denominacion, responsable, departamento, tipoCosto, moneda, status)
        VALUES (@id, @empresaCode, @empresa, @ceco, @denominacion, @responsable, @departamento, @tipoCosto, @moneda, @status)
      `);
    res.status(201).json({ id, ...req.body, status: status || 'Activo' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function updateCeco(req, res) {
  try {
    const { id } = req.params;
    const { empresa, denominacion, responsable, departamento, tipoCosto, moneda, status } = req.body;
    await getPool().request()
      .input('id', id)
      .input('empresa', empresa)
      .input('denominacion', denominacion)
      .input('responsable', responsable)
      .input('departamento', departamento)
      .input('tipoCosto', tipoCosto)
      .input('moneda', moneda)
      .input('status', status)
      .query(`
        UPDATE cecos SET empresa = @empresa, denominacion = @denominacion, responsable = @responsable,
          departamento = @departamento, tipoCosto = @tipoCosto, moneda = @moneda, status = @status, updatedAt = GETDATE()
        WHERE id = @id
      `);
    res.json({ message: 'CeCo actualizado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function deleteCeco(req, res) {
  try {
    await getPool().request()
      .input('id', req.params.id)
      .query('DELETE FROM cecos WHERE id = @id');
    res.json({ message: 'CeCo eliminado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}