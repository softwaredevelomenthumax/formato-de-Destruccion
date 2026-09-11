import { getPool } from '../database/connection.js';
import { sendNotificationEmail } from '../services/emailService.js';

async function createAndSendNotification(pool, recipient, { title, message, type = 'info', actaId, actaReference }) {
  // La columna notifications.id admite hasta 50 caracteres. Los UUID de
  // usuarios ocupan 36, por lo que no deben formar parte del identificador.
  const id = `n${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
  await pool.request()
    .input('id', id)
    .input('userId', recipient.id)
    .input('titulo', title)
    .input('mensaje', message)
    .input('tipo', type)
    .input('actaId', actaId)
    .query(`INSERT INTO notifications (id, userId, titulo, mensaje, tipo, actaId)
      VALUES (@id, @userId, @titulo, @mensaje, @tipo, @actaId)`);

  await sendNotificationEmail({
    to: recipient.email,
    recipientName: recipient.nombre,
    title,
    message,
    actaId: actaReference || actaId,
  });
}

async function notifyRole(pool, role, notification) {
  const result = await pool.request()
    .input('role', role)
    .query("SELECT id, nombre, email FROM users WHERE rol = @role AND status = 'activo'");

  await Promise.all(result.recordset.map((recipient) => createAndSendNotification(pool, recipient, notification)));
}

async function getActiveUser(pool, userId) {
  const result = await pool.request()
    .input('userId', userId)
    .query("SELECT id, nombre, email FROM users WHERE id = @userId AND status = 'activo'");
  return result.recordset[0];
}

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
      sustanciaControlada, clasificacion, fechaVencimiento, registroINVIMA, estadoInvima,
      pesoKg, cantidadUnidades, costoDestruccion, causal, otraCausal, observaciones,
      adjuntos, requiereCostos, cecoId, invimaProductId, sapCodeId,
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
      .input('estadoInvima', estadoInvima)
      .input('pesoKg', pesoKg)
      .input('cantidadUnidades', cantidadUnidades)
      .input('costoDestruccion', costoDestruccion)
      .input('causal', causal)
      .input('otraCausal', otraCausal)
      .input('observaciones', observaciones)
      .input('adjuntos', JSON.stringify(adjuntos || []))
      .input('requiereCostos', requiereCostos)
      .input('cecoId', cecoId)
      .input('invimaProductId', invimaProductId)
      .input('sapCodeId', sapCodeId)
      .query(`
        INSERT INTO actas 
        (id, consecutivo, status, empresa, centroCostos, fecha, solicitanteId, solicitanteNombre, responsable, area, descripcion, codigoSAP, numeroLote, ordenProduccion, sustanciaControlada, clasificacion, fechaVencimiento, registroINVIMA, estadoInvima, pesoKg, cantidadUnidades, costoDestruccion, causal, otraCausal, observaciones, adjuntos, requiereCostos, cecoId, invimaProductId, sapCodeId)
        VALUES (@id, @consecutivo, @status, @empresa, @centroCostos, @fecha, @solicitanteId, @solicitanteNombre, @responsable, @area, @descripcion, @codigoSAP, @numeroLote, @ordenProduccion, @sustanciaControlada, @clasificacion, @fechaVencimiento, @registroINVIMA, @estadoInvima, @pesoKg, @cantidadUnidades, @costoDestruccion, @causal, @otraCausal, @observaciones, @adjuntos, @requiereCostos, @cecoId, @invimaProductId, @sapCodeId)
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

// Enviar a aprobaciÃ³n desde el servidor para que el aviso no dependa de que
// el navegador del solicitante permanezca abierto.
export async function submitActa(req, res) {
  try {
    const { id } = req.params;
    const { requiereCostos } = req.body;
    const pool = getPool();
    const actaResult = await pool.request().input('id', id)
      .query('SELECT id, consecutivo, solicitanteId, status FROM actas WHERE id = @id');
    const acta = actaResult.recordset[0];
    if (!acta) return res.status(404).json({ error: 'Acta no encontrada' });
    if (['pendiente_aprobacion_area', 'pendiente_costos', 'pendiente_hse', 'aprobada'].includes(acta.status)) {
      return res.status(409).json({ error: 'El acta ya se encuentra en el flujo de aprobaciÃ³n' });
    }

    await pool.request()
      .input('id', id)
      .input('requiereCostos', Boolean(requiereCostos))
      .query("UPDATE actas SET status = 'pendiente_aprobacion_area', requiereCostos = @requiereCostos, updatedAt = GETDATE() WHERE id = @id");

    await pool.request()
      .input('actaId', id)
      .input('requiereCostos', Boolean(requiereCostos))
      .query(`UPDATE acta_aprobaciones
        SET status = CASE WHEN paso = 'costos' AND @requiereCostos = 0 THEN 'no_aplica' ELSE 'pendiente' END,
          aprobador = NULL, comentario = NULL, motivo = NULL, ajustes = NULL
        WHERE actaId = @actaId`);

    await notifyRole(pool, 'aprobador_area', {
      title: 'Nueva acta pendiente de aprobaciÃ³n',
      message: `El acta ${acta.consecutivo} requiere su aprobaciÃ³n de Ã¡rea.`,
      type: 'info',
      actaId: id,
      actaReference: acta.consecutivo,
    });

    const requester = await getActiveUser(pool, acta.solicitanteId);
    if (requester) {
      await createAndSendNotification(pool, requester, {
        title: 'Acta enviada a aprobaciÃ³n',
        message: `El acta ${acta.consecutivo} fue enviada correctamente y estÃ¡ pendiente de revisiÃ³n del aprobador de Ã¡rea.`,
        type: 'success', actaId: id, actaReference: acta.consecutivo,
      });
    }
    res.json({ message: 'Acta enviada a aprobaciÃ³n' });
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

    const actaResult = await pool.request()
      .input('id', id)
      .query('SELECT consecutivo, solicitanteId, requiereCostos FROM actas WHERE id = @id');
    const acta = actaResult.recordset[0];
    if (!acta) return res.status(404).json({ error: 'Acta no encontrada' });

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
      ? acta.requiereCostos
        ? 'pendiente_costos'
        : 'pendiente_hse'
      : paso === 'costos' ? 'pendiente_hse' : 'aprobada';

    await pool.request()
      .input('id', id)
      .input('status', nextStatus)
      .query('UPDATE actas SET status = @status, updatedAt = GETDATE() WHERE id = @id');

    const nextRole = nextStatus === 'pendiente_costos' ? 'costos'
      : nextStatus === 'pendiente_hse' ? 'hse' : null;
    const nextRoleLabel = nextRole === 'costos' ? 'Costos' : 'HSE & S';

    // El servidor genera el aviso. Así, si Costos aprueba, HSE recibe el
    // correo aunque quien aprobó cierre el navegador inmediatamente.
    if (nextRole) {
      await notifyRole(pool, nextRole, {
        title: 'Acta pendiente de tu aprobación',
        message: `El acta ${acta.consecutivo} está pendiente de tu aprobación en ${nextRoleLabel}. Ingresa al sistema para revisarla.`,
        type: 'info',
        actaId: id,
        actaReference: acta.consecutivo,
      });
    }

    const requester = await getActiveUser(pool, acta.solicitanteId);
    if (requester) {
      const statusMessage = nextRole
        ? `fue aprobada en ${paso === 'area' ? 'Aprobación de Área' : 'Costos'} y ahora está pendiente de revisión por ${nextRoleLabel}.`
        : 'fue aprobada completamente.';
      await createAndSendNotification(pool, requester, {
        title: 'Actualización de tu acta',
        message: `El acta ${acta.consecutivo} ${statusMessage}`,
        type: nextRole ? 'info' : 'success',
        actaId: id,
        actaReference: acta.consecutivo,
      });
    }

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

    const actaResult = await pool.request().input('id', id)
      .query('SELECT consecutivo, solicitanteId FROM actas WHERE id = @id');
    const acta = actaResult.recordset[0];
    if (!acta) return res.status(404).json({ error: 'Acta no encontrada' });

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

export async function returnActa(req, res) {
  try {
    const { id } = req.params;
    const { paso, aprobador, ajustes } = req.body;
    const pool = getPool();
    const actaResult = await pool.request().input('id', id)
      .query('SELECT consecutivo, solicitanteId FROM actas WHERE id = @id');
    const acta = actaResult.recordset[0];
    if (!acta) return res.status(404).json({ error: 'Acta no encontrada' });

    await pool.request()
      .input('actaId', id).input('paso', paso).input('aprobador', aprobador).input('ajustes', JSON.stringify(ajustes || []))
      .query("UPDATE acta_aprobaciones SET status = 'devuelto', aprobador = @aprobador, ajustes = @ajustes WHERE actaId = @actaId AND paso = @paso");
    await pool.request().input('id', id)
      .query("UPDATE actas SET status = 'devuelta_ajustes', updatedAt = GETDATE() WHERE id = @id");

    const details = (ajustes || []).map((item) => `${item.campo}: ${item.comentario || item.correccion || ''}`).join('; ');
    const requester = await getActiveUser(pool, acta.solicitanteId);
    if (requester) {
      await createAndSendNotification(pool, requester, {
        title: 'Acta devuelta para ajustes',
        message: `Su acta ${acta.consecutivo} requiere correcciones.${details ? ` Detalle: ${details}` : ''}`,
        type: 'warning', actaId: id, actaReference: acta.consecutivo,
      });
    }
    res.json({ message: 'Acta devuelta para ajustes' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
