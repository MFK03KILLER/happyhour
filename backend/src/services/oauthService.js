const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');
const env = require('../config/env');
const userRepo = require('../repositories/userRepository');
const siteSettingService = require('./siteSettingService');
const { issueTokens } = require('./authService');
const { UnauthorizedError, BadRequestError } = require('../utils/errors');

const googleClient = env.GOOGLE_CLIENT_ID ? new OAuth2Client(env.GOOGLE_CLIENT_ID) : null;

const appleJwks = jwksClient({
  jwksUri: 'https://appleid.apple.com/auth/keys',
  cache: true,
  cacheMaxAge: 24 * 60 * 60 * 1000,
});

function getAppleSigningKey(kid) {
  return new Promise((resolve, reject) => {
    appleJwks.getSigningKey(kid, (err, key) => {
      if (err) return reject(err);
      resolve(key.getPublicKey());
    });
  });
}

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

async function verifyAppleToken(idToken, fullName) {
  if (!env.APPLE_SERVICE_ID) throw new BadRequestError('Apple sign-in not configured on this server');
  const decoded = jwt.decode(idToken, { complete: true });
  if (!decoded || !decoded.header.kid) throw new UnauthorizedError('Invalid Apple token');
  const pubKey = await getAppleSigningKey(decoded.header.kid);
  let payload;
  try {
    payload = jwt.verify(idToken, pubKey, {
      algorithms: ['RS256'],
      audience: env.APPLE_SERVICE_ID,
      issuer: 'https://appleid.apple.com',
    });
  } catch {
    throw new UnauthorizedError('Apple token verification failed');
  }
  if (!payload.sub) throw new UnauthorizedError('Apple token missing sub');
  return {
    providerId: payload.sub,
    email: payload.email,
    emailVerified: payload.email_verified === 'true' || payload.email_verified === true,
    fullName: fullName || payload.email?.split('@')[0] || 'Apple user',
    avatarUrl: '',
  };
}

async function signInWithGoogle({ idToken, acceptedTermsVersion, userAgent }) {
  const info = await verifyGoogleToken(idToken);
  const user = await findOrCreateOauthUser('google', info, acceptedTermsVersion);
  return issueTokens(user, userAgent || 'google-oauth');
}

async function signInWithApple({ idToken, fullName, acceptedTermsVersion, userAgent }) {
  const info = await verifyAppleToken(idToken, fullName);
  const user = await findOrCreateOauthUser('apple', info, acceptedTermsVersion);
  return issueTokens(user, userAgent || 'apple-oauth');
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

module.exports = { signInWithGoogle, signInWithApple };
