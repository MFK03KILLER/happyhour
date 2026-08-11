const { OAuth2Client } = require('google-auth-library');
const env = require('../config/env');
const userRepo = require('../repositories/userRepository');
const siteSettingService = require('./siteSettingService');
const { issueTokens } = require('./authService');
const { UnauthorizedError, BadRequestError } = require('../utils/errors');

const googleClient = env.GOOGLE_CLIENT_ID ? new OAuth2Client(env.GOOGLE_CLIENT_ID) : null;

async function verifyGoogleToken(idToken) {
  if (!googleClient) throw new BadRequestError('Google sign-in not configured on this server');
  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: env.GOOGLE_CLIENT_ID,
  });
  const payload = ticket.getPayload();
  if (!payload || !payload.sub) throw new UnauthorizedError('Invalid Google token');
  return {
    providerId: payload.sub,
    email: payload.email,
    emailVerified: !!payload.email_verified,
    fullName: payload.name || payload.email?.split('@')[0] || 'Google user',
    avatarUrl: payload.picture || '',
  };
}

async function signInWithGoogle({ idToken, acceptedTermsVersion, userAgent }) {
  const info = await verifyGoogleToken(idToken);
  const user = await findOrCreateOauthUser('google', info, acceptedTermsVersion);
  return issueTokens(user, userAgent || 'google-oauth');
}

async function findOrCreateOauthUser(provider, info, acceptedTermsVersion) {
  const idField = provider === 'google' ? 'googleId' : 'appleId';

  let user = await require('../models/User').findOne({ [idField]: info.providerId });
  if (user) {
    user.lastLoginAt = new Date();
    if (info.avatarUrl && !user.avatarUrl) user.avatarUrl = info.avatarUrl;
    // If they hadn't accepted current terms yet and client provided one, store it.
    if (acceptedTermsVersion && (!user.acceptedTerms || user.acceptedTerms.version !== acceptedTermsVersion)) {
      user.acceptedTerms = { version: acceptedTermsVersion, acceptedAt: new Date() };
    }
    await user.save();
    return user;
  }

  const terms = await siteSettingService.getTerms();
  if (!acceptedTermsVersion || acceptedTermsVersion !== terms.version) {
    throw new BadRequestError('You must accept the current terms to sign up');
  }

  if (info.email) {
    user = await userRepo.findByEmail(info.email);
    if (user) {
      user[idField] = info.providerId;
      user.authProvider = provider;
      user.emailVerified = user.emailVerified || info.emailVerified;
      if (info.avatarUrl && !user.avatarUrl) user.avatarUrl = info.avatarUrl;
      user.acceptedTerms = { version: terms.version, acceptedAt: new Date() };
      user.lastLoginAt = new Date();
      await user.save();
      return user;
    }
  }

  if (!info.email) throw new BadRequestError('OAuth provider did not return an email');

  user = await userRepo.create({
    email: info.email,
    fullName: info.fullName,
    authProvider: provider,
    [idField]: info.providerId,
    emailVerified: info.emailVerified,
    avatarUrl: info.avatarUrl,
    role: 'customer',
    lastLoginAt: new Date(),
    acceptedTerms: { version: terms.version, acceptedAt: new Date() },
  });
  return user;
}

module.exports = { signInWithGoogle };
