import { getPool } from '../database/connection.js';

// Crear notificación
export async function createNotification(req, res) {
  try {
    const { userId, title, message, type, titulo, mensaje, tipo, actaId } = req.body;
    const notificationTitle = title || titulo;
    const notificationMessage = message || mensaje;
    const notificationType = type || tipo || 'info';
    const pool = getPool();

    const id = `n${Date.now()}`;

    await pool.request()
      .input('id', id)
      .input('userId', userId)
      .input('titulo', notificationTitle)
      .input('mensaje', notificationMessage)
      .input('tipo', notificationType)
      .input('actaId', actaId)
      .query(`
        INSERT INTO notifications (id, userId, titulo, mensaje, tipo, actaId)
        VALUES (@id, @userId, @titulo, @mensaje, @tipo, @actaId)
      `);

    res.status(201).json({ id, userId, title: notificationTitle, message: notificationMessage, type: notificationType, actaId, read: false });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Obtener notificaciones de usuario
export async function getUserNotifications(req, res) {
  try {
    const { userId } = req.params;
    const pool = getPool();

    const result = await pool.request()
      .input('userId', userId)
      .query(`
        SELECT id, userId, titulo, mensaje, tipo, actaId,
          CAST([read] AS int) AS [read], createdAt
        FROM notifications
        WHERE userId = @userId
        ORDER BY createdAt DESC
      `);

    res.json(result.recordset);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Marcar notificación como leída
export async function markNotificationRead(req, res) {
  try {
    const { id } = req.params;
    const pool = getPool();

    await pool.request()
      .input('id', id)
      .query('UPDATE notifications SET [read] = 1 WHERE id = @id');

    res.json({ message: 'Notificación marcada como leída' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function deleteNotification(req, res) {
  try {
    const { id } = req.params;
    const result = await getPool().request().input('id', id).query('DELETE FROM notifications WHERE id = @id');
    if (!result.rowsAffected?.[0]) return res.status(404).json({ error: 'Notificación no encontrada' });
    res.json({ message: 'Notificación eliminada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Marcar todas como leídas
export async function markAllNotificationsRead(req, res) {
  try {
    const { userId } = req.params;
    const pool = getPool();

    await pool.request()
      .input('userId', userId)
      .query('UPDATE notifications SET [read] = 1 WHERE userId = @userId');

    res.json({ message: 'Todas las notificaciones marcadas como leídas' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
