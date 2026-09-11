import express from 'express';
import { getPool } from '../database/connection.js';
import jwt from 'jsonwebtoken';
import bcryptjs from 'bcryptjs';
import { sendWelcomeEmail } from '../services/emailService.js';

const router = express.Router();

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const pool = getPool();

    if (!pool) {
      return res.status(500).json({ error: 'No hay conexión a la base de datos' });
    }

    const result = await pool.request()
      .input('username', username)
      .query('SELECT * FROM users WHERE username = @username');

    if (result.recordset.length === 0) {
      return res.status(401).json({ error: 'Usuario o contraseña inválidos' });
    }

    const user = result.recordset[0];
    const passwordMatch = await bcryptjs.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Usuario o contraseña inválidos' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, rol: user.rol },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: process.env.JWT_EXPIRY || '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        nombre: user.nombre,
        email: user.email,
        area: user.area,
        rol: user.rol,
        status: user.status,
      },
    });
  } catch (error) {
    console.error('❌ Error en login:', error);
    res.status(500).json({ error: error.message });
  }
});

// Register
router.post('/register', async (req, res) => {
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

    res.status(201).json({ message: 'Solicitud registrada. Pendiente de aprobación.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
