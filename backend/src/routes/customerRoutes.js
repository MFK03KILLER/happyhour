const router = require('express').Router();
const ctrl = require('../controllers/customerController');
const subCtrl = require('../controllers/subscriptionController');
const deliveryCtrl = require('../controllers/deliveryController');
const { authenticate, authorize } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const requireFeature = require('../middlewares/featureFlag');
const {
  purchaseSchema, browseQuerySchema, rateSchema,
  addressSchema, deliveryQuoteSchema,
} = require('../validators/customerValidators');
const { writeLimiter } = require('../middlewares/rateLimit');

router.use(authenticate(), authorize('customer'));

// ---------------- Address book (used for delivery) ----------------
/**
 * @openapi
 * /customer/addresses:
 *   get:
 *     tags: [Customer]
 *     summary: List my saved delivery addresses
 *     security: [{ bearerAuth: [] }]
 *   post:
 *     tags: [Customer]
 *     summary: Add a delivery address
 *     security: [{ bearerAuth: [] }]
 */
router.get('/addresses', deliveryCtrl.listAddresses);
router.post('/addresses', writeLimiter, validate(addressSchema), deliveryCtrl.createAddress);
router.put('/addresses/:addressId', writeLimiter, deliveryCtrl.updateAddress);
router.delete('/addresses/:addressId', writeLimiter, deliveryCtrl.deleteAddress);

// ---------------- Delivery (feature-flagged: "coming soon" until enabled) ----------------
/**
 * @openapi
 * /customer/delivery/quote:
 *   post:
 *     tags: [Customer]
 *     summary: Quote the delivery fee + ETA from a merchant to one of my addresses
 *     security: [{ bearerAuth: [] }]
 */
router.post('/delivery/quote', requireFeature('delivery'), validate(deliveryQuoteSchema), deliveryCtrl.quote);

/**
 * @openapi
 * /customer/deliveries:
 *   get:
 *     tags: [Customer]
 *     summary: List my delivery orders
 *     security: [{ bearerAuth: [] }]
 */
router.get('/deliveries', requireFeature('delivery'), deliveryCtrl.myDeliveries);
router.get('/deliveries/:id', requireFeature('delivery'), deliveryCtrl.myDeliveryDetail);
router.post('/deliveries/:id/cancel', requireFeature('delivery'), writeLimiter, deliveryCtrl.cancelMyDelivery);

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
 * /customer/subscription/checkout:
 *   post:
 *     tags: [Customer]
 *     summary: Start a Stripe Checkout session for a plan (returns a redirect URL)
 *     security: [{ bearerAuth: [] }]
 */
router.post('/subscription/checkout', writeLimiter, subCtrl.checkout);

/**
 * @openapi
 * /customer/subscription/validate-promo:
 *   post:
 *     tags: [Customer]
 *     summary: Preview a promo code against a plan (returns discount + final price)
 *     security: [{ bearerAuth: [] }]
 */
router.post('/subscription/validate-promo', writeLimiter, subCtrl.validatePromo);

/**
 * @openapi
 * /customer/payments:
 *   get:
 *     tags: [Customer]
 *     summary: My payment history (receipts)
 *     security: [{ bearerAuth: [] }]
 */
router.get('/payments', ctrl.myPayments);

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
router.get('/coupons/browse', ctrl.browse);

/**
 * @openapi
 * /customer/discover:
 *   get:
 *     tags: [Customer]
 *     summary: Discover merchants near a location with sort/filter
 *     security: [{ bearerAuth: [] }]
 */
router.get('/discover', ctrl.discoverMerchants);

/**
 * @openapi
 * /customer/merchants/{id}:
 *   get:
 *     tags: [Customer]
 *     summary: Merchant detail with their active coupons
 *     security: [{ bearerAuth: [] }]
 */
router.get('/merchants/:id', ctrl.merchantDetail);

/**
 * @openapi
 * /customer/daily-status:
 *   get:
 *     tags: [Customer]
 *     summary: Get today's claim count and remaining quota
 *     security: [{ bearerAuth: [] }]
 */
router.get('/daily-status', ctrl.dailyStatus);

/**
 * @openapi
 * /customer/surprise-bags:
 *   get:
 *     tags: [Customer]
 *     summary: Browse Surprise Bags (today's leftovers/last-minute deals)
 *     security: [{ bearerAuth: [] }]
 */
router.get('/surprise-bags', requireFeature('surprise_bag'), validate(browseQuerySchema, 'query'), ctrl.surpriseBags);

/**
 * @openapi
 * /customer/surprise-bags/{id}/buy:
 *   post:
 *     tags: [Customer]
 *     summary: Buy a Surprise Bag (no subscription required)
 *     security: [{ bearerAuth: [] }]
 */
router.post('/surprise-bags/:id/buy', requireFeature('surprise_bag'), writeLimiter, validate(purchaseSchema), ctrl.purchaseSurpriseBag);

/**
 * @openapi
 * /customer/surprise-bags/{id}/checkout:
 *   post:
 *     tags: [Customer]
 *     summary: Start a Stripe Checkout session for a surprise bag (returns a redirect URL)
 *     security: [{ bearerAuth: [] }]
 */
router.post('/surprise-bags/:id/checkout', requireFeature('surprise_bag'), writeLimiter, ctrl.checkoutSurpriseBag);

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
