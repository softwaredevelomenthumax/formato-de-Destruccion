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

  const emailResult = await sendNotificationEmail({
    to: recipient.email,
    recipientName: recipient.nombre,
    title,
    message,
    actaId: actaReference || actaId,
    stage: emailStage,
  });
  const recipientIdentifier = recipient.username || recipient.id;
  if (emailResult.sent) {
    console.info(`Correo de notificación aceptado por SMTP para ${recipientIdentifier} (entrega al buzón no confirmada): ${emailResult.messageId || 'sin ID de mensaje'}`);
  } else {
    const reason = emailResult.reason === 'no_email' ? 'el usuario no tiene un correo registrado' : emailResult.reason || 'error desconocido';
    console.error(`Correo de notificación no enviado para ${recipientIdentifier}: ${reason}`);
  }
  return { userId: recipient.id, sent: emailResult.sent, reason: emailResult.reason };
}

async function notifyRole(pool, role, notification) {
  const result = await pool.request()
    .input('role', role)
    .query(`SELECT id, nombre, email FROM users
      WHERE (LOWER(LTRIM(RTRIM(rol))) = @role
        OR (@role = 'hse' AND LOWER(LTRIM(RTRIM(rol))) IN ('hse & s', 'hse_s')))
        AND LOWER(LTRIM(RTRIM(status))) = 'activo'`);

  if (result.recordset.length === 0) {
    console.error(`No se encontró ningún usuario HSE activo para notificar sobre el acta ${notification.actaReference || notification.actaId}`);
    return [];
  }

  const deliveries = await Promise.allSettled(result.recordset.map((recipient) => createAndSendNotification(pool, recipient, notification)));
  return deliveries.map((delivery, index) => delivery.status === 'fulfilled'
    ? delivery.value
    : { userId: result.recordset[index].id, sent: false, reason: delivery.reason?.message || 'notification_failed' });
}

function normalizeArea(value) {
  return String(value || "")
    .trim()
    .toLocaleLowerCase("es-CO")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

function validateActaControlStatus(materials, actaControlStatus) {
  if (!Array.isArray(materials) || materials.length === 0) return null;
  if (typeof actaControlStatus !== 'boolean' || materials.some((material) => typeof material.sustanciaControlada !== 'boolean')) {
    return 'Todos los productos deben tener definida su condición de control.';
  }
  if (new Set(materials.map((material) => material.sustanciaControlada)).size > 1
    || materials.some((material) => material.sustanciaControlada !== actaControlStatus)) {
    return 'Todos los productos de una misma acta deben tener la misma condición de control.';
  }
  return null;
}

function normalizeApprovalMaterialType(value) {
  const normalized = String(value || '').trim().toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[\s_-]+/g, '');
  const aliases = {
    MP: 'ROH',
    MATERIAPRIMA: 'ROH',
    PT: 'FERT',
    PRODUCTOTERMINADO: 'FERT',
    ST: 'HALB',
    SEMITERMINADO: 'HALB',
    ME: 'VERP',
    MATERIALEMPAQUE: 'VERP',
  };
  return aliases[normalized] || normalized;
}

function requiresCostApprovalByMaterialType(types) {
  const requiredTypes = new Set(['ROH', 'VERP', 'FERT', 'HALB', 'ZMC']);
  return types.some((type) => requiredTypes.has(normalizeApprovalMaterialType(type)));
}

const MATERIAL_APPROVAL_ORDER = ['material_planeacion', 'material_lab_calidad'];
const MATERIAL_APPROVAL_ROLES = {
  material_planeacion: 'planeacion',
  material_lab_calidad: 'lab_calidad',
};
const MATERIAL_APPROVAL_LABELS = {
  material_planeacion: 'Planeación financiera',
  material_lab_calidad: 'Lab-calidad',
};

function getMaterialApprovalSteps(types) {
  const mappedSteps = new Set(types.map((type) => {
    const normalized = normalizeApprovalMaterialType(type);
    if (['ZNBW', 'WERB'].includes(normalized)) return 'material_planeacion';
    if (normalized === 'UNBW') return 'material_lab_calidad';
    return null;
  }).filter(Boolean));
  return MATERIAL_APPROVAL_ORDER.filter((step) => mappedSteps.has(step));
}

