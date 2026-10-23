const crypto = require('crypto');
const User = require('../models/User');
const ProviderProfile = require('../models/ProviderProfile');
const RefreshSession = require('../models/RefreshSession');
const { signToken } = require('../middleware/auth');

const REFRESH_COOKIE = 'tlp_refresh';
const REFRESH_DAYS = 7;

const isProduction = process.env.NODE_ENV === 'production';

const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? 'none' : 'lax',
  path: '/api/auth',
};

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function createRefreshToken() {
  return crypto.randomBytes(48).toString('hex');
}

function setRefreshCookie(res, token) {
  res.cookie(REFRESH_COOKIE, token, {
    ...cookieOptions,
    maxAge: REFRESH_DAYS * 24 * 60 * 60 * 1000,
  });
}

function clearRefreshCookie(res) {
  res.clearCookie(REFRESH_COOKIE, cookieOptions);
}

async function createSession(user, familyId = crypto.randomUUID()) {
  const refreshToken = createRefreshToken();
  const tokenHash = hashToken(refreshToken);

  await RefreshSession.create({
    user: user._id,
    tokenHash,
    familyId,
    expiresAt: new Date(Date.now() + REFRESH_DAYS * 24 * 60 * 60 * 1000),
  });

  return { refreshToken, familyId };
}

function sendAuthResponse(res, user, refreshToken, status = 200) {
  setRefreshCookie(res, refreshToken);

  return res.status(status).json({
    token: signToken(user),
    user,
  });
}

// FR-1: register as customer or provider.
exports.register = async (req, res) => {
  const { name, email, password, phone, role } = req.body;

  const existing = await User.findOne({ email });

  if (existing) {
    return res.status(409).json({
      message: 'An account with this email already exists',
    });
  }

  const user = await User.create({ name, email, password, phone, role });

  if (user.role === 'provider') {
    await ProviderProfile.create({ user: user._id });
  }

  const session = await createSession(user);

  return sendAuthResponse(res, user, session.refreshToken, 201);
};

// FR-3: login
exports.login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({
      message: 'Incorrect email or password',
    });
  }

  const session = await createSession(user);

  return sendAuthResponse(res, user, session.refreshToken);
};

// Exchange refresh cookie for a new access token and rotate the refresh token.
exports.refresh = async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE];

  if (!token) {
    clearRefreshCookie(res);
    return res.status(401).json({ message: 'Refresh session required' });
  }

  const tokenHash = hashToken(token);
  const session = await RefreshSession.findOne({ tokenHash });

  if (!session) {
    clearRefreshCookie(res);
    return res.status(401).json({ message: 'Invalid refresh session' });
  }

  if (session.revokedAt) {
    await RefreshSession.updateMany(
      { familyId: session.familyId, revokedAt: null },
      { $set: { revokedAt: new Date() } }
    );

    clearRefreshCookie(res);
    return res.status(401).json({ message: 'Refresh session revoked' });
  }

  if (session.expiresAt <= new Date()) {
    session.revokedAt = new Date();
    await session.save();

    clearRefreshCookie(res);
    return res.status(401).json({ message: 'Refresh session expired' });
  }

  const user = await User.findById(session.user);

  if (!user) {
    await RefreshSession.updateMany(
      { familyId: session.familyId, revokedAt: null },
      { $set: { revokedAt: new Date() } }
    );

    clearRefreshCookie(res);
    return res.status(401).json({ message: 'User no longer exists' });
  }

  const newRefreshToken = createRefreshToken();
  const newTokenHash = hashToken(newRefreshToken);

  const replacement = await RefreshSession.create({
    user: user._id,
    tokenHash: newTokenHash,
    familyId: session.familyId,
    expiresAt: new Date(Date.now() + REFRESH_DAYS * 24 * 60 * 60 * 1000),
  });

  session.revokedAt = new Date();
  session.replacedByHash = newTokenHash;
  await session.save();

  setRefreshCookie(res, newRefreshToken);

  return res.json({ token: signToken(user), user });
};

// Logout revokes this refresh session and clears the cookie.
exports.logout = async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE];

  if (token) {
    const session = await RefreshSession.findOne({
      tokenHash: hashToken(token),
    });

    if (session && !session.revokedAt) {
      session.revokedAt = new Date();
      await session.save();
    }
  }

  clearRefreshCookie(res);
  return res.json({ message: 'Logged out successfully' });
};

exports.me = async (req, res) => {
  res.json({ user: req.user });
};

// FR-5: update profile
exports.updateMe = async (req, res) => {
  const { name, phone } = req.body;

  if (name !== undefined) req.user.name = name;
  if (phone !== undefined) req.user.phone = phone;

  await req.user.save();
  res.json({ user: req.user });
};