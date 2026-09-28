import nodemailer from 'nodemailer';

let transporter;
let configurationWarningShown = false;

function isEmailConfigured() {
  const hasUser = Boolean(process.env.SMTP_USER);
  const hasPassword = Boolean(process.env.SMTP_PASS);
  // Los relays corporativos de confianza suelen permitir el envío sin AUTH.
  // Si se configura autenticación, ambos campos deben estar presentes.
  return Boolean(process.env.SMTP_HOST && hasUser === hasPassword);
}

function getTransporter() {
  if (!transporter) {
    const hasAuthentication = Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      connectionTimeout: 10000,
      socketTimeout: 15000,
      greetingTimeout: 10000,
      name: 'gestion-actas.local',
      ...(hasAuthentication ? {
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      } : {}),
    });
  }
  return transporter;
}

function escapeHtml(value = '') {
  return String(value).replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
  }[character]));
}

function repairMojibake(value = '') {
  let result = String(value ?? '');
  for (let attempt = 0; attempt < 2 && /[ÃÂâ][\u0080-\uFFFF]/.test(result); attempt += 1) {
    const decoded = Buffer.from(result, 'latin1').toString('utf8');
    if (decoded.includes('\uFFFD')) break;
    result = decoded;
  }
  return result;
}

/**
 * Envía el aviso asociado a una notificación del sistema. Nunca bloquea el
 * flujo de aprobación: si el correo falla, la notificación interna permanece.
 */
