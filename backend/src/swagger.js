const swaggerJsdoc = require('swagger-jsdoc');
const path = require('path');

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Happy Hour API',
      version: '1.0.0',
      description: 'Happy Hour — Entertainer-style coupon & loyalty platform API (USA, demo mode).',
    },
    servers: [
      { url: 'http://localhost:4000/api/v1', description: 'Local development' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
    },
    tags: [
      { name: 'Auth' },
      { name: 'Admin' },
      { name: 'Vendor' },
      { name: 'Merchant' },
      { name: 'Customer' },
      { name: 'Public' },
    ],
  },
  apis: [path.join(__dirname, 'routes', '*.js')],
};

module.exports = swaggerJsdoc(options);
