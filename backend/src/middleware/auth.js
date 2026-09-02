import jwt from 'jsonwebtoken';

export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    const authorization = req.headers.authorization || '';
    const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : null;

    if (!token) {
      return res.status(401).json({ error: 'Autenticación requerida' });
    }

    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET || 'secret');
      if (!allowedRoles.includes(payload.rol)) {
        return res.status(403).json({ error: 'No tiene permisos para esta operación' });
      }

      req.user = payload;
      next();
    } catch {
      return res.status(401).json({ error: 'Token inválido o expirado' });
    }
  };
}