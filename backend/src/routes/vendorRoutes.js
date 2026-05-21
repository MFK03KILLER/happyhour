const router = require('express').Router();
const ctrl = require('../controllers/vendorController');
const { authenticate, authorize, requirePermission } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { couponSchema, merchantSchema } = require('../validators/adminValidators');
const { writeLimiter } = require('../middlewares/rateLimit');

router.use(authenticate(), authorize('vendor'));

/**
 * @openapi
 * /vendor/stats:
 *   get:
 *     tags: [Vendor]
 *     summary: Vendor-level stats
 *     security: [{ bearerAuth: [] }]
 */
router.get('/stats', requirePermission('view_stats'), ctrl.stats);

router.get('/merchants', ctrl.listMyMerchants);
router.post('/merchants', requirePermission('manage_merchants'), writeLimiter, ctrl.createMyMerchant);
router.put('/merchants/:id', requirePermission('manage_merchants'), writeLimiter, ctrl.updateMyMerchant);
router.delete('/merchants/:id', requirePermission('manage_merchants'), writeLimiter, ctrl.deleteMyMerchant);

router.get('/coupons', ctrl.listMyCoupons);
router.post('/coupons', requirePermission('manage_coupons'), writeLimiter, ctrl.createCoupon);
router.put('/coupons/:id', requirePermission('manage_coupons'), writeLimiter, ctrl.updateCoupon);
router.delete('/coupons/:id', requirePermission('manage_coupons'), writeLimiter, ctrl.deleteCoupon);

router.get('/team', requirePermission('manage_team'), ctrl.listTeam);
router.post('/team', requirePermission('manage_team'), writeLimiter, ctrl.createTeamMember);
router.delete('/team/:id', requirePermission('manage_team'), writeLimiter, ctrl.removeTeamMember);

module.exports = router;
