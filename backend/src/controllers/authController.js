const asyncHandler = require('../utils/asyncHandler');
const authService = require('../services/authService');
const oauthService = require('../services/oauthService');

exports.register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);
  res.status(201).json(result);
});

exports.login = asyncHandler(async (req, res) => {
  const result = await authService.login({ ...req.body, userAgent: req.headers['user-agent'] });
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
