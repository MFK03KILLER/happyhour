const router = require('express').Router();
const ctrl = require('../controllers/authController');
const validate = require('../middlewares/validate');
const { authenticate } = require('../middlewares/auth');
const { authLimiter } = require('../middlewares/rateLimit');
const {
  registerSchema,
  loginSchema,
  refreshSchema,
  changePasswordSchema,
  googleSignInSchema,
  appleSignInSchema,
} = require('../validators/authValidators');

/**
 * @openapi
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new customer account
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, fullName]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string, minLength: 8 }
 *               fullName: { type: string }
 *               phone: { type: string }
 *     responses:
 *       201: { description: Created }
 */
router.post('/register', authLimiter, validate(registerSchema), ctrl.register);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login with email and password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string }
 *     responses:
 *       200: { description: OK }
 */
router.post('/login', authLimiter, validate(loginSchema), ctrl.login);

/**
 * @openapi
 * /auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Exchange a refresh token for a new access token
 */
router.post('/refresh', validate(refreshSchema), ctrl.refresh);

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Logout current session
 *     security: [{ bearerAuth: [] }]
 */
router.post('/logout', authenticate(), ctrl.logout);

/**
 * @openapi
 * /auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get current authenticated user
 *     security: [{ bearerAuth: [] }]
 */
router.get('/me', authenticate(), ctrl.me);

/**
 * @openapi
 * /auth/change-password:
 *   post:
 *     tags: [Auth]
 *     summary: Change current user's password
 *     security: [{ bearerAuth: [] }]
 */
router.post('/change-password', authenticate(), validate(changePasswordSchema), ctrl.changePassword);

/**
 * @openapi
 * /auth/google:
 *   post:
 *     tags: [Auth]
 *     summary: Sign in using a Google ID token (from Google Identity Services)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [idToken]
 *             properties:
 *               idToken: { type: string }
 */
router.post('/google', authLimiter, validate(googleSignInSchema), ctrl.googleSignIn);

/**
 * @openapi
 * /auth/apple:
 *   post:
 *     tags: [Auth]
 *     summary: Sign in using an Apple ID token (from Sign in with Apple JS)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [idToken]
 *             properties:
 *               idToken: { type: string }
 *               fullName: { type: string }
 */
router.post('/apple', authLimiter, validate(appleSignInSchema), ctrl.appleSignIn);

module.exports = router;
