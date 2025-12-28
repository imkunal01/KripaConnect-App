const express = require("express");
const { registerUser, loginUser, getUserProfile, updateProfile, uploadProfilePhoto, logoutUser, refreshAccessToken, googleAuth, phoneFirebaseAuth } = require("../controllers/authController.js");
const { protect } = require("../middleware/authMiddleware.js");
const { verifyFirebasePhoneToken } = require('../middleware/firebaseAuthMiddleware.js')
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
router.post("/phone/firebase", verifyFirebasePhoneToken, phoneFirebaseAuth);


module.exports = router;
