import jwt from 'jsonwebtoken';
import { getPool } from '../database/connection.js';

function normalizeRole(role) {
  const normalized = String(role || '').trim().toLowerCase().replace(/[ -]+/g, '_');
  if (['administrador_global', 'global_admin'].includes(normalized)) return 'admin_global';
  if (normalized === 'admin') return 'administrador';
  return normalized;
}

export function requireRole(...allowedRoles) {
  const normalizedAllowedRoles = allowedRoles.map(normalizeRole);
  return async (req, res, next) => {
    const authorization = req.headers.authorization || '';
    const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : null;

    if (!token) {
      return res.status(401).json({ error: 'Autenticación requerida' });
    }

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    } catch {
      return res.status(401).json({ error: 'Token inválido o expirado' });
    }

    try {
      const result = await getPool().request()
        .input('id', payload.id)
        .query('SELECT rol, status FROM users WHERE id = @id');
      const user = result.recordset[0];
      if (!user || String(user.status).trim().toLowerCase() !== 'activo') {
        return res.status(401).json({ error: 'La cuenta está inactiva o ya no existe' });
      }

      const role = normalizeRole(user.rol);
      if (!normalizedAllowedRoles.includes(role)) {
        return res.status(403).json({ error: 'No tiene permisos para esta operación' });
      }

      req.user = { ...payload, rol: role };
      next();
    } catch {
      return res.status(503).json({ error: 'No se pudo validar el estado de la cuenta' });
    }
  };
}