async function getNextPendingMaterialApproval(pool, actaId) {
  const result = await pool.request()
    .input('actaId', actaId)
    .query("SELECT paso FROM acta_aprobaciones WHERE actaId = @actaId AND status = 'pendiente'");
  const pendingSteps = new Set(result.recordset.map((approval) => approval.paso));
  return MATERIAL_APPROVAL_ORDER.find((step) => pendingSteps.has(step));
}

async function getExpectedApprovalStep(pool, actaId, status) {
  if (status === 'pendiente_aprobacion_material') return getNextPendingMaterialApproval(pool, actaId);
  return {
    pendiente_aprobacion_area: 'area',
    pendiente_costos: 'costos',
    pendiente_hse: 'hse',
  }[status];
}

function getRequiredRoleForApproval(step) {
  return MATERIAL_APPROVAL_ROLES[step] || { area: 'aprobador_area', costos: 'costos', hse: 'hse' }[step];
}

function serializeApproval(approval) {
  let ajustes = approval.ajustes;
  if (typeof ajustes === 'string') {
    try {
      ajustes = JSON.parse(ajustes);
    } catch {
      ajustes = [];
    }
  }

  return {
    paso: approval.paso,
    status: approval.status,
    aprobador: approval.aprobador,
    comentario: approval.comentario,
    motivoRechazo: approval.motivo,
    ajustes: Array.isArray(ajustes) ? ajustes : [],
  };
}

async function userBelongsToArea(pool, userId, area) {
  const result = await pool.request()
    .input('userId', userId)
    .query('SELECT area FROM users WHERE id = @userId AND status = \'activo\'');
  return normalizeArea(result.recordset[0]?.area) === normalizeArea(area);
}

async function getAreaApproverIdentifier(pool, actaId) {
  const result = await pool.request()
    .input('actaId', actaId)
    .query("SELECT aprobador FROM acta_aprobaciones WHERE actaId = @actaId AND paso = 'area'");
  return result.recordset[0]?.aprobador;
}

