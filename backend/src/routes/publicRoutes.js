const router = require('express').Router();
const ctrl = require('../controllers/publicController');
const flagCtrl = require('../controllers/featureFlagController');
const { publicLimiter } = require('../middlewares/rateLimit');

router.use(publicLimiter);

router.get('/features', flagCtrl.publicFlags);

/**
 * @openapi
 * /public/categories:
 *   get:
 *     tags: [Public]
 *     summary: List all categories
 */
router.get('/categories', ctrl.categories);

/**
 * @openapi
 * /public/merchants/{slug}:
 *   get:
 *     tags: [Public]
 *     summary: Get merchant by slug
 */
router.get('/merchants/:slug', ctrl.merchantBySlug);

/**
 * @openapi
 * /public/terms:
 *   get:
 *     tags: [Public]
 *     summary: Get current terms of service (version + markdown content)
 */
router.get('/terms', ctrl.terms);

/**
 * @openapi
 * /public/plans:
 *   get:
 *     tags: [Public]
 *     summary: List subscription plans (customer or merchant audience)
 *     parameters:
 *       - in: query
 *         name: audience
 *         schema: { type: string, enum: [customer, merchant] }
 */
router.get('/plans', ctrl.plans);

/**
 * @openapi
 * /public/site-content:
 *   get:
 *     tags: [Public]
 *     summary: List all editable footer content blocks (titles + sections + versions only)
 * /public/site-content/{key}:
 *   get:
 *     tags: [Public]
 *     summary: Get full markdown content of one block (Membership, Careers, About, etc.)
 */
router.get('/site-content', ctrl.contentList);
router.get('/site-content/:key', ctrl.contentOne);

module.exports = router;