export async function sendNotificationEmail({ to, recipientName, title, message, actaId, stage }) {
  if (!to) return { sent: false, reason: 'no_email' };

  if (!isEmailConfigured()) {
    if (!configurationWarningShown) {
      console.warn('Correos no configurados: defina SMTP_HOST. SMTP_USER y SMTP_PASS son opcionales para un relay corporativo.');
      configurationWarningShown = true;
    }
    return { sent: false, reason: 'not_configured' };
  }

  const sender = process.env.MAIL_FROM || process.env.FROM_EMAIL || process.env.SMTP_USER;
  if (!sender) {
    console.warn('Correos no enviados: configure MAIL_FROM o FROM_EMAIL en backend/.env.');
    return { sent: false, reason: 'no_sender' };
  }

  const cleanTitle = repairMojibake(title);
  const cleanMessage = repairMojibake(message);
  const cleanRecipientName = repairMojibake(recipientName);
  const cleanActaId = repairMojibake(actaId);
  const cleanStage = repairMojibake(stage || 'Notificación del sistema');
  const safeTitle = escapeHtml(cleanTitle);
  const safeMessage = escapeHtml(cleanMessage).replace(/\r?\n/g, '<br>');
  const safeStage = escapeHtml(cleanStage);
  const safeRecipientName = escapeHtml(cleanRecipientName);
  const actaReference = cleanActaId ? `<p style="margin:0;color:#334155"><strong>Consecutivo del acta:</strong> ${escapeHtml(cleanActaId)}</p>` : '';
  const appUrl = new URL('/login', process.env.APP_BASE_URL || 'http://localhost:8443').toString();
  const appName = 'Sistema ADD - Gestión de Actas de Destrucción';
  const safeAppUrl = escapeHtml(appUrl);
  const intro = cleanStage.toLocaleLowerCase('es-CO').includes('hse')
    ? 'El aprobador del área ya revisó esta acta. Ahora está disponible para la revisión del equipo HSE & S.'
    : cleanStage.toLocaleLowerCase('es-CO').includes('área')
      ? 'Hay una nueva acta pendiente de revisión y aprobación por parte del aprobador del área.'
      : 'Tienes una actualización sobre el flujo de aprobación de un acta.';
  const textBody = [
    cleanTitle,
    `Hola${cleanRecipientName ? ` ${cleanRecipientName}` : ''},`,
    `Etapa: ${cleanStage}`,
    intro,
    cleanMessage,
    cleanActaId ? `Consecutivo del acta: ${cleanActaId}` : '',
    `Ingresa a ${appName}: ${appUrl}`,
    'Mensaje automático del Sistema ADD - Gestión de Actas de Destrucción.',
  ].filter(Boolean).join('\n\n');

  try {
    const activeTransporter = getTransporter();
    const info = await activeTransporter.sendMail({
      from: sender,
      to,
      subject: `[Gestión de Actas] ${cleanTitle}`,
      text: textBody,
      encoding: 'base64',
      headers: { 'Content-Language': 'es-CO' },
      html: `
        <!doctype html>
        <html lang="es">
        <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
        <body style="margin:0;padding:24px;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;color:#1e293b;line-height:1.55">
          <span style="display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden;mso-hide:all">${safeStage}: ${safeTitle}${cleanActaId ? ` · Acta ${escapeHtml(cleanActaId)}` : ''}</span>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden">
            <tr><td style="padding:20px 28px;background:#0f172a;color:#ffffff;border-bottom:4px solid #2dd4bf">
              <table role="presentation" cellspacing="0" cellpadding="0"><tr>
                <td style="padding-right:12px"><div style="width:42px;height:42px;border-radius:10px;background:#2dd4bf;color:#0f172a;text-align:center;line-height:42px;font-size:14px;font-weight:bold">ADD</div></td>
                <td><div style="font-size:18px;font-weight:bold">Sistema ADD</div><div style="margin-top:4px;color:#cbd5e1;font-size:13px">Gestión de Actas de Destrucción</div></td>
              </tr></table>
            </td></tr>
            <tr><td style="padding:28px">
              <div style="display:inline-block;margin-bottom:14px;padding:6px 11px;border-radius:999px;background:#ecfeff;color:#0e7490;font-size:11px;font-weight:bold;letter-spacing:.04em;text-transform:uppercase">${safeStage}</div>
              <h1 style="margin:0 0 18px;font-size:23px;line-height:1.3;color:#0f172a">${safeTitle}</h1>
              <p style="margin:0 0 16px">Hola${safeRecipientName ? ` ${safeRecipientName}` : ''},</p>
              <p style="margin:0 0 16px;color:#475569">${escapeHtml(intro)}</p>
              <div style="margin:0 0 18px;padding:16px 18px;border:1px solid #dbeafe;border-left:4px solid #2563eb;border-radius:8px;background:#f8fafc;color:#334155">${safeMessage}</div>
              ${cleanActaId ? `<div style="margin:0 0 24px;padding:14px 16px;border:1px solid #e2e8f0;border-radius:8px;background:#ffffff">${actaReference}</div>` : ''}
              <p style="margin:0 0 22px"><a href="${safeAppUrl}" style="display:inline-block;padding:13px 20px;border:1px solid #1d4ed8;border-radius:7px;background:#1d4ed8;color:#ffffff;text-decoration:none;font-size:14px;font-weight:bold">Revisar acta en el sistema&nbsp; →</a></p>
              <p style="margin:0;color:#64748b;font-size:13px">Si el botón no abre el sistema, usa este enlace:<br><a href="${safeAppUrl}" style="display:inline-block;margin-top:5px;color:#1d4ed8;word-break:break-all">${safeAppUrl}</a></p>
            </td></tr>
            <tr><td style="padding:18px 28px;border-top:1px solid #e2e8f0;background:#f8fafc;color:#64748b;font-size:12px">Este correo fue generado automáticamente por el <strong style="color:#475569">Sistema ADD</strong>.<br>Por favor, no respondas a este mensaje.</td></tr>
          </table>
        </body>
        </html>`,
    });
    return { sent: true, messageId: info.messageId };
  } catch (error) {
    console.error(`No se pudo enviar el correo a ${to}:`, error.message);
    const isTimeout = error.code === 'ETIMEDOUT'
      || error.code === 'ESOCKET'
      || /tiempo de espera|timeout/i.test(error.message || '');
    return { sent: false, reason: isTimeout ? 'smtp_timeout' : 'send_failed' };
  }
}

export function sendWelcomeEmail({ to, recipientName }) {
  return sendNotificationEmail({
    to,
    recipientName,
    title: 'Registro recibido',
    message: 'Hemos recibido tu registro correctamente. Tu solicitud está pendiente de autorización por parte de la administración del sistema. Te informaremos cuando sea procesada.',
  });
}
