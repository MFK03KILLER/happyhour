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

module.exports = router;
