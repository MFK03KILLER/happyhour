const router = require('express').Router();
const ctrl = require('../controllers/authController');
const validate = require('../middlewares/validate');
const { authenticate } = require('../middlewares/auth');
const { authLimiter } = require('../middlewares/rateLimit');
const {
  requestOtpSchema,
  verifyOtpSchema,
  loginSchema,
  refreshSchema,
  changePasswordSchema,
  googleSignInSchema,
  appleSignInSchema,
} = require('../validators/authValidators');

/**
 * @openapi
 * /auth/otp/request:
 *   post:
 *     tags: [Auth]
 *     summary: درخواست ارسال کد یکبارمصرف به موبایل
 */
router.post('/otp/request', authLimiter, validate(requestOtpSchema), ctrl.requestOtp);

/**
 * @openapi
 * /auth/otp/verify:
 *   post:
 *     tags: [Auth]
 *     summary: تایید کد و ورود یا ثبت‌نام
 */
router.post('/otp/verify', authLimiter, validate(verifyOtpSchema), ctrl.verifyOtp);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: ورود ادمین/وندور/مرچنت با رمز عبور
 */
router.post('/login', authLimiter, validate(loginSchema), ctrl.login);

router.post('/refresh', validate(refreshSchema), ctrl.refresh);
router.post('/logout', authenticate(), ctrl.logout);
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
