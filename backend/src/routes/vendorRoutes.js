const router = require('express').Router();
const ctrl = require('../controllers/vendorController');
const { authenticate, authorize, requirePermission } = require('../middlewares/auth');
const { writeLimiter } = require('../middlewares/rateLimit');

router.use(authenticate(), authorize('vendor'));

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

module.exports = router;
