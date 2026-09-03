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

// Self-service account deletion (Google Play "account deletion" requirement).
exports.deleteAccount = asyncHandler(async (req, res) => {
  await authService.deleteAccount(req.user._id, { password: req.body.password });
  await require('../services/auditService').log({
    actorUserId: req.user._id, action: 'account.self_delete',
    targetType: 'User', targetId: req.user._id.toString(), req,
  });
  res.status(204).end();
});
