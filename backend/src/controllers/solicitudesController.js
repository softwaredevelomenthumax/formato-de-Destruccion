import { getPool } from '../database/connection.js';
import bcryptjs from 'bcryptjs';
import { sendWelcomeEmail } from '../services/emailService.js';

// Crear solicitud
export async function createSolicitud(req, res) {
  try {
    const { username, password, nombre, email, area, rolSolicitado } = req.body;
    const pool = getPool();

    const id = `s${Date.now()}`;
    const hashedPassword = await bcryptjs.hash(password, 10);

    await pool.request()
      .input('id', id)
      .input('username', username)
      .input('password', hashedPassword)
      .input('nombre', nombre)
      .input('email', email)
      .input('area', area)
      .input('rolSolicitado', rolSolicitado)
      .query(`
        INSERT INTO solicitudes (id, username, password, nombre, email, area, rolSolicitado)
        VALUES (@id, @username, @password, @nombre, @email, @area, @rolSolicitado)
      `);

    if (email) {
      void sendWelcomeEmail({ to: email, recipientName: nombre });
    }

    res.status(201).json({ id, username, nombre, email, area, rolSolicitado, status: 'pendiente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Obtener solicitudes
export async function getSolicitudes(req, res) {
  try {
    const pool = getPool();
    const result = await pool.request().query('SELECT id, username, nombre, email, area, rolSolicitado, status, createdAt FROM solicitudes');
    res.json(result.recordset);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Aprobar solicitud
export async function approveSolicitud(req, res) {
  try {
    const { id } = req.params;
    const pool = getPool();

    // Obtener datos de la solicitud
    const solicitud = await pool.request()
      .input('id', id)
      .query('SELECT * FROM solicitudes WHERE id = @id');

    if (solicitud.recordset.length === 0) {
      return res.status(404).json({ error: 'Solicitud no encontrada' });
    }

    const sol = solicitud.recordset[0];
    const userId = `u${Date.now()}`;

    // Crear usuario
    await pool.request()
      .input('id', userId)
      .input('username', sol.username)
      .input('password', sol.password)
      .input('nombre', sol.nombre)
      .input('email', sol.email)
      .input('area', sol.area)
      .input('rol', sol.rolSolicitado)
      .query(`
        INSERT INTO users (id, username, password, nombre, email, area, rol)
        VALUES (@id, @username, @password, @nombre, @email, @area, @rol)
      `);

    // Actualizar solicitud
    await pool.request()
      .input('id', id)
      .query('UPDATE solicitudes SET status = \'aprobado\' WHERE id = @id');

    res.json({ message: 'Solicitud aprobada', userId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Rechazar solicitud
export async function rejectSolicitud(req, res) {
  try {
    const { id } = req.params;
    const pool = getPool();

    await pool.request()
      .input('id', id)
      .query('UPDATE solicitudes SET status = \'rechazado\' WHERE id = @id');

    res.json({ message: 'Solicitud rechazada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
