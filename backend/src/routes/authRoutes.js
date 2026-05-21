const router = require('express').Router();
const ctrl = require('../controllers/authController');
const validate = require('../middlewares/validate');
const { authenticate } = require('../middlewares/auth');
const { authLimiter } = require('../middlewares/rateLimit');
const { requestOtpSchema, verifyOtpSchema, loginSchema, refreshSchema } = require('../validators/authValidators');

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

module.exports = router;
