const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const generateRefreshToken = require('../utils/generateRefreshToken');
const jwt = require('jsonwebtoken');
const https = require('https');

// Helper for cookie options
const getCookieOptions = () => {
    const isProduction = process.env.NODE_ENV === 'production' || process.env.RENDER;
    return {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
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
            res.cookie('refreshToken', refresh, getCookieOptions())
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
            res.cookie('refreshToken', refresh, getCookieOptions())
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
        const { name, phone } = req.body;
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        
        if (name) user.name = name;
        if (phone !== undefined) user.phone = phone;
        
        await user.save();
        const updatedUser = await User.findById(user._id).select("-password");
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
    } catch (error) {
        res.status(500).json({ message: error.message });
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
    res.clearCookie('refreshToken', getCookieOptions())
    res.status(200).json({ message: 'Logged out' })
}

const refreshAccessToken = async (req, res) => {
    try {
        const token = req.cookies?.refreshToken
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
        res.cookie('refreshToken', refresh, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            path: '/',
            maxAge: 7 * 24 * 60 * 60 * 1000
        })
        res.json({ _id: user._id, name: user.name, email: user.email, role: user.role, token: access })
    } catch (e) {
        res.status(500).json({ message: e.message })
    }
}

module.exports = { registerUser, loginUser, getUserProfile, updateProfile, uploadProfilePhoto, logoutUser, refreshAccessToken, googleAuth };
