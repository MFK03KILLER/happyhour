const router = require('express').Router();
const ctrl = require('../controllers/vendorController');
const { authenticate, authorize } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { couponSchema } = require('../validators/adminValidators');
const { writeLimiter } = require('../middlewares/rateLimit');

router.use(authenticate(), authorize('vendor'));

/**
 * @openapi
 * /vendor/merchants:
 *   get:
 *     tags: [Vendor]
 *     summary: List merchants for the authenticated vendor
 *     security: [{ bearerAuth: [] }]
 */
router.get('/merchants', ctrl.listMyMerchants);

/**
 * @openapi
 * /vendor/coupons:
 *   get:
 *     tags: [Vendor]
 *     security: [{ bearerAuth: [] }]
 *   post:
 *     tags: [Vendor]
 *     security: [{ bearerAuth: [] }]
 */
router.get('/coupons', ctrl.listMyCoupons);
router.post('/coupons', writeLimiter, validate(couponSchema), ctrl.createCoupon);

/**
 * @openapi
 * /vendor/stats:
 *   get:
 *     tags: [Vendor]
 *     security: [{ bearerAuth: [] }]
 */
router.get('/stats', ctrl.stats);

module.exports = router;
