import nodemailer from 'nodemailer';

let transporter;
let configurationWarningShown = false;

function isEmailConfigured() {
  const hasUser = Boolean(process.env.SMTP_USER);
  const hasPassword = Boolean(process.env.SMTP_PASS);
  const hasSender = Boolean(process.env.MAIL_FROM || process.env.SMTP_USER);
  // Los relays corporativos de confianza suelen permitir el envío sin AUTH.
  // Si se configura autenticación, ambos campos deben estar presentes.
  return Boolean(process.env.SMTP_HOST && hasSender && hasUser === hasPassword);
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

/**
 * Envía el aviso asociado a una notificación del sistema. Nunca bloquea el
 * flujo de aprobación: si el correo falla, la notificación interna permanece.
 */
export async function sendNotificationEmail({ to, recipientName, title, message, actaId }) {
  if (!to) return { sent: false, reason: 'no_email' };

  if (!isEmailConfigured()) {
    if (!configurationWarningShown) {
      console.warn('Correos no configurados: defina SMTP_HOST y MAIL_FROM. SMTP_USER y SMTP_PASS son opcionales para un relay corporativo.');
      configurationWarningShown = true;
    }
    return { sent: false, reason: 'not_configured' };
  }

  const safeTitle = escapeHtml(title);
  const safeMessage = escapeHtml(message).replace(/\n/g, '<br>');
  const actaReference = actaId ? `<p style="margin:16px 0 0;color:#475569"><strong>Referencia:</strong> ${escapeHtml(actaId)}</p>` : '';

  try {
    const activeTransporter = getTransporter();
    const info = await activeTransporter.sendMail({
      from: process.env.MAIL_FROM || process.env.SMTP_USER,
      to,
      subject: `[Gestión de Actas] ${title}`,
      text: `${title}\n\n${message}${actaId ? `\n\nReferencia: ${actaId}` : ''}`,
      html: `
        <div style="font-family:Arial,sans-serif;color:#1e293b;line-height:1.5;max-width:620px">
          <h2 style="color:#1d4ed8">${safeTitle}</h2>
          <p>Hola${recipientName ? ` ${escapeHtml(recipientName)}` : ''},</p>
          <p>${safeMessage}</p>
          ${actaReference}
          <p style="margin-top:24px;color:#64748b;font-size:13px">Este es un mensaje automático del sistema de Gestión de Actas.</p>
        </div>`,
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
