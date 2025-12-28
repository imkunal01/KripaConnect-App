const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const generateRefreshToken = require('../utils/generateRefreshToken');
const jwt = require('jsonwebtoken');
const https = require('https');

// Helper for cookie options
const getCookieOptions = (req) => {
    // If we are on Render, force secure/none
    if (process.env.RENDER || process.env.NODE_ENV === 'production') {
        return {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
            path: '/',
            maxAge: 7 * 24 * 60 * 60 * 1000
        };
    }
    
    // Default to secure/none for cross-site (e.g. Vercel -> Render)
    return {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        path: '/',
        maxAge: 7 * 24 * 60 * 60 * 1000
    };
};

const registerUser = async (req, res)=>{
    try {
        const { name, email, password, role } = req.body;
        // check karega if user exist or not
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: "user already exists" })
        }

        // ab ham ek naya user banayenge 

        const user = await User.create({ name, email, password, role })
        if (user) {
            const access = generateToken(user._id, user.role, user.tokenVersion)
            const refresh = generateRefreshToken(user._id, user.tokenVersion)
            res.cookie('refreshToken', refresh, getCookieOptions(req))
            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                savedAddresses: user.savedAddresses,
                token: access
            });
        }
        else {

            // 400 Bad Request: The server cannot process the request due to malformed syntax.
            res.status(400).json({ message: "Invalid user data" })
        }

    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}
const loginUser = async (req, res)=>{
    try {
        const { email, password } = req.body;
        // check karega if user exist or not
        const user = await User.findOne({ email });
        if (user && (await user.matchPassword(password))) {
            const access = generateToken(user._id, user.role, user.tokenVersion)
            const refresh = generateRefreshToken(user._id, user.tokenVersion)
            res.cookie('refreshToken', refresh, getCookieOptions(req))
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                savedAddresses: user.savedAddresses,
                token: access,
            });
        } else {

            // 401 res is for unauthorized access
            res.status(401).json({ message: "Invalid user data" })
        }

    } catch (error) {
        res.status(500).json({ message: error.message })
    }
};

const getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select("-password");
        if (user) res.json(user);
        else res.status(404).json({ message: "User not found" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateProfile = async (req, res) => {
    try {
        const { name, phone, role, savedAddress } = req.body;
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const prevRole = user.role;
        
        if (name) user.name = name;
        if (phone !== undefined) user.phone = phone;

        // Optional: allow setting role only to customer/retailer
        if (role !== undefined) {
            if (role !== 'customer' && role !== 'retailer') {
                return res.status(400).json({ message: 'Invalid role' });
            }
            user.role = role;
        }

        // Optional: save/update the user's default shipping address
        // Body: { savedAddress: { name, phone, addressLine, city, state, pincode } }
        if (savedAddress) {
            const a = savedAddress || {};

            const normalized = {
                name: (a.name || user.name || '').toString().trim(),
                phone: (a.phone || user.phone || '').toString().trim(),
                addressLine: (a.addressLine || '').toString().trim(),
                city: (a.city || '').toString().trim(),
                state: (a.state || '').toString().trim(),
                pincode: (a.pincode || '').toString().trim(),
                default: true,
            };

            const missing = [];
            if (!normalized.name) missing.push('name');
            if (!normalized.phone) missing.push('phone');
            if (!normalized.addressLine) missing.push('addressLine');
            if (!normalized.city) missing.push('city');
            if (!normalized.state) missing.push('state');
            if (!normalized.pincode) missing.push('pincode');
            if (missing.length) {
                return res.status(400).json({ message: `Missing address fields: ${missing.join(', ')}` });
            }

            // Keep user.phone in sync if address has phone
            if (normalized.phone && user.phone !== normalized.phone) user.phone = normalized.phone;

            user.savedAddresses = Array.isArray(user.savedAddresses) ? user.savedAddresses : [];

            // Find current default BEFORE clearing flags
            const existingDefaultIdx = user.savedAddresses.findIndex(addr => addr.default === true);

            // Ensure only one default
            user.savedAddresses.forEach(addr => { addr.default = false; });

            if (existingDefaultIdx >= 0) {
                const existing = user.savedAddresses[existingDefaultIdx];
                // Mongoose subdoc: assign fields directly
                existing.name = normalized.name;
                existing.phone = normalized.phone;
                existing.addressLine = normalized.addressLine;
                existing.city = normalized.city;
                existing.state = normalized.state;
                existing.pincode = normalized.pincode;
                existing.default = true;
            } else {
                user.savedAddresses.push(normalized);
            }
        }
        
        await user.save();
        const updatedUser = await User.findById(user._id).select("-password");

        // If role changed, return a fresh access token so frontend permissions update immediately
        if (role !== undefined && prevRole !== user.role) {
            const access = generateToken(user._id, user.role, user.tokenVersion)
            return res.json({ ...updatedUser.toObject(), token: access })
        }

        res.json(updatedUser);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const uploadProfilePhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const { uploadBuffer } = require('../services/cloudinaryService');

    const { url } = await uploadBuffer(req.file.buffer, 'ecom_profiles');

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.profilePhoto = url;
    await user.save();

    const updatedUser = await User.findById(user._id).select("-password");
    res.json(updatedUser);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};


const logoutUser = async (req, res) => {
    try {
        const token = req.cookies?.refreshToken
        if (token) {
            const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET)
            const user = await User.findById(decoded.id)
            if (user) {
                user.tokenVersion += 1
                await user.save()
            }
        }
    } catch (_) {}
    res.clearCookie('refreshToken', getCookieOptions(req))
    res.status(200).json({ message: 'Logged out' })
}

const refreshAccessToken = async (req, res) => {
    try {
        const token = req.cookies?.refreshToken
        // Debug Log
        console.log(`[Refresh] Origin: ${req.headers.origin}, Secure: ${req.secure}, Protocol: ${req.protocol}`);
        console.log(`[Refresh] Token present: ${!!token}, Cookies:`, Object.keys(req.cookies || {}));
        
        if (!token) return res.status(401).json({ message: 'Not authorized' })
        const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET)
        const user = await User.findById(decoded.id)
        if (!user) return res.status(401).json({ message: 'Not authorized' })
        if (decoded.tokenVersion !== user.tokenVersion) return res.status(401).json({ message: 'Not authorized' })
        const access = generateToken(user._id, user.role, user.tokenVersion)
        res.json({ token: access })
    } catch (e) {
        console.error("[Refresh] Error:", e.message);
        res.status(401).json({ message: 'Not authorized' })
    }
}

function tokeninfo(idToken) {
    return new Promise((resolve, reject) => {
        const url = `https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`
        https.get(url, (resp) => {
            let data = ''
            resp.on('data', (chunk) => { data += chunk })
            resp.on('end', () => {
                try { resolve(JSON.parse(data)) } catch (e) { reject(e) }
            })
        }).on('error', reject)
    })
}

function fetchUserInfo(accessToken) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'www.googleapis.com',
            path: '/oauth2/v3/userinfo',
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        };
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
            });
        });
        req.on('error', reject);
        req.end();
    });
}

