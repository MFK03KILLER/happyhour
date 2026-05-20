const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const hpp = require('hpp');
const mongoSanitize = require('express-mongo-sanitize');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');

const env = require('./config/env');
const swaggerSpec = require('./swagger');
const requestId = require('./middlewares/requestId');
const sanitize = require('./middlewares/sanitize');
const { errorHandler, notFoundHandler } = require('./middlewares/errorHandler');

const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const vendorRoutes = require('./routes/vendorRoutes');
const merchantRoutes = require('./routes/merchantRoutes');
const customerRoutes = require('./routes/customerRoutes');
const publicRoutes = require('./routes/publicRoutes');
const publicCtrl = require('./controllers/publicController');

function buildApp() {
  const app = express();
  app.set('trust proxy', 1);

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (env.CORS_ORIGINS.includes(origin)) return cb(null, true);
      return cb(new Error('Not allowed by CORS'));
    },
    credentials: true,
  }));
  app.use(express.json({ limit: '100kb' }));
  app.use(express.urlencoded({ extended: true, limit: '100kb' }));
  app.use(hpp());
  app.use(mongoSanitize());
  app.use(sanitize);
  app.use(requestId);
  if (env.NODE_ENV !== 'test') app.use(morgan('dev'));

  app.get('/health', publicCtrl.health);
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { customSiteTitle: 'Happy Hour API Docs' }));
  app.get('/api/docs.json', (req, res) => res.json(swaggerSpec));

  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/admin', adminRoutes);
  app.use('/api/v1/vendor', vendorRoutes);
  app.use('/api/v1/merchant', merchantRoutes);
  app.use('/api/v1/customer', customerRoutes);
  app.use('/api/v1/public', publicRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = buildApp;
