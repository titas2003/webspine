const express = require('express');
const router = express.Router();
const { register, login, getMe } = require('../controllers/userAuthController');
const { protectClient } = require('../middleware/clientAuthMiddleware'); // See note below

// Public Routes
router.post('/register', register);
router.post('/login', login);

// Private Routes (Logged in Clients only)
router.get('/me', protectClient, getMe);

module.exports = router;