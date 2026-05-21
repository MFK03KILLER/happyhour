const { verifyAccessToken } = require('../utils/crypto');
const { UnauthorizedError, ForbiddenError } = require('../utils/errors');
const userRepo = require('../repositories/userRepository');

function authenticate(required = true) {
  return async (req, res, next) => {
    try {
      const header = req.headers.authorization;
      if (!header || !header.startsWith('Bearer ')) {
        if (!required) return next();
        throw new UnauthorizedError('Missing access token');
      }
      const token = header.slice(7);
      const decoded = verifyAccessToken(token);
      const user = await userRepo.findById(decoded.sub);
      if (!user) throw new UnauthorizedError('User not found');
      if (user.status !== 'active') throw new UnauthorizedError('Account not active');
      req.user = user;
      next();
    } catch (err) {
      if (err.name === 'TokenExpiredError') return next(new UnauthorizedError('Token expired'));
      if (err.name === 'JsonWebTokenError') return next(new UnauthorizedError('Invalid token'));
      next(err);
    }
  };
}

function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) return next(new UnauthorizedError());
    if (!allowedRoles.includes(req.user.role)) return next(new ForbiddenError('Insufficient permissions'));
    next();
  };
}

function requirePermission(...required) {
  return (req, res, next) => {
    if (!req.user) return next(new UnauthorizedError());
    if (req.user.role === 'admin') return next();
    const perms = req.user.permissions || [];
    const ok = required.every((p) => perms.includes(p));
    if (!ok) return next(new ForbiddenError('Missing required permission'));
    next();
  };
}

module.exports = { authenticate, authorize, requirePermission };
