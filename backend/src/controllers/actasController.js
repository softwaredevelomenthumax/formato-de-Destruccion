import { getPool } from '../database/connection.js';

async function getNextConsecutivo(pool) {
  const year = new Date().getFullYear();
  const pattern = `ACT-${year}-%`;

  const result = await pool.request()
    .input('pattern', pattern)
    .query(`
      SELECT consecutivo
      FROM actas
      WHERE consecutivo LIKE @pattern
      ORDER BY createdAt DESC
    `);

  const maxNumber = result.recordset.reduce((max, row) => {
    const match = String(row.consecutivo || '').match(new RegExp(`^ACT-${year}-(\\d+)$`));
    if (!match) return max;
    return Math.max(max, Number(match[1]));
  }, 0);

  return `ACT-${year}-${String(maxNumber + 1).padStart(3, '0')}`;
}

// Crear acta
export async function createActa(req, res) {
  try {
    const {
      status = 'borrador', empresa, centroCostos, fecha, solicitanteId, solicitanteNombre,
      responsable, area, descripcion, codigoSAP, numeroLote, ordenProduccion,
      sustanciaControlada, clasificacion, fechaVencimiento, registroINVIMA,
      pesoKg, cantidadUnidades, costoDestruccion, causal, otraCausal, observaciones,
      adjuntos, requiereCostos,
    } = req.body;
    const pool = getPool();

    const id = `a${Date.now()}`;
    const consecutivo = await getNextConsecutivo(pool);

    await pool.request()
      .input('id', id)
      .input('consecutivo', consecutivo)
      .input('status', status)
      .input('empresa', empresa)
      .input('centroCostos', centroCostos)
      .input('fecha', fecha)
      .input('solicitanteId', solicitanteId)
      .input('solicitanteNombre', solicitanteNombre)
      .input('responsable', responsable)
      .input('area', area)
      .input('descripcion', descripcion)
      .input('codigoSAP', codigoSAP)
      .input('numeroLote', numeroLote)
      .input('ordenProduccion', ordenProduccion)
      .input('sustanciaControlada', sustanciaControlada)
      .input('clasificacion', clasificacion)
      .input('fechaVencimiento', fechaVencimiento)
      .input('registroINVIMA', registroINVIMA)
      .input('pesoKg', pesoKg)
      .input('cantidadUnidades', cantidadUnidades)
      .input('costoDestruccion', costoDestruccion)
      .input('causal', causal)
      .input('otraCausal', otraCausal)
      .input('observaciones', observaciones)
      .input('adjuntos', JSON.stringify(adjuntos || []))
      .input('requiereCostos', requiereCostos)
      .query(`
        INSERT INTO actas 
        (id, consecutivo, status, empresa, centroCostos, fecha, solicitanteId, solicitanteNombre, responsable, area, descripcion, codigoSAP, numeroLote, ordenProduccion, sustanciaControlada, clasificacion, fechaVencimiento, registroINVIMA, pesoKg, cantidadUnidades, costoDestruccion, causal, otraCausal, observaciones, adjuntos, requiereCostos)
        VALUES (@id, @consecutivo, @status, @empresa, @centroCostos, @fecha, @solicitanteId, @solicitanteNombre, @responsable, @area, @descripcion, @codigoSAP, @numeroLote, @ordenProduccion, @sustanciaControlada, @clasificacion, @fechaVencimiento, @registroINVIMA, @pesoKg, @cantidadUnidades, @costoDestruccion, @causal, @otraCausal, @observaciones, @adjuntos, @requiereCostos)
      `);

    // Crear historial inicial
    const histId = `h${Date.now()}`;
    const now = new Date();
    const historialFecha = now.toISOString().split('T')[0];
    const historialHora = now.toTimeString().slice(0, 5);

    await pool.request()
      .input('id', histId)
      .input('actaId', id)
      .input('usuario', solicitanteNombre)
      .input('fecha', historialFecha)
      .input('hora', historialHora)
      .input('equipo', 'WEB')
      .input('accion', status === 'borrador' ? 'Borrador guardado' : 'Acta creada')
      .query(`
        INSERT INTO acta_historial (id, actaId, usuario, fecha, hora, equipo, accion)
        VALUES (@id, @actaId, @usuario, @fecha, @hora, @equipo, @accion)
      `);

    // Crear aprobaciones
    const aprobaciones = [
      { paso: 'area', status: 'pendiente' },
      { paso: 'costos', status: requiereCostos ? 'pendiente' : 'no_aplica' },
      { paso: 'hse', status: 'pendiente' },
    ];

    for (const aprobacion of aprobaciones) {
      const aprobId = `ap${Date.now()}-${Math.random()}`;
      await pool.request()
        .input('id', aprobId)
        .input('actaId', id)
        .input('paso', aprobacion.paso)
        .input('status', aprobacion.status)
        .query(`
          INSERT INTO acta_aprobaciones (id, actaId, paso, status)
          VALUES (@id, @actaId, @paso, @status)
        `);
    }

    res.status(201).json({
      ...req.body,
      id,
      consecutivo,
      status,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      historial: [],
      aprobaciones,
      adjuntos: adjuntos || [],
      requiereCostos: !!requiereCostos,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Obtener todas las actas
export async function getActas(req, res) {
  try {
    const pool = getPool();
    const result = await pool.request().query('SELECT * FROM actas ORDER BY createdAt DESC');
    res.json(result.recordset);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Obtener acta por ID
export async function getActaById(req, res) {
  try {
    const { id } = req.params;
    const pool = getPool();

    const actaResult = await pool.request()
      .input('id', id)
      .query('SELECT * FROM actas WHERE id = @id');

    if (actaResult.recordset.length === 0) {
      return res.status(404).json({ error: 'Acta no encontrada' });
    }

    const acta = actaResult.recordset[0];

    // Obtener historial
    const historialResult = await pool.request()
      .input('actaId', id)
      .query('SELECT * FROM acta_historial WHERE actaId = @actaId ORDER BY fecha, hora');

    // Obtener aprobaciones
    const aprobacionesResult = await pool.request()
      .input('actaId', id)
      .query('SELECT paso, status, aprobador, comentario FROM acta_aprobaciones WHERE actaId = @actaId');

    res.json({
      ...acta,
      historial: historialResult.recordset,
      aprobaciones: aprobacionesResult.recordset,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Actualizar acta
export async function updateActa(req, res) {
  try {
    const { id } = req.params;
    const updates = req.body;
    const pool = getPool();

    const fields = [];
    const request = pool.request().input('id', id);

    Object.entries(updates).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'historial' && key !== 'aprobaciones') {
        fields.push(`${key} = @${key}`);
        request.input(key, value);
      }
    });

    if (fields.length > 0) {
      await request.query(`UPDATE actas SET ${fields.join(', ')}, updatedAt = GETDATE() WHERE id = @id`);
    }

    res.json({ message: 'Acta actualizada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Eliminar acta
export async function deleteActa(req, res) {
  try {
    const { id } = req.params;
    const pool = getPool();

    // Eliminar historial y aprobaciones primero
    await pool.request().input('actaId', id).query('DELETE FROM acta_historial WHERE actaId = @actaId');
    await pool.request().input('actaId', id).query('DELETE FROM acta_aprobaciones WHERE actaId = @actaId');
    await pool.request().input('id', id).query('DELETE FROM actas WHERE id = @id');

    res.json({ message: 'Acta eliminada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Aprobar acta
export async function approveActa(req, res) {
  try {
    const { id } = req.params;
    const { paso, aprobador, comentario } = req.body;
    const pool = getPool();

    const aprobId = `ap${Date.now()}`;
    await pool.request()
      .input('id', aprobId)
      .input('actaId', id)
      .input('paso', paso)
      .input('status', 'aprobado')
      .input('aprobador', aprobador)
      .input('comentario', comentario)
      .query(`
        UPDATE acta_aprobaciones SET status = 'aprobado', aprobador = @aprobador, comentario = @comentario
        WHERE actaId = @actaId AND paso = @paso
      `);

    const nextStatus = paso === 'area'
      ? (await pool.request().input('id', id).query('SELECT requiereCostos FROM actas WHERE id = @id')).recordset[0]?.requiereCostos
        ? 'pendiente_costos'
        : 'pendiente_hse'
      : paso === 'costos' ? 'pendiente_hse' : 'aprobada';

    await pool.request()
      .input('id', id)
      .input('status', nextStatus)
      .query('UPDATE actas SET status = @status, updatedAt = GETDATE() WHERE id = @id');

    res.json({ message: 'Acta aprobada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Rechazar acta
export async function rejectActa(req, res) {
  try {
    const { id } = req.params;
    const { paso, aprobador, motivo } = req.body;
    const pool = getPool();

    await pool.request()
      .input('actaId', id)
      .input('paso', paso)
      .input('aprobador', aprobador)
      .input('motivo', motivo)
      .query(`
        UPDATE acta_aprobaciones
        SET status = 'rechazado', aprobador = @aprobador, motivo = @motivo
        WHERE actaId = @actaId AND paso = @paso
      `);

    await pool.request()
      .input('id', id)
      .query("UPDATE actas SET status = 'rechazada', updatedAt = GETDATE() WHERE id = @id");

    res.json({ message: 'Acta rechazada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
