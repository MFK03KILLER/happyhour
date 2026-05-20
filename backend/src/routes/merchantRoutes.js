const router = require('express').Router();
const ctrl = require('../controllers/merchantController');
const { authenticate, authorize } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { scanSchema } = require('../validators/customerValidators');
const { scanLimiter } = require('../middlewares/rateLimit');

router.use(authenticate(), authorize('merchant_staff'));

/**
 * @openapi
 * /merchant/me:
 *   get:
 *     tags: [Merchant]
 *     summary: Get merchant info for current staff user
 *     security: [{ bearerAuth: [] }]
 */
router.get('/me', ctrl.me);

/**
 * @openapi
 * /merchant/scan:
 *   post:
 *     tags: [Merchant]
 *     summary: Scan a customer's QR code and complete redemption
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               qrPayload: { type: string }
 *     responses:
 *       200: { description: Scan result with customer and coupon }
 */
router.post('/scan', scanLimiter, validate(scanSchema), ctrl.scan);

/**
 * @openapi
 * /merchant/redemptions:
 *   get:
 *     tags: [Merchant]
 *     summary: List recent redemptions at this merchant
 *     security: [{ bearerAuth: [] }]
 */
router.get('/redemptions', ctrl.recent);

/**
 * @openapi
 * /merchant/stats:
 *   get:
 *     tags: [Merchant]
 *     summary: Merchant stats (today/week/month, top coupons, trends)
 *     security: [{ bearerAuth: [] }]
 */
router.get('/stats', ctrl.stats);

module.exports = router;
