const express = require('express');
const router = express.Router();

// Logging
const requestLogger = require('../middleware/requestLogger');
const { adminLogger } = require('../utils/logger');
router.use(requestLogger(adminLogger));

// Middleware
const { protectAdmin } = require('../middleware/adminAuthMiddleware');
const { authLimiter } = require('../middleware/rateLimiter');

// Rate limiter for OTP — stricter (3 requests per 15 minutes)
const rateLimit = require('express-rate-limit');
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  message: { success: false, message: 'Too many OTP requests. Please wait 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false
});

// Auth Controllers
const {
  signUp,
  loginPassword,
  requestOtp,
  loginOtp,
  getProfile
} = require('../controllers/admin/adminAuthController');

// Category Controllers
const {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory
} = require('../controllers/admin/categoryController');

// =============================================================================
// PUBLIC AUTH ROUTES
// =============================================================================
router.post('/signup',      authLimiter, signUp);
router.post('/login',       authLimiter, loginPassword);
router.post('/request-otp', otpLimiter,  requestOtp);
router.post('/login-otp',   authLimiter, loginOtp);

// =============================================================================
// PROTECTED ADMIN ROUTES
// =============================================================================
router.use(protectAdmin);

// Profile
router.get('/profile', getProfile);

// --- Advocate Category Management ---
router.post('/categories',       createCategory);
router.get('/categories',        getCategories);
router.get('/categories/:id',    getCategoryById);
router.patch('/categories/:id',  updateCategory);
router.delete('/categories/:id', deleteCategory);

module.exports = router;
