const router = require('express').Router();
const ctrl = require('../controllers/merchantController');
const { authenticate, authorize, requirePermission } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { scanSchema } = require('../validators/customerValidators');
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

module.exports = router;