async function notifyAreaApprovers(pool, area, notification, approverIdentifier) {
  const areaKey = normalizeArea(area);
  if (!areaKey) {
    console.warn("Acta sin área: no se envió notificación a aprobadores de área.");
    return;
  }

  const result = await pool.request()
    .query("SELECT id, username, nombre, email, area FROM users WHERE rol = 'aprobador_area' AND status = 'activo'");
  const approverKey = normalizeArea(approverIdentifier);
  const recipients = result.recordset.filter((user) =>
    normalizeArea(user.area) === areaKey
      && (!approverKey || normalizeArea(user.username) === approverKey || normalizeArea(user.nombre) === approverKey)
  );
  if (!recipients.length) {
    console.warn(`No hay aprobador activo para el área: ${area}`);
    return;
  }
  const deliveries = await Promise.allSettled(recipients.map((recipient) => createAndSendNotification(pool, recipient, notification)));
  return deliveries.map((delivery, index) => delivery.status === 'fulfilled'
    ? delivery.value
    : { userId: recipients[index].id, sent: false, reason: delivery.reason?.message || 'notification_failed' });
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
    const materialItems = Array.isArray(materiales) && materiales.length > 0
      ? materiales
      : [{ descripcion, tipoMaterial, codigoSAP, numeroLote, ordenProduccion, sustanciaControlada, clasificacion, fechaVencimiento, registroINVIMA, estadoInvima, invimaProductId, sapCodeId }];
    const controlStatusError = validateActaControlStatus(materialItems, sustanciaControlada);
    if (controlStatusError) return res.status(400).json({ error: controlStatusError });
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
    const materialApprovalSteps = getMaterialApprovalSteps([
      tipoMaterial,
      ...materialItems.map((material) => material.tipoMaterial),
    ]);
    const aprobaciones = [
      ...materialApprovalSteps.map((paso) => ({ paso, status: 'pendiente' })),
      { paso: 'area', status: 'pendiente' },
      { paso: 'costos', status: 'no_aplica' },
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
    const approvalsResult = await pool.request().query('SELECT actaId, paso, status, aprobador, comentario, motivo, ajustes FROM acta_aprobaciones');
    const materialsByActa = materialsResult.recordset.reduce((groups, material) => {
      if (!groups[material.actaId]) groups[material.actaId] = [];
      groups[material.actaId].push(material);
      return groups;
    }, {});
    const approvalsByActa = approvalsResult.recordset.reduce((groups, approval) => {
      if (!groups[approval.actaId]) groups[approval.actaId] = [];
      groups[approval.actaId].push(serializeApproval(approval));
      return groups;
    }, {});
    res.json(result.recordset.map((acta) => ({
      ...acta,
      materiales: materialsByActa[acta.id] || [],
      aprobaciones: approvalsByActa[acta.id] || [],
    })));
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
      .query('SELECT paso, status, aprobador, comentario, motivo, ajustes FROM acta_aprobaciones WHERE actaId = @actaId');

    const materialesResult = await pool.request()
      .input('actaId', id)
      .query('SELECT * FROM acta_materiales WHERE actaId = @actaId ORDER BY createdAt, id');

    res.json({
      ...acta,
      historial: historialResult.recordset,
      aprobaciones: aprobacionesResult.recordset.map(serializeApproval),
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

    if (Array.isArray(updates.materiales) && updates.materiales.length > 0) {
      const controlStatusError = validateActaControlStatus(updates.materiales, updates.sustanciaControlada);
      if (controlStatusError) return res.status(400).json({ error: controlStatusError });
    } else if (Object.prototype.hasOwnProperty.call(updates, 'sustanciaControlada')) {
      if (typeof updates.sustanciaControlada !== 'boolean') {
        return res.status(400).json({ error: 'Seleccione la condición de control del acta.' });
      }
      const materialsResult = await pool.request()
        .input('actaId', id)
        .query('SELECT sustanciaControlada FROM acta_materiales WHERE actaId = @actaId');
      if (materialsResult.recordset.some((material) => material.sustanciaControlada !== updates.sustanciaControlada)) {
        return res.status(400).json({ error: 'Todos los productos de una misma acta deben tener la misma condición de control.' });
      }
    }

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
      .query("SELECT id, nombre, email FROM users WHERE LOWER(LTRIM(RTRIM(rol))) IN ('admin_global', 'administrador_global', 'global_admin') AND LOWER(LTRIM(RTRIM(status))) = 'activo'");

    // Eliminar historial y aprobaciones primero
    await pool.request().input('actaId', id).query('DELETE FROM acta_historial WHERE actaId = @actaId');
    await pool.request().input('actaId', id).query('DELETE FROM acta_aprobaciones WHERE actaId = @actaId');
    await pool.request().input('actaId', id).query('DELETE FROM acta_materiales WHERE actaId = @actaId');
    await pool.request().input('actaId', id).query('DELETE FROM notifications WHERE actaId = @actaId');
    await pool.request().input('id', id).query('DELETE FROM actas WHERE id = @id');

    const globalAdminIds = new Set(globalAdminsResult.recordset.map((recipient) => recipient.id));
    const otherEmailRecipients = new Map(involvedResult.recordset
      .filter((recipient) => !globalAdminIds.has(recipient.id))
      .map((recipient) => [recipient.email, recipient]));
    const deletionMessage = `El usuario ${req.user.username} eliminó el acta ${acta.consecutivo}.`;
    const globalAdminNotifications = globalAdminsResult.recordset.map((recipient) => createAndSendNotification(pool, recipient, {
      title: `Acta ${acta.consecutivo} eliminada`,
      message: deletionMessage,
      type: 'warning',
      actaId: null,
    }));
    const otherRecipientEmails = [...otherEmailRecipients.values()].map((recipient) => sendNotificationEmail({
      to: recipient.email,
      recipientName: recipient.nombre,
      title: `Acta ${acta.consecutivo} eliminada`,
      message: deletionMessage,
      actaId: acta.consecutivo,
    }));
    const notificationResults = await Promise.allSettled([...globalAdminNotifications, ...otherRecipientEmails]);
    notificationResults.forEach((result) => {
      if (result.status === 'rejected') console.error('No se pudo notificar la eliminación de un acta:', result.reason?.message || result.reason);
    });

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
    const pool = getPool();
    const actaResult = await pool.request().input('id', id)
      .query('SELECT id, consecutivo, solicitanteId, status, area, tipoMaterial FROM actas WHERE id = @id');
    const acta = actaResult.recordset[0];
    if (!acta) return res.status(404).json({ error: 'Acta no encontrada' });
    if (['pendiente_aprobacion_material', 'pendiente_aprobacion_area', 'pendiente_costos', 'pendiente_hse', 'aprobada'].includes(acta.status)) {
      return res.status(409).json({ error: 'El acta ya se encuentra en el flujo de aprobación' });
    }

    const materialTypesResult = await pool.request()
      .input('actaId', id)
      .query('SELECT tipoMaterial FROM acta_materiales WHERE actaId = @actaId');
    const materialApprovalSteps = getMaterialApprovalSteps([
      acta.tipoMaterial,
      ...materialTypesResult.recordset.map((material) => material.tipoMaterial),
    ]);
    const initialStatus = 'pendiente_aprobacion_area';

    await pool.request()
      .input('id', id)
      .input('requiereCostos', false)
      .input('status', initialStatus)
      .query('UPDATE actas SET status = @status, requiereCostos = @requiereCostos, updatedAt = GETDATE() WHERE id = @id');

    await pool.request()
      .input('actaId', id)
      .query("DELETE FROM acta_aprobaciones WHERE actaId = @actaId AND paso LIKE 'material_%'");

    for (const paso of materialApprovalSteps) {
      await pool.request()
        .input('id', `ap${Date.now()}-${Math.random().toString(36).slice(2, 8)}`)
        .input('actaId', id)
        .input('paso', paso)
        .query("INSERT INTO acta_aprobaciones (id, actaId, paso, status) VALUES (@id, @actaId, @paso, 'pendiente')");
    }

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
      type: 'info', actaId: id, actaReference: acta.consecutivo,
    });

    const requester = await getActiveUser(pool, acta.solicitanteId);
    if (requester) {
      await createAndSendNotification(pool, requester, {
        title: 'Acta enviada a aprobación',
        message: `El acta ${acta.consecutivo} fue enviada correctamente y está pendiente de revisión del aprobador de área.`,
        type: 'success', actaId: id, actaReference: acta.consecutivo,
      });
    }
    res.json({ message: 'Acta enviada a aprobación', status: initialStatus });
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
      .query('SELECT consecutivo, solicitanteId, status, area, tipoMaterial FROM actas WHERE id = @id');
    const acta = actaResult.recordset[0];
    if (!acta) return res.status(404).json({ error: 'Acta no encontrada' });

    let requiereCostos = false;
    if (paso === 'area') {
      const materialTypes = await pool.request()
        .input('actaId', id)
        .query('SELECT tipoMaterial FROM acta_materiales WHERE actaId = @actaId');
      requiereCostos = requiresCostApprovalByMaterialType([
        acta.tipoMaterial,
        ...materialTypes.recordset.map((material) => material.tipoMaterial),
      ]);
    }

    const expectedStep = await getExpectedApprovalStep(pool, id, acta.status);
    if (!expectedStep || paso !== expectedStep) {
      return res.status(409).json({ error: 'El acta aún no ha llegado a este paso de aprobación' });
    }
    if (req.user.rol !== getRequiredRoleForApproval(paso)) {
      return res.status(403).json({ error: 'Este usuario no es el aprobador asignado para este paso' });
    }
    if (paso === 'area' && !(await userBelongsToArea(pool, req.user.id, acta.area))) {
      return res.status(403).json({ error: 'Este usuario no está asignado al área del acta' });
    }

    await pool.request()
      .input('actaId', id)
      .input('paso', paso)
      .input('aprobador', aprobador)
      .input('comentario', comentario)
      .query(`
        UPDATE acta_aprobaciones SET status = 'aprobado', aprobador = @aprobador, comentario = @comentario
        WHERE actaId = @actaId AND paso = @paso
      `);

    let nextStatus;
    const nextMaterialStep = await getNextPendingMaterialApproval(pool, id);
    if (paso === 'area') {
      nextStatus = requiereCostos
        ? 'pendiente_costos'
        : nextMaterialStep ? 'pendiente_aprobacion_material' : 'pendiente_hse';
    } else if (paso === 'costos') {
      nextStatus = nextMaterialStep ? 'pendiente_aprobacion_material' : 'pendiente_hse';
    } else if (paso.startsWith('material_')) {
      nextStatus = nextMaterialStep ? 'pendiente_aprobacion_material' : 'pendiente_hse';
    } else {
      nextStatus = 'aprobada';
    }

    if (paso === 'area') {
      await pool.request()
        .input('id', id)
        .input('status', nextStatus)
        .input('requiereCostos', requiereCostos)
        .query('UPDATE actas SET status = @status, requiereCostos = @requiereCostos, updatedAt = GETDATE() WHERE id = @id');

      const costApproval = await pool.request()
        .input('actaId', id)
        .query("SELECT id FROM acta_aprobaciones WHERE actaId = @actaId AND paso = 'costos'");
      if (costApproval.recordset.length) {
        await pool.request()
          .input('actaId', id)
          .input('status', requiereCostos ? 'pendiente' : 'no_aplica')
          .query("UPDATE acta_aprobaciones SET status = @status, aprobador = NULL, comentario = NULL, motivo = NULL, ajustes = NULL WHERE actaId = @actaId AND paso = 'costos'");
      } else {
        await pool.request()
          .input('id', `ap${Date.now()}-${Math.random().toString(36).slice(2, 8)}`)
          .input('actaId', id)
          .input('status', requiereCostos ? 'pendiente' : 'no_aplica')
          .query("INSERT INTO acta_aprobaciones (id, actaId, paso, status) VALUES (@id, @actaId, 'costos', @status)");
      }
    } else {
      await pool.request()
        .input('id', id)
        .input('status', nextStatus)
        .query('UPDATE actas SET status = @status, updatedAt = GETDATE() WHERE id = @id');
    }

    const activeMaterialStep = nextStatus === 'pendiente_aprobacion_material'
      ? await getNextPendingMaterialApproval(pool, id)
      : null;
    const nextRole = activeMaterialStep
      ? MATERIAL_APPROVAL_ROLES[activeMaterialStep]
      : nextStatus === 'pendiente_costos' ? 'costos' : nextStatus === 'pendiente_hse' ? 'hse' : null;
    const nextRoleLabel = activeMaterialStep
      ? MATERIAL_APPROVAL_LABELS[activeMaterialStep]
      : nextRole === 'costos' ? 'Costos' : 'HSE & S';

    // El correo al siguiente aprobador sale después de persistir el cambio de estado.
    let emailNotifications = [];
    if (nextStatus === 'pendiente_aprobacion_area') {
      emailNotifications = await notifyAreaApprovers(pool, acta.area, {
        title: 'Nueva acta para aprobación del área',
        message: `El acta ${acta.consecutivo} está pendiente de revisión y aprobación por parte del aprobador del área ${acta.area}. Ingresa al sistema para revisarla.`,
        emailStage: 'Revisión del aprobador de área',
        type: 'info', actaId: id, actaReference: acta.consecutivo,
      }) || [];
    } else if (nextRole) {
      emailNotifications = await notifyRole(pool, nextRole, {
        title: `Acta pendiente de aprobación por ${nextRoleLabel}`,
        message: `El acta ${acta.consecutivo} está pendiente de revisión por ${nextRoleLabel}. Ingresa al sistema para continuar el flujo de aprobación.`,
        emailStage: `Revisión de ${nextRoleLabel}`,
        type: 'info',
        actaId: id,
        actaReference: acta.consecutivo,
      });
    }

    let areaApproverNotifications = [];
    if (paso === 'hse') {
      const areaApprover = await getAreaApproverIdentifier(pool, id);
      areaApproverNotifications = await notifyAreaApprovers(pool, acta.area, {
        title: 'Acta aprobada por HSE',
        message: `HSE aprobó el acta ${acta.consecutivo}. El proceso de aprobación ha finalizado.`,
        emailStage: 'Acta aprobada por HSE',
        type: 'success',
        actaId: id,
        actaReference: acta.consecutivo,
      }, areaApprover);
    }

    const requester = await getActiveUser(pool, acta.solicitanteId);
    if (requester) {
      const approvalStage = MATERIAL_APPROVAL_LABELS[paso]
        || (paso === 'area' ? 'el área' : paso === 'costos' ? 'Costos' : 'HSE');
      const statusMessage = nextRole
        ? `fue aprobada por ${approvalStage} y ahora está pendiente de revisión por ${nextRoleLabel}.`
        : 'fue aprobada completamente.';
      await createAndSendNotification(pool, requester, {
        title: 'Actualización de tu acta',
        message: `El acta ${acta.consecutivo} ${statusMessage}`,
        type: nextRole ? 'info' : 'success',
        actaId: id,
        actaReference: acta.consecutivo,
      });
    }

    res.json({
      message: 'Acta aprobada',
      emailNotifications,
      areaApproverNotifications,
      status: nextStatus,
      nextApproval: nextRoleLabel || (nextStatus === 'pendiente_aprobacion_area' ? 'Aprobador del área' : null),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Reenvía el aviso de aprobación HSE para un acta que ya está esperando ese paso.
export async function resendHseEmail(req, res) {
  try {
    const { id } = req.params;
    const pool = getPool();
    const actaResult = await pool.request()
      .input('id', id)
      .query('SELECT id, consecutivo, area, status FROM actas WHERE id = @id');
    const acta = actaResult.recordset[0];
    if (!acta) return res.status(404).json({ error: 'Acta no encontrada' });
    if (acta.status !== 'pendiente_hse') {
      return res.status(409).json({ error: 'Solo se puede reenviar el correo cuando el acta está pendiente de HSE' });
    }

    const recipientResult = await pool.request().query(`SELECT id, nombre, email FROM users
      WHERE LOWER(LTRIM(RTRIM(rol))) IN ('hse', 'hse & s', 'hse_s')
        AND LOWER(LTRIM(RTRIM(status))) = 'activo'`);
    const recipients = recipientResult.recordset.filter((recipient) => recipient.email?.trim());
    if (!recipients.length) {
      return res.status(404).json({ error: 'No hay usuarios HSE activos con correo registrado' });
    }

    const deliveries = await Promise.all(recipients.map(async (recipient) => {
      const email = await sendNotificationEmail({
        to: recipient.email,
        recipientName: recipient.nombre,
        title: 'Acta pendiente de revisión HSE',
        message: `El acta ${acta.consecutivo} del área ${acta.area} está pendiente de aprobación por HSE. Ingresa al sistema para revisarla.`,
        actaId: acta.consecutivo,
        stage: 'Revisión de HSE & S',
      });
      return { userId: recipient.id, sent: email.sent, reason: email.reason };
    }));

    res.json({ emailNotifications: deliveries });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function resendAreaApproverEmail(req, res) {
  try {
    const { id } = req.params;
    const pool = getPool();
    const actaResult = await pool.request()
      .input('id', id)
      .query('SELECT id, consecutivo, area, status FROM actas WHERE id = @id');
    const acta = actaResult.recordset[0];
    if (!acta) return res.status(404).json({ error: 'Acta no encontrada' });

    const outcomeStatus = {
      aprobada: 'aprobado',
      rechazada: 'rechazado',
      devuelta_ajustes: 'devuelto',
    }[acta.status];
    if (!outcomeStatus) {
      return res.status(409).json({ error: 'Solo se puede reenviar el aviso de un acta aprobada, rechazada o devuelta' });
    }

    if (req.user.rol === 'aprobador_area' && !(await userBelongsToArea(pool, req.user.id, acta.area))) {
      return res.status(403).json({ error: 'Este usuario no está asignado al área del acta' });
    }

    const approvalsResult = await pool.request()
      .input('actaId', id)
      .query('SELECT paso, status, aprobador FROM acta_aprobaciones WHERE actaId = @actaId');
    const approvals = approvalsResult.recordset;
    const areaApproval = approvals.find((approval) => approval.paso === 'area');
    const finalApproval = acta.status === 'aprobada'
      ? approvals.find((approval) => approval.paso === 'hse' && approval.status === outcomeStatus)
      : approvals.find((approval) => approval.paso === 'hse' && approval.status === outcomeStatus)
        || approvals.find((approval) => approval.paso === 'area' && approval.status === outcomeStatus);
    if (!finalApproval) {
      return res.status(409).json({ error: 'No se encontró la aprobación que corresponde al estado actual del acta' });
    }

    const outcomeLabel = acta.status === 'aprobada' ? 'aprobada' : acta.status === 'rechazada' ? 'rechazada' : 'devuelta para ajustes';
    const decisionBy = finalApproval.paso === 'hse' ? 'HSE' : 'el aprobador del área';
    const deliveries = await notifyAreaApprovers(pool, acta.area, {
      title: `Acta ${outcomeLabel} por ${decisionBy}`,
      message: `El acta ${acta.consecutivo} fue ${outcomeLabel} por ${decisionBy}. Ingresa al sistema para consultar el resultado.`,
      emailStage: `Reenvío de aviso al aprobador asignado: acta ${outcomeLabel}`,
      type: acta.status === 'aprobada' ? 'success' : acta.status === 'rechazada' ? 'error' : 'warning',
      actaId: id,
      actaReference: acta.consecutivo,
    }, areaApproval?.aprobador);

    if (!deliveries?.length) {
      return res.status(404).json({ error: `No se encontró un aprobador activo para el área ${acta.area}` });
    }
    res.json({ emailNotifications: deliveries });
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
    const expectedStep = await getExpectedApprovalStep(pool, id, acta.status);
    if (expectedStep !== paso) {
      return res.status(409).json({ error: 'El acta aún no ha llegado a este paso de aprobación' });
    }
    if (req.user.rol !== getRequiredRoleForApproval(paso)) {
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

    let areaApproverNotifications = [];
    if (paso === 'hse') {
      const areaApprover = await getAreaApproverIdentifier(pool, id);
      areaApproverNotifications = await notifyAreaApprovers(pool, acta.area, {
        title: 'Acta rechazada por HSE',
        message: `HSE rechazó el acta ${acta.consecutivo}. Motivo: ${motivo}`,
        emailStage: 'Acta rechazada por HSE',
        type: 'error',
        actaId: id,
        actaReference: acta.consecutivo,
      }, areaApprover);
    }

    const requester = await getActiveUser(pool, acta.solicitanteId);
    if (requester) {
      await createAndSendNotification(pool, requester, {
        title: 'Acta rechazada',
        message: `El acta ${acta.consecutivo} fue rechazada por ${aprobador}. Motivo: ${motivo}`,
        type: 'error', actaId: id, actaReference: acta.consecutivo,
      });
    }

    res.json({ message: 'Acta rechazada', areaApproverNotifications });
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
    const expectedStep = await getExpectedApprovalStep(pool, id, acta.status);
    if (expectedStep !== paso) {
      return res.status(409).json({ error: 'El acta aún no ha llegado a este paso de aprobación' });
    }
    if (req.user.rol !== getRequiredRoleForApproval(paso)) {
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
    let areaApproverNotifications = [];
    if (paso === 'hse') {
      const areaApprover = await getAreaApproverIdentifier(pool, id);
      areaApproverNotifications = await notifyAreaApprovers(pool, acta.area, {
        title: 'Acta devuelta por HSE',
        message: `HSE devolvió el acta ${acta.consecutivo} para ajustes.${details ? ` Detalle: ${details}` : ''}`,
        emailStage: 'Acta devuelta por HSE',
        type: 'warning',
        actaId: id,
        actaReference: acta.consecutivo,
      }, areaApprover);
    }

    const requester = await getActiveUser(pool, acta.solicitanteId);
    if (requester) {
      await createAndSendNotification(pool, requester, {
        title: 'Acta devuelta para ajustes',
        message: `Su acta ${acta.consecutivo} requiere correcciones.${details ? ` Detalle: ${details}` : ''}`,
        type: 'warning', actaId: id, actaReference: acta.consecutivo,
      });
    }
    res.json({ message: 'Acta devuelta para ajustes', areaApproverNotifications });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
