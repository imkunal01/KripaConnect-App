const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("mongo-sanitize");

// Rate Limiter (Prevent DDoS / brute force)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,                 // limit each IP to 200 requests
  message: {
    success: false,
    message: "Too many requests, please try again later.",
  },
});

// Stricter limiters for auth-sensitive routes
const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: {
    success: false,
    message: "Too many password reset requests, please try again later.",
  },
});

const otpRequestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: {
    success: false,
    message: "Too many OTP requests, please try again later.",
  },
});

const otpVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15,
  message: {
    success: false,
    message: "Too many OTP verification attempts, please try again later.",
  },
});

// Input Sanitization
const sanitizeRequest = (req, res, next) => {
  if (req.body) mongoSanitize(req.body);
  if (req.query) mongoSanitize(req.query);
  if (req.params) mongoSanitize(req.params);
  next();
};

module.exports = {
  helmet,
  apiLimiter,
  forgotPasswordLimiter,
  otpRequestLimiter,
  otpVerifyLimiter,
  sanitizeRequest,
};
