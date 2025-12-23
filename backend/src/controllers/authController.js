const User = require('../models/User');
const jwt = require('jsonwebtoken');
const https = require('https');
const generateToken = require('../utils/generateToken');
const generateRefreshToken = require('../utils/generateRefreshToken');

/* ===============================
   COOKIE CONFIG (SINGLE SOURCE)
================================ */
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,          // REQUIRED for Vercel
  sameSite: 'none',      // REQUIRED for cross-site
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

/* ===============================
   REGISTER
================================ */
const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({ name, email, password, role });

    const access = generateToken(user._id, user.role, user.tokenVersion);
    const refresh = generateRefreshToken(user._id, user.tokenVersion);

    res.cookie('refreshToken', refresh, COOKIE_OPTIONS);

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      savedAddresses: user.savedAddresses,
      token: access,
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

/* ===============================
   LOGIN
================================ */
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const access = generateToken(user._id, user.role, user.tokenVersion);
    const refresh = generateRefreshToken(user._id, user.tokenVersion);

    res.cookie('refreshToken', refresh, COOKIE_OPTIONS);

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      savedAddresses: user.savedAddresses,
      token: access,
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

/* ===============================
   REFRESH ACCESS TOKEN (SAFE)
================================ */
const refreshAccessToken = async (req, res) => {
  const token = req.cookies?.refreshToken;

  if (!token) {
    return res.status(401).json({ message: 'NO_REFRESH_TOKEN' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'USER_NOT_FOUND' });
    }

    if (decoded.tokenVersion !== user.tokenVersion) {
      return res.status(401).json({ message: 'TOKEN_REVOKED' });
    }

    const access = generateToken(user._id, user.role, user.tokenVersion);
    return res.json({ token: access });
  } catch (e) {
    console.error('[Refresh]', e.message);
    return res.status(401).json({ message: 'INVALID_REFRESH_TOKEN' });
  }
};

/* ===============================
   LOGOUT (NON-DESTRUCTIVE)
================================ */
const logoutUser = async (req, res) => {
  res.clearCookie('refreshToken', COOKIE_OPTIONS);
  return res.status(200).json({ message: 'Logged out' });
};

/* ===============================
   PROFILE
================================ */
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { name, phone } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) return res.status(404).json({ message: 'User not found' });

    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;

    await user.save();
    const updated = await User.findById(user._id).select('-password');
    res.json(updated);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

/* ===============================
   GOOGLE AUTH HELPERS
================================ */
const tokeninfo = (idToken) =>
  new Promise((resolve, reject) => {
    https
      .get(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`, (r) => {
        let data = '';
        r.on('data', (c) => (data += c));
        r.on('end', () => resolve(JSON.parse(data)));
      })
      .on('error', reject);
  });

const fetchUserInfo = (accessToken) =>
  new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: 'www.googleapis.com',
        path: '/oauth2/v3/userinfo',
        headers: { Authorization: `Bearer ${accessToken}` },
      },
      (r) => {
        let data = '';
        r.on('data', (c) => (data += c));
        r.on('end', () => resolve(JSON.parse(data)));
      }
    );
    req.on('error', reject);
    req.end();
  });

/* ===============================
   GOOGLE AUTH
================================ */
const googleAuth = async (req, res) => {
  try {
    const { credential, accessToken, role } = req.body;
    if (!credential && !accessToken) {
      return res.status(400).json({ message: 'Invalid request' });
    }

    let info;
    if (credential) {
      info = await tokeninfo(credential);
      if (
        info.aud !== process.env.GOOGLE_CLIENT_ID ||
        info.email_verified !== 'true'
      ) {
        return res.status(401).json({ message: 'Invalid Google token' });
      }
    } else {
      info = await fetchUserInfo(accessToken);
      if (!info.email_verified) {
        return res.status(401).json({ message: 'Invalid Google access token' });
      }
    }

    let user = await User.findOne({ email: info.email });
    if (!user) {
      const pwd = Math.random().toString(36).slice(-12);
      user = await User.create({
        name: info.name || info.email.split('@')[0],
        email: info.email,
        password: pwd,
        role: role || 'customer',
        profilePhoto: info.picture,
      });
    }

    const access = generateToken(user._id, user.role, user.tokenVersion);
    const refresh = generateRefreshToken(user._id, user.tokenVersion);

    res.cookie('refreshToken', refresh, COOKIE_OPTIONS);
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: access,
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

/* ===============================
   EXPORTS
================================ */
module.exports = {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
  getUserProfile,
  updateProfile,
  googleAuth,
};
