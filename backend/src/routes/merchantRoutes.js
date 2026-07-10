const router = require('express').Router();
const ctrl = require('../controllers/merchantController');
const deliveryCtrl = require('../controllers/deliveryController');
const { authenticate, authorize, requirePermission } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const requireFeature = require('../middlewares/featureFlag');
const { scanSchema, deliveryStatusSchema } = require('../validators/customerValidators');
const { scanLimiter, writeLimiter } = require('../middlewares/rateLimit');

router.use(authenticate(), authorize('merchant_staff'));

router.get('/me', ctrl.me);
router.put('/me', requirePermission('manage_hours'), writeLimiter, ctrl.updateMe);

router.post('/scan', requirePermission('scan_coupons'), scanLimiter, validate(scanSchema), ctrl.scan);

router.get('/redemptions', requirePermission('view_stats'), ctrl.recent);
router.get('/stats', requirePermission('view_stats'), ctrl.stats);

router.get('/coupons', requirePermission('view_coupons'), ctrl.listMyCoupons);
router.post('/coupons', requirePermission('manage_coupons'), writeLimiter, ctrl.createMyCoupon);
router.put('/coupons/:id', requirePermission('manage_coupons'), writeLimiter, ctrl.updateMyCoupon);
router.delete('/coupons/:id', requirePermission('manage_coupons'), writeLimiter, ctrl.deleteMyCoupon);

/**
 * @openapi
 * /merchant/holidays:
 *   get:
 *     tags: [Merchant]
 *     summary: List effective holidays for this merchant (global + custom)
 *     security: [{ bearerAuth: [] }]
 *   post:
 *     tags: [Merchant]
 *     summary: Add a custom holiday for this merchant
 *     security: [{ bearerAuth: [] }]
 */
router.get('/holidays', ctrl.listHolidays);
router.post('/holidays', requirePermission('manage_hours'), writeLimiter, ctrl.addHoliday);
router.delete('/holidays/:id', requirePermission('manage_hours'), writeLimiter, ctrl.deleteHoliday);

/**
 * @openapi
 * /merchant/accept-terms:
 *   post:
 *     tags: [Merchant]
 *     summary: Record acceptance of the current Merchant Terms version
 *     security: [{ bearerAuth: [] }]
 */
router.post('/accept-terms', writeLimiter, ctrl.acceptTerms);

// ---------------- Delivery orders (feature-flagged) ----------------
/**
 * @openapi
 * /merchant/deliveries:
 *   get:
 *     tags: [Merchant]
 *     summary: List delivery orders for this location (filter by ?status=)
 *     security: [{ bearerAuth: [] }]
 */
router.get('/deliveries', requireFeature('delivery'), deliveryCtrl.merchantList);

/**
 * @openapi
 * /merchant/deliveries/{id}/status:
 *   post:
 *     tags: [Merchant]
 *     summary: Advance a delivery order (confirmed/preparing/out_for_delivery/delivered/cancelled)
 *     security: [{ bearerAuth: [] }]
 */
router.post('/deliveries/:id/status', requireFeature('delivery'), writeLimiter, validate(deliveryStatusSchema), deliveryCtrl.merchantUpdateStatus);

module.exports = router;
