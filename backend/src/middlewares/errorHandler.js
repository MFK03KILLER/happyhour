const logger = require('../utils/logger');
const { AppError } = require('../utils/errors');

function notFoundHandler(req, res, next) {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found' } });
}

function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: { code: err.code, message: err.message, details: err.details },
    });
  }
  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: err.message } });
  }
  if (err.name === 'CastError') {
    return res.status(400).json({ error: { code: 'INVALID_ID', message: 'Invalid identifier' } });
  }
  if (err.code === 11000) {
    return res.status(409).json({ error: { code: 'DUPLICATE', message: 'Duplicate value', details: err.keyValue } });
  }
  logger.error({ err }, 'Unhandled error');
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } });
}

module.exports = { errorHandler, notFoundHandler };
