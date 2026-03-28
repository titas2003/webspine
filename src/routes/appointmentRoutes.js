const express = require('express');
const router = express.Router();
const { 
  getAppointments, 
  createAppointmentRequest, 
  updateAppointmentStatus 
} = require('../controllers/appointmentController');
const { protect } = require('../middleware/authMiddleware');

// 1. PUBLIC ROUTE: For clients to request an appointment (Testing requirement #2)
router.post('/request', createAppointmentRequest);

// 2. PROTECTED ROUTES: Only for the logged-in advocate
router.use(protect);

router.route('/')
  .get(getAppointments); // Handles Requirements #1, 4, 5, 6, 7, 8 via query params

router.route('/:id/status')
  .patch(updateAppointmentStatus); // Handles Requirement #3 (Accept/Reject)

module.exports = router;