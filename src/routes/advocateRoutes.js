const express = require('express');
const router = express.Router();
const { searchAdvocates, getMe } = require('../controllers/advocateController');
const { protect } = require('../middleware/authMiddleware');

// Public route: Clients need to search without logging in
router.get('/search', searchAdvocates);

// Private route: Only logged-in advocates can see their own full profile
router.get('/me', protect, getMe);

module.exports = router;