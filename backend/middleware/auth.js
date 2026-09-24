const jwt = require('jsonwebtoken');

/**
 * Middleware to authenticate requests via JWT Bearer Token.
 * Attaches decoded user payload ({ id, role, email, name }) to req.user.
 */
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No authentication token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_jwt_key_support_ticket_system_2026');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Middleware to enforce role-based authorization.
 * @param {string|string[]} roles - Allowed role or array of allowed roles (e.g. 'agent' or ['agent', 'admin'])
 */
function requireRole(roles) {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden: Access denied for your role' });
    }
    next();
  };
}

module.exports = {
  authenticate,
  requireRole
};