const googleAuth = async (req, res) => {
    try {
        const { credential, accessToken, role } = req.body
        if (!credential && !accessToken) return res.status(400).json({ message: 'Invalid request' })
        
        let info;
        if (credential) {
            info = await tokeninfo(credential)
            if (!info || info.aud !== process.env.GOOGLE_CLIENT_ID || info.email_verified !== 'true') {
                return res.status(401).json({ message: 'Invalid token' })
            }
        } else if (accessToken) {
            info = await fetchUserInfo(accessToken)
            if (!info || !info.email_verified) {
                return res.status(401).json({ message: 'Invalid access token' })
            }
        }

        const email = info.email
        let user = await User.findOne({ email })
        const isNewUser = !user
        if (!user) {
            const pwd = Math.random().toString(36).slice(-12)
            user = await User.create({ name: info.name || email.split('@')[0], email, password: pwd, role: role || 'customer', profilePhoto: info.picture })
        } else {
            if (!user.profilePhoto && info.picture) {
                user.profilePhoto = info.picture
                await user.save()
            }
        }
        const access = generateToken(user._id, user.role, user.tokenVersion)
        const refresh = generateRefreshToken(user._id, user.tokenVersion)
        res.cookie('refreshToken', refresh, getCookieOptions(req))
        res.json({ _id: user._id, name: user.name, email: user.email, role: user.role, savedAddresses: user.savedAddresses, isNewUser, token: access })
    } catch (e) {
        res.status(500).json({ message: e.message })
    }
}

const phoneFirebaseAuth = async (req, res) => {
    try {
        const phone = req.verifiedPhoneNumber
        if (!phone) return res.status(400).json({ message: 'Missing verified phone number' })

        // Find user by phone (E.164 format, e.g. +9198xxxxxx)
        let user = await User.findOne({ phone })
        const isNewUser = !user

        if (!user) {
            // NOTE: Current User schema requires email + password.
            // We create a synthetic email/password so existing email/password auth remains unchanged.
            const syntheticEmail = `otp_${phone.replace(/[^0-9]/g, '')}@phone.local`
            const pwd = Math.random().toString(36).slice(-12)
            user = await User.create({
                name: `User ${phone.slice(-4)}`,
                email: syntheticEmail,
                password: pwd,
                role: 'customer',
                phone,
            })
        }

        const access = generateToken(user._id, user.role, user.tokenVersion)
        const refresh = generateRefreshToken(user._id, user.tokenVersion)
        res.cookie('refreshToken', refresh, getCookieOptions(req))
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            savedAddresses: user.savedAddresses,
            isNewUser,
            token: access,
        })
    } catch (e) {
        res.status(500).json({ message: e.message })
    }
}

module.exports = { registerUser, loginUser, getUserProfile, updateProfile, uploadProfilePhoto, logoutUser, refreshAccessToken, googleAuth, phoneFirebaseAuth };
