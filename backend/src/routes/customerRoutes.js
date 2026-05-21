const router = require('express').Router();
const ctrl = require('../controllers/customerController');
const subCtrl = require('../controllers/subscriptionController');
const { authenticate, authorize } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { purchaseSchema, browseQuerySchema, rateSchema } = require('../validators/customerValidators');
const { writeLimiter } = require('../middlewares/rateLimit');

router.use(authenticate(), authorize('customer'));

/**
 * @openapi
 * /customer/subscription:
 *   get:
 *     tags: [Customer]
 *     summary: Get my subscription
 *     security: [{ bearerAuth: [] }]
 */
router.get('/subscription', subCtrl.me);

/**
 * @openapi
 * /customer/subscription/subscribe:
 *   post:
 *     tags: [Customer]
 *     summary: Subscribe to a plan
 *     security: [{ bearerAuth: [] }]
 */
router.post('/subscription/subscribe', writeLimiter, subCtrl.subscribe);

/**
 * @openapi
 * /customer/subscription/cancel:
 *   post:
 *     tags: [Customer]
 *     summary: Cancel subscription at period end
 *     security: [{ bearerAuth: [] }]
 */
router.post('/subscription/cancel', writeLimiter, subCtrl.cancel);

router.post('/subscription/resume', writeLimiter, subCtrl.resume);

/**
 * @openapi
 * /customer/coupons/browse:
 *   get:
 *     tags: [Customer]
 *     summary: Browse available coupons (paginated, filterable)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *       - in: query
 *         name: city
 *         schema: { type: string }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 */
router.get('/coupons/browse', validate(browseQuerySchema, 'query'), ctrl.browse);

/**
 * @openapi
 * /customer/coupons/{id}:
 *   get:
 *     tags: [Customer]
 *     security: [{ bearerAuth: [] }]
 */
router.get('/coupons/:id', ctrl.detail);

/**
 * @openapi
 * /customer/coupons/{id}/purchase:
 *   post:
 *     tags: [Customer]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               paymentMethod:
 *                 type: string
 *                 enum: [apple_pay, google_pay, card, paypal]
 */
router.post('/coupons/:id/purchase', writeLimiter, validate(purchaseSchema), ctrl.purchase);

/**
 * @openapi
 * /customer/coupons/{id}/claim:
 *   post:
 *     tags: [Customer]
 *     summary: Claim a coupon (subscription required)
 *     security: [{ bearerAuth: [] }]
 */
router.post('/coupons/:id/claim', writeLimiter, ctrl.claim);

/**
 * @openapi
 * /customer/wallet:
 *   get:
 *     tags: [Customer]
 *     security: [{ bearerAuth: [] }]
 */
router.get('/wallet', ctrl.wallet);

/**
 * @openapi
 * /customer/wallet/{purchasedCouponId}/redeem:
 *   post:
 *     tags: [Customer]
 *     summary: Issue a fresh redemption QR for a purchased coupon
 *     security: [{ bearerAuth: [] }]
 */
router.post('/wallet/:purchasedCouponId/redeem', ctrl.issueRedemption);

/**
 * @openapi
 * /customer/wallet/{purchasedCouponId}/redeem/{redemptionId}/rotate:
 *   post:
 *     tags: [Customer]
 *     summary: Rotate a pending QR (refresh nonce + expiry)
 *     security: [{ bearerAuth: [] }]
 */
router.post('/wallet/:purchasedCouponId/redeem/:redemptionId/rotate', ctrl.rotateRedemption);

/**
 * @openapi
 * /customer/wallet/{purchasedCouponId}/redeem/{redemptionId}/status:
 *   get:
 *     tags: [Customer]
 *     summary: Poll redemption status (pending/completed/expired)
 *     security: [{ bearerAuth: [] }]
 */
router.get('/wallet/:purchasedCouponId/redeem/:redemptionId/status', ctrl.redemptionStatus);

/**
 * @openapi
 * /customer/orders:
 *   get:
 *     tags: [Customer]
 *     security: [{ bearerAuth: [] }]
 */
router.get('/orders', ctrl.orders);

/**
 * @openapi
 * /customer/orders/{redemptionId}:
 *   get:
 *     tags: [Customer]
 *     security: [{ bearerAuth: [] }]
 */
router.get('/orders/:redemptionId', ctrl.orderDetail);

/**
 * @openapi
 * /customer/orders/{redemptionId}/rate:
 *   post:
 *     tags: [Customer]
 *     security: [{ bearerAuth: [] }]
 */
router.post('/orders/:redemptionId/rate', writeLimiter, validate(rateSchema), ctrl.rateOrder);

module.exports = router;
