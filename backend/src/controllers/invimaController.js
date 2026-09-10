import { getPool } from '../database/connection.js';

// Crear producto INVIMA
export async function createInvimaProduct(req, res) {
  try {
    const { fabricante, clase, estatusSap, codigo, productName, canal, registryNumber, estadoInvima, internalStatus, holder, tipoMedicamento, controlado, presentacion, empresaCode, empresa, requiereSap, requiereInvima } = req.body;
    const pool = getPool();

    const id = `inv${Date.now()}`;

    await pool.request()
      .input('id', id)
      .input('fabricante', fabricante)
      .input('clase', clase)
      .input('estatusSap', estatusSap ?? 'Activo')
      .input('codigo', codigo)
      .input('productName', productName)
      .input('canal', canal)
      .input('registryNumber', registryNumber)
      .input('estadoInvima', estadoInvima ?? internalStatus)
      .input('internalStatus', internalStatus)
      .input('holder', holder)
      .input('tipoMedicamento', tipoMedicamento)
      .input('controlado', controlado)
      .input('presentacion', presentacion)
      .input('empresaCode', empresaCode)
      .input('empresa', empresa)
      .input('requiereSap', requiereSap ?? 1)
      .input('requiereInvima', requiereInvima ?? 1)
      .query(`
        INSERT INTO invima_products (id, fabricante, clase, estatusSap, codigo, productName, canal, registryNumber, estadoInvima, internalStatus, holder, tipoMedicamento, controlado, presentacion, empresaCode, empresa, requiereSap, requiereInvima)
        VALUES (@id, @fabricante, @clase, @estatusSap, @codigo, @productName, @canal, @registryNumber, @estadoInvima, @internalStatus, @holder, @tipoMedicamento, @controlado, @presentacion, @empresaCode, @empresa, @requiereSap, @requiereInvima)
      `);

    res.status(201).json({ id, fabricante, clase, estatusSap: estatusSap ?? 'Activo', codigo, productName, canal, registryNumber, estadoInvima: estadoInvima ?? internalStatus, internalStatus, holder, tipoMedicamento, controlado, presentacion, empresaCode, empresa, requiereSap: requiereSap ?? 1, requiereInvima: requiereInvima ?? 1 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Obtener productos
export async function getInvimaProducts(req, res) {
  try {
    const pool = getPool();
    const result = await pool.request().query('SELECT * FROM invima_products');
    res.json(result.recordset);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Actualizar producto
export async function updateInvimaProduct(req, res) {
  try {
    const { id } = req.params;
    const updates = req.body;
    const pool = getPool();

    const fields = [];
    const request = pool.request().input('id', id);

    Object.entries(updates).forEach(([key, value]) => {
      if (key !== 'id') {
        fields.push(`${key} = @${key}`);
        request.input(key, value);
      }
    });

    if (fields.length > 0) {
      await request.query(`UPDATE invima_products SET ${fields.join(', ')} WHERE id = @id`);
    }

    res.json({ message: 'Producto actualizado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Eliminar producto
export async function deleteInvimaProduct(req, res) {
  try {
    const { id } = req.params;
    const pool = getPool();

    await pool.request()
      .input('id', id)
      .query('DELETE FROM invima_products WHERE id = @id');

    res.json({ message: 'Producto eliminado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
