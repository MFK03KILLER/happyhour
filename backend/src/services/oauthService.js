const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const env = require('../config/env');
const userRepo = require('../repositories/userRepository');
const siteSettingService = require('./siteSettingService');
const { issueTokens } = require('./authService');
const { UnauthorizedError, BadRequestError } = require('../utils/errors');

const googleClient = env.GOOGLE_CLIENT_ID ? new OAuth2Client(env.GOOGLE_CLIENT_ID) : null;

async function verifyGoogleToken(idToken) {
  if (!googleClient) throw new BadRequestError('Google sign-in not configured on this server');
  // google-auth-library throws raw errors for malformed tokens; without this the
  // endpoint answers 500 and leaks internals instead of a clean 401.
  let ticket;
  try {
    ticket = await googleClient.verifyIdToken({ idToken, audience: env.GOOGLE_CLIENT_ID });
  } catch (e) {
    throw new UnauthorizedError("Invalid Google token");
  }
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

// Apple's public signing keys, cached for a day. Apple rotates them rarely.
let appleKeysCache = { at: 0, keys: null };
async function getAppleKeys() {
  if (appleKeysCache.keys && Date.now() - appleKeysCache.at < 24 * 60 * 60 * 1000) return appleKeysCache.keys;
  const res = await fetch('https://appleid.apple.com/auth/keys');
  if (!res.ok) throw new UnauthorizedError('Could not reach Apple to verify sign-in');
  const { keys } = await res.json();
  appleKeysCache = { at: Date.now(), keys };
  return keys;
}

async function verifyAppleToken(identityToken, fullName) {
  const decoded = jwt.decode(identityToken, { complete: true });
  if (!decoded || !decoded.header) throw new UnauthorizedError('Invalid Apple token');
  const jwk = (await getAppleKeys()).find((k) => k.kid === decoded.header.kid);
  if (!jwk) throw new UnauthorizedError('Apple signing key not found');
  const pubKey = crypto.createPublicKey({ key: jwk, format: 'jwk' });
  let payload;
  try {
    payload = jwt.verify(identityToken, pubKey, {
      algorithms: ['RS256'],
      issuer: 'https://appleid.apple.com',
      audience: [env.APPLE_CLIENT_ID, env.APPLE_WEB_CLIENT_ID].filter(Boolean),
    });
  } catch (e) {
    throw new UnauthorizedError('Apple token verification failed');
  }
  if (!payload.sub) throw new UnauthorizedError('Invalid Apple token');
  // Apple only sends the name on the very first authorization, and only via the
  // native plugin (never in the token) — so the client passes it through.
  return {
    providerId: payload.sub,
    email: payload.email,
    emailVerified: payload.email_verified === true || payload.email_verified === 'true',
    fullName: (fullName && fullName.trim()) || payload.email?.split('@')[0] || 'Apple user',
    avatarUrl: '',
  };
}

async function signInWithApple({ identityToken, fullName, acceptedTermsVersion, userAgent }) {
  const info = await verifyAppleToken(identityToken, fullName);
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
