import { getPool } from '../database/connection.js';

// Crear producto INVIMA
export async function createInvimaProduct(req, res) {
  try {
    const { productName, registryNumber, internalStatus, holder, tipoMedicamento, controlado, presentacion } = req.body;
    const pool = getPool();

    const id = `inv${Date.now()}`;

    await pool.request()
      .input('id', id)
      .input('productName', productName)
      .input('registryNumber', registryNumber)
      .input('internalStatus', internalStatus)
      .input('holder', holder)
      .input('tipoMedicamento', tipoMedicamento)
      .input('controlado', controlado)
      .input('presentacion', presentacion)
      .query(`
        INSERT INTO invima_products (id, productName, registryNumber, internalStatus, holder, tipoMedicamento, controlado, presentacion)
        VALUES (@id, @productName, @registryNumber, @internalStatus, @holder, @tipoMedicamento, @controlado, @presentacion)
      `);

    res.status(201).json({ id, productName, registryNumber, internalStatus, holder, tipoMedicamento, controlado, presentacion });
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
