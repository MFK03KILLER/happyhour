const router = require('express').Router();
const ctrl = require('../controllers/vendorController');
const subCtrl = require('../controllers/subscriptionController');
const { authenticate, authorize, requirePermission } = require('../middlewares/auth');
const { writeLimiter } = require('../middlewares/rateLimit');

router.use(authenticate(), authorize('vendor'));

/**
 * @openapi
 * /vendor/subscription:
 *   get:
 *     tags: [Vendor]
 *     summary: Get this vendor's merchant subscription
 *     security: [{ bearerAuth: [] }]
 */
router.get('/subscription', (req, res, next) => { req.query.audience = 'merchant'; next(); }, subCtrl.me);
router.post('/subscription/subscribe', writeLimiter, (req, res, next) => { req.body.audience = 'merchant'; next(); }, subCtrl.subscribe);
router.post('/subscription/cancel', writeLimiter, (req, res, next) => { req.query.audience = 'merchant'; next(); }, subCtrl.cancel);
router.post('/subscription/resume', writeLimiter, (req, res, next) => { req.query.audience = 'merchant'; next(); }, subCtrl.resume);

router.get('/stats', requirePermission('view_stats'), ctrl.stats);
router.get('/analytics', requirePermission('view_stats'), ctrl.analytics);
router.get('/suggestions', requirePermission('view_stats'), ctrl.suggestions);
router.get('/best-now', requirePermission('view_stats'), ctrl.bestCouponNow);
router.get('/activity', requirePermission('view_stats'), ctrl.activityFeed);
router.get('/export/redemptions.csv', requirePermission('view_payments'), ctrl.exportRedemptionsCsv);
router.get('/coupons/:id/performance', requirePermission('view_stats'), ctrl.couponPerformance);
router.post('/coupons/bulk', requirePermission('manage_coupons'), writeLimiter, ctrl.bulkCouponAction);

router.get('/merchants', ctrl.listMyMerchants);
router.post('/merchants', requirePermission('manage_merchants'), writeLimiter, ctrl.createMyMerchant);
router.put('/merchants/:id', requirePermission('manage_merchants'), writeLimiter, ctrl.updateMyMerchant);
router.delete('/merchants/:id', requirePermission('manage_merchants'), writeLimiter, ctrl.deleteMyMerchant);

router.get('/coupons', ctrl.listMyCoupons);
router.post('/coupons', requirePermission('manage_coupons'), writeLimiter, ctrl.createCoupon);
router.put('/coupons/:id', requirePermission('manage_coupons'), writeLimiter, ctrl.updateCoupon);
router.delete('/coupons/:id', requirePermission('manage_coupons'), writeLimiter, ctrl.deleteCoupon);

router.get('/roles', requirePermission('view_team'), ctrl.listRoles);
router.get('/team', requirePermission('view_team'), ctrl.listTeam);
router.post('/team', requirePermission('manage_team'), writeLimiter, ctrl.createTeamMember);
router.put('/team/:id', requirePermission('manage_team'), writeLimiter, ctrl.updateTeamMember);
router.delete('/team/:id', requirePermission('manage_team'), writeLimiter, ctrl.removeTeamMember);

router.get('/holidays', ctrl.listHolidays);
router.post('/holidays', requirePermission('manage_hours'), writeLimiter, ctrl.addHoliday);
router.delete('/holidays/:id', requirePermission('manage_hours'), writeLimiter, ctrl.deleteHoliday);

/**
 * @openapi
 * /vendor/accept-terms:
 *   post:
 *     tags: [Vendor]
 *     summary: Record acceptance of the current Merchant Terms version
 *     security: [{ bearerAuth: [] }]
 */
router.post('/accept-terms', writeLimiter, ctrl.acceptTerms);

module.exports = router;
