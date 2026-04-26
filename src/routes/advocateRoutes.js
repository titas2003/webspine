const express = require('express');
const router = express.Router();

const {
  signUp,
  login,
  logout
} = require('../controllers/advocate/advAuthController');

// Import the new Advocate Middleware
const { protectAdvocate } = require('../middleware/advocateAuthMiddleware');
const { authLimiter } = require('../middleware/rateLimiter');

// --- PUBLIC ROUTES ---
router.post('/signup', authLimiter, signUp);
router.post('/login', authLimiter, login);

// --- PROTECTED ROUTES ---
router.use(protectAdvocate); 
// Example protected route
router.post('/logout', logout);
router.get('/profile', (req, res) => {
  res.status(200).json({ success: true, data: req.user });
});

module.exports = router;