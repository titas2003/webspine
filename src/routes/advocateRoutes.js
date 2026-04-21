const express = require('express');
const router = express.Router();

const {
  signUp,
  login,
  logout
} = require('../controllers/advocate/AdvAuthController');

// Import the new Advocate Middleware
const { protectAdvocate } = require('../middleware/advocateAuthMiddleware');

// --- PUBLIC ROUTES ---
router.post('/signup', signUp);
router.post('/login', login);

// --- PROTECTED ROUTES ---
router.use(protectAdvocate); 
// Example protected route
router.post('/logout', logout);
router.get('/profile', (req, res) => {
  res.status(200).json({ success: true, data: req.user });
});

module.exports = router;