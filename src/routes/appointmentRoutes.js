const express = require('express');
const router = express.Router();
const { getAppointments, createAppointment } = require('../controllers/appointmentController');
const { protect } = require('../middleware/authMiddleware');

// Protect all routes - Advocate must be logged in
router.use(protect);

router.route('/')
  .get(getAppointments)
  .post(createAppointment);

module.exports = router;