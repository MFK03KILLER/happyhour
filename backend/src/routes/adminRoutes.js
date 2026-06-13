const router = require('express').Router();
const ctrl = require('../controllers/adminController');
const flagCtrl = require('../controllers/featureFlagController');
const { authenticate, authorize } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { writeLimiter } = require('../middlewares/rateLimit');
const { vendorSchema, merchantSchema, couponSchema, createUserSchema } = require('../validators/adminValidators');

router.use(authenticate(), authorize('admin'));

router.get('/features', flagCtrl.listAdmin);
router.patch('/features/:key', writeLimiter, flagCtrl.toggle);

/**
 * @openapi
 * /admin/stats/overview:
 *   get:
 *     tags: [Admin]
 *     summary: Admin dashboard overview KPIs
 *     security: [{ bearerAuth: [] }]
 */
router.get('/stats/overview', ctrl.overview);

/**
 * @openapi
 * /admin/audit-logs:
 *   get:
 *     tags: [Admin]
 *     summary: List audit logs
 *     security: [{ bearerAuth: [] }]
 */
router.get('/audit-logs', ctrl.auditLogs);

/**
 * @openapi
 * /admin/payments:
 *   get:
 *     tags: [Admin]
 *     summary: Paginated list of all payments
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *       - in: query
 *         name: method
 *         schema: { type: string, enum: [apple_pay, google_pay, card, paypal] }
 *       - in: query
 *         name: kind
 *         schema: { type: string, enum: [subscription, coupon_purchase, other] }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [succeeded, failed, refunded] }
 */
router.get('/payments', ctrl.payments);

/**
 * @openapi
 * /admin/revenue:
 *   get:
 *     tags: [Admin]
 *     summary: Revenue analytics
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: range
 *         schema: { type: string, enum: [today, week, month, year] }
 */
router.get('/revenue', ctrl.revenue);

/**
 * @openapi
 * /admin/vendors:
 *   get:
 *     tags: [Admin]
 *     summary: List vendors
 *     security: [{ bearerAuth: [] }]
 *   post:
 *     tags: [Admin]
 *     summary: Create vendor
 *     security: [{ bearerAuth: [] }]
 */
router.get('/vendors', ctrl.listVendors);
router.post('/vendors', writeLimiter, validate(vendorSchema), ctrl.createVendor);

/**
 * @openapi
 * /admin/vendors/{id}:
 *   put:
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 *   delete:
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 */
router.put('/vendors/:id', writeLimiter, ctrl.updateVendor);
router.delete('/vendors/:id', writeLimiter, ctrl.deleteVendor);

/**
 * @openapi
 * /admin/merchants:
 *   get:
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 *   post:
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 */
router.get('/merchants', ctrl.listMerchants);
router.post('/merchants', writeLimiter, validate(merchantSchema), ctrl.createMerchant);
router.put('/merchants/:id', writeLimiter, ctrl.updateMerchant);
router.delete('/merchants/:id', writeLimiter, ctrl.deleteMerchant);

/**
 * @openapi
 * /admin/coupons:
 *   get:
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 *   post:
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 */
router.get('/coupons', ctrl.listCoupons);
router.post('/coupons', writeLimiter, validate(couponSchema), ctrl.createCoupon);
router.put('/coupons/:id', writeLimiter, ctrl.updateCoupon);
router.delete('/coupons/:id', writeLimiter, ctrl.deleteCoupon);

/**
 * @openapi
 * /admin/users:
 *   get:
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 *   post:
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 */
router.get('/users', ctrl.listUsers);
router.post('/users', writeLimiter, validate(createUserSchema), ctrl.createUser);
router.put('/users/:id', writeLimiter, ctrl.updateUser);
router.delete('/users/:id', writeLimiter, ctrl.deleteUser);
router.get('/roles', ctrl.listRoles);

/**
 * @openapi
 * /admin/site-settings/terms:
 *   get:
 *     tags: [Admin]
 *     summary: Get the current Terms of Service (markdown + version)
 *     security: [{ bearerAuth: [] }]
 *   put:
 *     tags: [Admin]
 *     summary: Update Terms of Service. Auto-increments the version, forcing all users to re-accept on next signup.
 *     security: [{ bearerAuth: [] }]
 */
router.get('/site-settings/terms', ctrl.getTerms);
router.put('/site-settings/terms', writeLimiter, ctrl.updateTerms);

/**
 * @openapi
 * /admin/site-content:
 *   get:
 *     tags: [Admin]
 *     summary: List all footer content blocks (Membership, Careers, About, etc.)
 *     security: [{ bearerAuth: [] }]
 * /admin/site-content/{key}:
 *   put:
 *     tags: [Admin]
 *     summary: Update one content block. Auto-bumps its version.
 *     security: [{ bearerAuth: [] }]
 */
router.get('/site-content', ctrl.listSiteContent);
router.put('/site-content/:key', writeLimiter, ctrl.updateSiteContent);

/**
 * @openapi
 * /admin/plan-prices:
 *   get:
 *     tags: [Admin]
 *     summary: Get subscription plan prices (base defaults + admin overrides + effective)
 *     security: [{ bearerAuth: [] }]
 *   put:
 *     tags: [Admin]
 *     summary: Update subscription plan prices. Applies immediately, no restart needed.
 *     security: [{ bearerAuth: [] }]
 */
router.get('/plan-prices', ctrl.getPlanPrices);
router.put('/plan-prices', writeLimiter, ctrl.updatePlanPrices);

module.exports = router;
