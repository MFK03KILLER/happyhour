require('dotenv').config();

const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '4000', 10),
  MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/happyhour',
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'dev_access_secret',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret',
  JWT_ACCESS_TTL: process.env.JWT_ACCESS_TTL || '15m',
  JWT_REFRESH_TTL: process.env.JWT_REFRESH_TTL || '30d',
  CORS_ORIGINS: (process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:5174').split(','),
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'admin@happyhour.demo',
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'Admin@12345',
  MOCK_PAYMENTS: process.env.MOCK_PAYMENTS !== 'false',
  QR_SIGNING_SECRET: process.env.QR_SIGNING_SECRET || 'dev_qr_secret',
  QR_TTL_SECONDS: parseInt(process.env.QR_TTL_SECONDS || '60', 10),
};

module.exports = env;
