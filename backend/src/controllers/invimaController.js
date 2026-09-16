import { getPool } from '../database/connection.js';

const isControlledType = (value) => ['PT', 'FERT'].includes(String(value || '').trim().toUpperCase());

// Crear producto INVIMA
export async function createInvimaProduct(req, res) {
  try {
    const { codigoMaterial, fabricante, clase, estatusSap, codigo, productName, canal, registryNumber, estadoInvima, internalStatus, holder, tipoMedicamento, controlado, presentacion, empresaCode, empresa, requiereSap, requiereInvima, unidadMedidaBase, precioEstandar, densidad, pesoUnidad } = req.body;
    const resolvedControlado = isControlledType(clase) || Boolean(controlado);
    const pool = getPool();

    const id = `inv${Date.now()}`;

    await pool.request()
      .input('id', id)
      .input('codigoMaterial', codigoMaterial)
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
      .input('controlado', resolvedControlado)
      .input('presentacion', presentacion)
      .input('empresaCode', empresaCode)
      .input('empresa', empresa)
      .input('requiereSap', requiereSap ?? 1)
      .input('requiereInvima', requiereInvima ?? 1)
      .input('unidadMedidaBase', unidadMedidaBase)
      .input('precioEstandar', precioEstandar)
      .input('densidad', densidad)
      .input('pesoUnidad', pesoUnidad)
      .query(`
        INSERT INTO invima_products (id, codigoMaterial, fabricante, clase, estatusSap, codigo, productName, canal, registryNumber, estadoInvima, internalStatus, holder, tipoMedicamento, controlado, presentacion, empresaCode, empresa, requiereSap, requiereInvima, unidadMedidaBase, precioEstandar, densidad, pesoUnidad)
        VALUES (@id, @codigoMaterial, @fabricante, @clase, @estatusSap, @codigo, @productName, @canal, @registryNumber, @estadoInvima, @internalStatus, @holder, @tipoMedicamento, @controlado, @presentacion, @empresaCode, @empresa, @requiereSap, @requiereInvima, @unidadMedidaBase, @precioEstandar, @densidad, @pesoUnidad)
      `);

    res.status(201).json({ id, codigoMaterial, fabricante, clase, estatusSap: estatusSap ?? 'Activo', codigo, productName, canal, registryNumber, estadoInvima: estadoInvima ?? internalStatus, internalStatus, holder, tipoMedicamento, controlado: resolvedControlado, presentacion, empresaCode, empresa, requiereSap: requiereSap ?? 1, requiereInvima: requiereInvima ?? 1, unidadMedidaBase, precioEstandar, densidad, pesoUnidad });
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
    const updates = { ...req.body };
    if (Object.prototype.hasOwnProperty.call(updates, 'clase')) {
      updates.controlado = isControlledType(updates.clase) || Boolean(updates.controlado);
    }
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
