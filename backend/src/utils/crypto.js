const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const env = require('../config/env');

function randomNonce(bytes = 16) {
  return crypto.randomBytes(bytes).toString('hex');
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function signQrPayload(payload) {
  return jwt.sign(payload, env.QR_SIGNING_SECRET, { expiresIn: env.QR_TTL_SECONDS });
}

function verifyQrPayload(token) {
  return jwt.verify(token, env.QR_SIGNING_SECRET);
}

function signAccessToken(payload) {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: env.JWT_ACCESS_TTL });
}

function signRefreshToken(payload) {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: env.JWT_REFRESH_TTL });
}

function verifyAccessToken(token) {
  return jwt.verify(token, env.JWT_ACCESS_SECRET);
}

function verifyRefreshToken(token) {
  return jwt.verify(token, env.JWT_REFRESH_SECRET);
}

module.exports = {
  randomNonce,
  hashToken,
  signQrPayload,
  verifyQrPayload,
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
