import { getPool } from '../database/connection.js';
import { sendNotificationEmail } from '../services/emailService.js';
import sql from 'mssql';

async function createAndSendNotification(pool, recipient, { title, message, type = 'info', actaId, actaReference, emailStage }) {
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
    stage: emailStage,
  });
}

async function notifyRole(pool, role, notification) {
  const result = await pool.request()
    .input('role', role)
    .query("SELECT id, nombre, email FROM users WHERE rol = @role AND status = 'activo'");

  await Promise.all(result.recordset.map((recipient) => createAndSendNotification(pool, recipient, notification)));
}

function normalizeArea(value) {
  return String(value || "")
    .trim()
    .toLocaleLowerCase("es-CO")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

async function userBelongsToArea(pool, userId, area) {
  const result = await pool.request()
    .input('userId', userId)
    .query('SELECT area FROM users WHERE id = @userId AND status = \'activo\'');
  return normalizeArea(result.recordset[0]?.area) === normalizeArea(area);
}

async function notifyAreaApprovers(pool, area, notification) {
  const areaKey = normalizeArea(area);
  if (!areaKey) {
    console.warn("Acta sin área: no se envió notificación a aprobadores de área.");
    return;
  }

  const result = await pool.request()
    .query("SELECT id, nombre, email, area FROM users WHERE rol = 'aprobador_area' AND status = 'activo'");
  const recipients = result.recordset.filter((user) => normalizeArea(user.area) === areaKey);
  if (!recipients.length) {
    console.warn(`No hay aprobador activo para el área: ${area}`);
    return;
  }
  await Promise.all(recipients.map((recipient) => createAndSendNotification(pool, recipient, notification)));
}

async function getActiveUser(pool, userId) {
  const result = await pool.request()
    .input('userId', userId)
    .query("SELECT id, nombre, email FROM users WHERE id = @userId AND status = 'activo'");
  return result.recordset[0];
}

async function insertActaMaterial(pool, actaId, material, index) {
  const id = `am${Date.now()}-${index}-${Math.random().toString(36).slice(2, 8)}`;
  await pool.request()
    .input('id', id)
    .input('actaId', actaId)
    .input('descripcion', material.descripcion)
    .input('tipoMaterial', material.tipoMaterial)
    .input('codigoSAP', material.codigoSAP)
    .input('numeroLote', material.numeroLote)
    .input('ordenProduccion', material.ordenProduccion)
    .input('sustanciaControlada', material.sustanciaControlada)
    .input('clasificacion', material.clasificacion)
    .input('fechaVencimiento', material.fechaVencimiento)
    .input('registroINVIMA', material.registroINVIMA)
    .input('estadoInvima', material.estadoInvima)
    .input('invimaProductId', material.invimaProductId)
    .input('sapCodeId', material.sapCodeId)
    .input('pesoKg', material.pesoKg)
    .input('cantidadUnidades', material.cantidadUnidades)
    .input('costoUnitario', material.costoUnitario)
    .input('costoTotal', material.costoTotal)
    .query(`
      INSERT INTO acta_materiales
      (id, actaId, descripcion, tipoMaterial, codigoSAP, numeroLote, ordenProduccion, sustanciaControlada, clasificacion, fechaVencimiento, registroINVIMA, estadoInvima, invimaProductId, sapCodeId, pesoKg, cantidadUnidades, costoUnitario, costoTotal)
      VALUES (@id, @actaId, @descripcion, @tipoMaterial, @codigoSAP, @numeroLote, @ordenProduccion, @sustanciaControlada, @clasificacion, @fechaVencimiento, @registroINVIMA, @estadoInvima, @invimaProductId, @sapCodeId, @pesoKg, @cantidadUnidades, @costoUnitario, @costoTotal)
    `);
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
      responsable, area, descripcion, tipoMaterial, codigoSAP, numeroLote, ordenProduccion,
      sustanciaControlada, clasificacion, fechaVencimiento, registroINVIMA, estadoInvima,
      pesoKg, cantidadUnidades, costoDestruccion, causal, otraCausal, observaciones,
      adjuntos, cecoId, invimaProductId, sapCodeId, materiales,
    } = req.body;
    const requiereCostos = false;
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
      .input('tipoMaterial', tipoMaterial)
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
      .input('adjuntos', sql.NVarChar(sql.MAX), JSON.stringify(adjuntos || []))
      .input('requiereCostos', requiereCostos)
      .input('cecoId', cecoId)
      .input('invimaProductId', invimaProductId)
      .input('sapCodeId', sapCodeId)
      .query(`
        INSERT INTO actas 
        (id, consecutivo, status, empresa, centroCostos, fecha, solicitanteId, solicitanteNombre, responsable, area, descripcion, tipoMaterial, codigoSAP, numeroLote, ordenProduccion, sustanciaControlada, clasificacion, fechaVencimiento, registroINVIMA, estadoInvima, pesoKg, cantidadUnidades, costoDestruccion, causal, otraCausal, observaciones, adjuntos, requiereCostos, cecoId, invimaProductId, sapCodeId)
        VALUES (@id, @consecutivo, @status, @empresa, @centroCostos, @fecha, @solicitanteId, @solicitanteNombre, @responsable, @area, @descripcion, @tipoMaterial, @codigoSAP, @numeroLote, @ordenProduccion, @sustanciaControlada, @clasificacion, @fechaVencimiento, @registroINVIMA, @estadoInvima, @pesoKg, @cantidadUnidades, @costoDestruccion, @causal, @otraCausal, @observaciones, @adjuntos, @requiereCostos, @cecoId, @invimaProductId, @sapCodeId)
      `);

    const materialItems = Array.isArray(materiales) && materiales.length > 0
      ? materiales
      : [{ descripcion, tipoMaterial, codigoSAP, numeroLote, ordenProduccion, sustanciaControlada, clasificacion, fechaVencimiento, registroINVIMA, estadoInvima, invimaProductId, sapCodeId }];
    for (const [index, material] of materialItems.entries()) {
      await insertActaMaterial(pool, id, material, index);
    }

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
      materiales: materialItems,
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
    const materialsResult = await pool.request().query('SELECT * FROM acta_materiales ORDER BY createdAt, id');
    const materialsByActa = materialsResult.recordset.reduce((groups, material) => {
      if (!groups[material.actaId]) groups[material.actaId] = [];
      groups[material.actaId].push(material);
      return groups;
    }, {});
    res.json(result.recordset.map((acta) => ({ ...acta, materiales: materialsByActa[acta.id] || [] })));
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

    const materialesResult = await pool.request()
      .input('actaId', id)
      .query('SELECT * FROM acta_materiales WHERE actaId = @actaId ORDER BY createdAt, id');

    res.json({
      ...acta,
      historial: historialResult.recordset,
      aprobaciones: aprobacionesResult.recordset,
      materiales: materialesResult.recordset,
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
      if (key !== 'id' && key !== 'historial' && key !== 'aprobaciones' && key !== 'materiales') {
        fields.push(`${key} = @${key}`);
        if (key === 'adjuntos') {
          request.input(
            key,
            sql.NVarChar(sql.MAX),
            typeof value === 'string' ? value : JSON.stringify(value || []),
          );
        } else {
          request.input(key, value);
        }
      }
    });

    if (fields.length > 0) {
      await request.query(`UPDATE actas SET ${fields.join(', ')}, updatedAt = GETDATE() WHERE id = @id`);
    }

    if (Array.isArray(updates.materiales) && updates.materiales.length > 0) {
      await pool.request().input('actaId', id).query('DELETE FROM acta_materiales WHERE actaId = @actaId');
      for (const [index, material] of updates.materiales.entries()) {
        await insertActaMaterial(pool, id, material, index);
      }
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
    const actaResult = await pool.request().input('id', id).query('SELECT * FROM actas WHERE id = @id');
    const acta = actaResult.recordset[0];
    if (!acta) return res.status(404).json({ error: 'Acta no encontrada' });

    const involvedResult = await pool.request()
      .input('solicitanteId', acta.solicitanteId)
      .input('solicitanteNombre', acta.solicitanteNombre)
      .input('responsable', acta.responsable)
      .input('actaId', id)
      .query(`SELECT id, nombre, email FROM users
        WHERE status = 'activo' AND email IS NOT NULL AND email <> ''
          AND (id = @solicitanteId OR nombre IN (@solicitanteNombre, @responsable)
            OR EXISTS (SELECT 1 FROM acta_aprobaciones aa
              WHERE aa.actaId = @actaId AND (aa.aprobador = users.nombre OR aa.aprobador = users.username)))`);
    const globalAdminsResult = await pool.request()
      .query("SELECT id, nombre, email FROM users WHERE rol IN ('admin_global', 'administrador_global', 'global_admin') AND status = 'activo' AND email IS NOT NULL AND email <> ''");

    // Eliminar historial y aprobaciones primero
    await pool.request().input('actaId', id).query('DELETE FROM acta_historial WHERE actaId = @actaId');
    await pool.request().input('actaId', id).query('DELETE FROM acta_aprobaciones WHERE actaId = @actaId');
    await pool.request().input('actaId', id).query('DELETE FROM acta_materiales WHERE actaId = @actaId');
    await pool.request().input('actaId', id).query('DELETE FROM notifications WHERE actaId = @actaId');
    await pool.request().input('id', id).query('DELETE FROM actas WHERE id = @id');

    const recipients = new Map([...involvedResult.recordset, ...globalAdminsResult.recordset].map((recipient) => [recipient.email, recipient]));
    await Promise.allSettled([...recipients.values()].map((recipient) => sendNotificationEmail({
      to: recipient.email,
      recipientName: recipient.nombre,
      title: `Acta ${acta.consecutivo} eliminada`,
      message: `El acta ${acta.consecutivo} fue eliminada por el administrador global.`,
      actaId: acta.consecutivo,
    })));

    res.json({ message: 'Acta eliminada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Enviar a aprobación desde el servidor para que el aviso no dependa de que
// el navegador del solicitante permanezca abierto.
export async function submitActa(req, res) {
  try {
    const { id } = req.params;
    const requiereCostos = false;
    const pool = getPool();
    const actaResult = await pool.request().input('id', id)
      .query('SELECT id, consecutivo, solicitanteId, status, area FROM actas WHERE id = @id');
    const acta = actaResult.recordset[0];
    if (!acta) return res.status(404).json({ error: 'Acta no encontrada' });
    if (['pendiente_aprobacion_area', 'pendiente_costos', 'pendiente_hse', 'aprobada'].includes(acta.status)) {
      return res.status(409).json({ error: 'El acta ya se encuentra en el flujo de aprobación' });
    }

    await pool.request()
      .input('id', id)
      .input('requiereCostos', Boolean(requiereCostos))
      .query("UPDATE actas SET status = 'pendiente_aprobacion_area', requiereCostos = @requiereCostos, updatedAt = GETDATE() WHERE id = @id");

    await pool.request()
      .input('actaId', id)
      .query(`UPDATE acta_aprobaciones
        SET status = CASE WHEN paso = 'costos' THEN 'no_aplica' ELSE 'pendiente' END,
          aprobador = NULL, comentario = NULL, motivo = NULL, ajustes = NULL
        WHERE actaId = @actaId`);

    await notifyAreaApprovers(pool, acta.area, {
      title: 'Nueva acta para aprobación del área',
      message: `El acta ${acta.consecutivo} está pendiente de revisión y aprobación por parte del aprobador del área ${acta.area}. Ingresa al sistema para revisarla.`,
      emailStage: 'Revisión del aprobador de área',
      type: 'info',
      actaId: id,
      actaReference: acta.consecutivo,
    });

    const requester = await getActiveUser(pool, acta.solicitanteId);
    if (requester) {
      await createAndSendNotification(pool, requester, {
        title: 'Acta enviada a aprobación',
        message: `El acta ${acta.consecutivo} fue enviada correctamente y está pendiente de revisión del aprobador de área.`,
        type: 'success', actaId: id, actaReference: acta.consecutivo,
      });
    }
    res.json({ message: 'Acta enviada a aprobación' });
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
      .query('SELECT consecutivo, solicitanteId, status, area FROM actas WHERE id = @id');
    const acta = actaResult.recordset[0];
    if (!acta) return res.status(404).json({ error: 'Acta no encontrada' });

    const expectedStepByStatus = {
      pendiente_aprobacion_area: 'area',
      pendiente_hse: 'hse',
    };
    const expectedStep = expectedStepByStatus[acta.status];
    if (!expectedStep || paso !== expectedStep) {
      return res.status(409).json({ error: 'El acta aún no ha llegado a este paso de aprobación' });
    }
    const requiredRoleByStep = { area: 'aprobador_area', hse: 'hse' };
    if (req.user.rol !== requiredRoleByStep[paso]) {
      return res.status(403).json({ error: 'Este usuario no es el aprobador asignado para este paso' });
    }
    if (paso === 'area' && !(await userBelongsToArea(pool, req.user.id, acta.area))) {
      return res.status(403).json({ error: 'Este usuario no está asignado al área del acta' });
    }

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

    const nextStatus = paso === 'area' ? 'pendiente_hse' : 'aprobada';

    await pool.request()
      .input('id', id)
      .input('status', nextStatus)
      .query('UPDATE actas SET status = @status, updatedAt = GETDATE() WHERE id = @id');

    const nextRole = nextStatus === 'pendiente_hse' ? 'hse' : null;
    const nextRoleLabel = 'HSE & S';

    // El correo al siguiente aprobador sale después de persistir el cambio de estado.
    if (nextRole) {
      await notifyRole(pool, nextRole, {
        title: 'Acta aprobada por el área: revisión HSE pendiente',
        message: `El aprobador del área ${acta.area} aprobó el acta ${acta.consecutivo}. Ahora está pendiente de tu revisión por el equipo ${nextRoleLabel}. Ingresa al sistema para continuar el flujo de aprobación.`,
        emailStage: 'Revisión de HSE & S',
        type: 'info',
        actaId: id,
        actaReference: acta.consecutivo,
      });
    }

    const requester = await getActiveUser(pool, acta.solicitanteId);
    if (requester) {
      const statusMessage = nextRole
        ? `fue aprobada en el área y ahora está pendiente de revisión por ${nextRoleLabel}.`
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
      .query('SELECT consecutivo, solicitanteId, status, area FROM actas WHERE id = @id');
    const acta = actaResult.recordset[0];
    if (!acta) return res.status(404).json({ error: 'Acta no encontrada' });
    const expectedStepByStatus = { pendiente_aprobacion_area: 'area', pendiente_hse: 'hse' };
    if (expectedStepByStatus[acta.status] !== paso) {
      return res.status(409).json({ error: 'El acta aún no ha llegado a este paso de aprobación' });
    }
    const requiredRoleByStep = { area: 'aprobador_area', hse: 'hse' };
    if (req.user.rol !== requiredRoleByStep[paso]) {
      return res.status(403).json({ error: 'Este usuario no es el aprobador asignado para este paso' });
    }
    if (paso === 'area' && !(await userBelongsToArea(pool, req.user.id, acta.area))) {
      return res.status(403).json({ error: 'Este usuario no está asignado al área del acta' });
    }

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

    const requester = await getActiveUser(pool, acta.solicitanteId);
    if (requester) {
      await createAndSendNotification(pool, requester, {
        title: 'Acta rechazada',
        message: `El acta ${acta.consecutivo} fue rechazada por ${aprobador}. Motivo: ${motivo}`,
        type: 'error', actaId: id, actaReference: acta.consecutivo,
      });
    }

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
      .query('SELECT consecutivo, solicitanteId, status, area FROM actas WHERE id = @id');
    const acta = actaResult.recordset[0];
    if (!acta) return res.status(404).json({ error: 'Acta no encontrada' });
    const expectedStepByStatus = { pendiente_aprobacion_area: 'area', pendiente_hse: 'hse' };
    if (expectedStepByStatus[acta.status] !== paso) {
      return res.status(409).json({ error: 'El acta aún no ha llegado a este paso de aprobación' });
    }
    const requiredRoleByStep = { area: 'aprobador_area', hse: 'hse' };
    if (req.user.rol !== requiredRoleByStep[paso]) {
      return res.status(403).json({ error: 'Este usuario no es el aprobador asignado para este paso' });
    }
    if (paso === 'area' && !(await userBelongsToArea(pool, req.user.id, acta.area))) {
      return res.status(403).json({ error: 'Este usuario no está asignado al área del acta' });
    }

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
