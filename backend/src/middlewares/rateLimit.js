const rateLimit = require('express-rate-limit');

const standardOpts = { standardHeaders: true, legacyHeaders: false };

const authLimiter = rateLimit({ windowMs: 60 * 1000, max: 5, message: { error: { code: 'TOO_MANY_REQUESTS', message: 'Too many login attempts' } }, ...standardOpts });
const scanLimiter = rateLimit({ windowMs: 60 * 1000, max: 30, ...standardOpts });
const publicLimiter = rateLimit({ windowMs: 60 * 1000, max: 100, ...standardOpts });
const writeLimiter = rateLimit({ windowMs: 60 * 1000, max: 30, ...standardOpts });

module.exports = { authLimiter, scanLimiter, publicLimiter, writeLimiter };
