const express = require("express");
const { registerUser, loginUser, getUserProfile, updateProfile, uploadProfilePhoto, logoutUser, refreshAccessToken, googleAuth } = require("../controllers/authController.js");
const { requestPasswordReset, resetPassword, requestLoginOtp, verifyLoginOtp } = require("../controllers/passwordResetController.js");
const { protect } = require("../middleware/authMiddleware.js");
const validate = require('../middleware/validate.js')
const {registerValidation , loginValidation} = require('../validations/authValidations.js')
const upload = require('../middleware/uploadMiddleware.js')
const router = express.Router();

router.post("/register", registerValidation, validate, registerUser);
router.post("/login", loginValidation, validate, loginUser);
router.get("/profile", protect, getUserProfile);
router.put("/profile", protect, updateProfile);
router.post("/profile/photo", protect, upload.single('photo'), uploadProfilePhoto);
router.post("/logout", logoutUser);
router.post("/refresh", refreshAccessToken);
router.post("/google", googleAuth);

// Password reset routes
router.post("/forgot-password", requestPasswordReset);
router.post("/reset-password", resetPassword);

// OTP login routes
router.post("/login-otp/request", requestLoginOtp);
router.post("/login-otp/verify", verifyLoginOtp);


module.exports = router;
