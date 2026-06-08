const asyncHandler = require('../utils/asyncHandler');
const authService = require('../services/authService');
const oauthService = require('../services/oauthService');

exports.requestOtp = asyncHandler(async (req, res) => {
  const result = await authService.requestPhoneOtp({ phone: req.body.phone });
  res.json(result);
});

exports.verifyOtp = asyncHandler(async (req, res) => {
  const result = await authService.loginWithOtp({
    phone: req.body.phone,
    code: req.body.code,
    fullName: req.body.fullName,
    userAgent: req.headers['user-agent'],
  });
  res.json(result);
});

exports.login = asyncHandler(async (req, res) => {
  const result = await authService.loginWithPassword({
    phone: req.body.phone,
    password: req.body.password,
    userAgent: req.headers['user-agent'],
  });
  res.json(result);
});

exports.refresh = asyncHandler(async (req, res) => {
  const result = await authService.refresh(req.body.refreshToken);
  res.json(result);
});

exports.logout = asyncHandler(async (req, res) => {
  await authService.logout(req.user._id, req.body.refreshToken);
  res.status(204).end();
});

exports.me = asyncHandler(async (req, res) => {
  res.json({ user: req.user });
});

exports.changePassword = asyncHandler(async (req, res) => {
  await authService.changePassword(req.user._id, req.body.currentPassword, req.body.newPassword);
  res.status(204).end();
});

exports.googleSignIn = asyncHandler(async (req, res) => {
  const result = await oauthService.signInWithGoogle({
    idToken: req.body.idToken,
    acceptedTermsVersion: req.body.acceptedTermsVersion,
    userAgent: req.headers['user-agent'],
  });
  res.json(result);
});

exports.appleSignIn = asyncHandler(async (req, res) => {
  const result = await oauthService.signInWithApple({
    idToken: req.body.idToken,
    fullName: req.body.fullName,
    acceptedTermsVersion: req.body.acceptedTermsVersion,
    userAgent: req.headers['user-agent'],
  });
  res.json(result);
});
