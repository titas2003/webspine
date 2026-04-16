const express = require('express');
const router = express.Router();
const { searchAdvocates, getMe } = require('../controllers/advocate/advocateController');
const { register, login, logout } = require('../controllers/advocate/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/logout', logout);
router.post('/register', register);
router.post('/login', login);

// Public route: Clients need to search without logging in
router.get('/search', searchAdvocates);

// Private route: Only logged-in advocates can see their own full profile
router.get('/me', protect, getMe);

module.exports = router;