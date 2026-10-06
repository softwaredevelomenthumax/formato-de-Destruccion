import express from 'express';
import { getPool } from '../database/connection.js';
import jwt from 'jsonwebtoken';
import bcryptjs from 'bcryptjs';
import { sendWelcomeEmail } from '../services/emailService.js';

const router = express.Router();

function isLocalDevelopmentLoginEnabled(req) {
  const remoteAddress = req.socket.remoteAddress;
  const isLoopback = ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(remoteAddress);
  return process.env.NODE_ENV !== 'production'
    && process.env.ENABLE_DEV_LOGIN === 'true'
    && isLoopback;
}

router.get('/users', async (req, res) => {
  try {
    const result = await getPool().request()
      .query("SELECT username FROM users WHERE LOWER(LTRIM(RTRIM(status))) = 'activo' ORDER BY username");
    res.json({
      usernames: result.recordset.map((user) => user.username),
      passwordlessLoginEnabled: isLocalDevelopmentLoginEnabled(req),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/dev-login', async (req, res) => {
  if (!isLocalDevelopmentLoginEnabled(req)) {
    return res.status(404).json({ error: 'El acceso de prueba no está habilitado' });
  }

  try {
    const username = String(req.body.username || '').trim();
    const result = await getPool().request()
      .input('username', username)
      .query("SELECT id, username, nombre, email, area, rol, status FROM users WHERE username = @username AND LOWER(LTRIM(RTRIM(status))) = 'activo'");
    const user = result.recordset[0];
    if (!user) return res.status(401).json({ error: 'Seleccione una cuenta activa' });

    const normalizedRole = String(user.rol || '').trim().toLowerCase().replace(/[ -]+/g, '_');
    const role = ['administrador_global', 'global_admin'].includes(normalizedRole)
      ? 'admin_global'
      : normalizedRole === 'admin' ? 'administrador' : normalizedRole;
    const token = jwt.sign(
      { id: user.id, username: user.username, rol: role, area: user.area },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: process.env.JWT_EXPIRY || '7d' }
    );

    res.json({
      token,
      user: { ...user, rol: role },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Renueva el rol y los datos de sesión desde la base de datos. El token previo
// puede tener un rol antiguo si un administrador acaba de actualizar el usuario.
router.post('/refresh', async (req, res) => {
  try {
    const authorization = req.headers.authorization || '';
    const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Autenticación requerida' });

    const payload = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    const pool = getPool();
    const result = await pool.request()
      .input('id', payload.id)
      .query("SELECT id, username, nombre, email, area, rol, status FROM users WHERE id = @id");
    const user = result.recordset[0];
    if (!user || String(user.status).toLowerCase() !== 'activo') {
      return res.status(401).json({ error: 'La cuenta no está activa' });
    }

    const normalizedRole = String(user.rol || '').trim().toLowerCase().replace(/[ -]+/g, '_');
    const role = ['administrador_global', 'global_admin'].includes(normalizedRole)
      ? 'admin_global'
      : normalizedRole === 'admin' ? 'administrador' : normalizedRole;
    const refreshedToken = jwt.sign(
      { id: user.id, username: user.username, rol: role, area: user.area },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: process.env.JWT_EXPIRY || '7d' }
    );

    res.json({
      token: refreshedToken,
      user: { ...user, rol: role },
    });
  } catch (error) {
    const status = error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError' ? 401 : 500;
    res.status(status).json({ error: error.message });
  }
});

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

    if (String(user.status).trim().toLowerCase() !== 'activo') {
      return res.status(403).json({ error: 'La cuenta está inactiva. Contacte al administrador' });
    }

    const role = ['administrador_global', 'global_admin'].includes(String(user.rol).trim().toLowerCase())
      ? 'admin_global'
      : user.rol;
    const token = jwt.sign(
      { id: user.id, username: user.username, rol: role, area: user.area },
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
        rol: role,
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
