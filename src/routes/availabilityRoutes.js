const express = require('express');
const router = express.Router();
const { setAvailability } = require('../controllers/advocate/availabilityController');
const { protect } = require('../middleware/authMiddleware');

// The frontend calls /api/availability, so this should just be '/'
router.post('/', protect, setAvailability);

module.exports = router;