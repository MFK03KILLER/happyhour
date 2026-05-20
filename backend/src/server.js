const env = require('./config/env');
const logger = require('./utils/logger');
const { connectDB } = require('./config/db');
const buildApp = require('./app');

async function start() {
  try {
    await connectDB();
    const app = buildApp();
    app.listen(env.PORT, () => {
      logger.info(`Happy Hour API running on http://localhost:${env.PORT}`);
      logger.info(`Swagger docs at http://localhost:${env.PORT}/api/docs`);
    });
  } catch (err) {
    logger.error({ err }, 'Failed to start server');
    process.exit(1);
  }
}

process.on('unhandledRejection', (reason) => logger.error({ reason }, 'Unhandled rejection'));
process.on('uncaughtException', (err) => { logger.error({ err }, 'Uncaught exception'); process.exit(1); });

start();
