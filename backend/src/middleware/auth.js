import jwt from 'jsonwebtoken';

function normalizeRole(role) {
  const normalized = String(role || '').trim().toLowerCase().replace(/[ -]+/g, '_');
  if (['administrador_global', 'global_admin'].includes(normalized)) return 'admin_global';
  if (normalized === 'admin') return 'administrador';
  return normalized;
}

export function requireRole(...allowedRoles) {
  const normalizedAllowedRoles = allowedRoles.map(normalizeRole);
  return (req, res, next) => {
    const authorization = req.headers.authorization || '';
    const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : null;

    if (!token) {
      return res.status(401).json({ error: 'Autenticación requerida' });
    }

    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET || 'secret');
      const role = normalizeRole(payload.rol);
      if (!normalizedAllowedRoles.includes(role)) {
        return res.status(403).json({ error: 'No tiene permisos para esta operación' });
      }

      req.user = { ...payload, rol: role };
      next();
    } catch {
      return res.status(401).json({ error: 'Token inválido o expirado' });
    }
  };
}