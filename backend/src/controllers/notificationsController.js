import { getPool } from '../database/connection.js';

// Crear notificación
export async function createNotification(req, res) {
  try {
    const { userId, titulo, mensaje, tipo } = req.body;
    const pool = getPool();

    const id = `n${Date.now()}`;

    await pool.request()
      .input('id', id)
      .input('userId', userId)
      .input('titulo', titulo)
      .input('mensaje', mensaje)
      .input('tipo', tipo)
      .query(`
        INSERT INTO notifications (id, userId, titulo, mensaje, tipo)
        VALUES (@id, @userId, @titulo, @mensaje, @tipo)
      `);

    res.status(201).json({ id, userId, titulo, mensaje, tipo, read: false });
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
      .query('SELECT * FROM notifications WHERE userId = @userId ORDER BY createdAt DESC');

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
      .query('UPDATE notifications SET read = 1 WHERE id = @id');

    res.json({ message: 'Notificación marcada como leída' });
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
      .query('UPDATE notifications SET read = 1 WHERE userId = @userId');

    res.json({ message: 'Todas las notificaciones marcadas como leídas' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
