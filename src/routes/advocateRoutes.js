const express = require('express');
const router = express.Router();

// --- Controllers ---
const {
  signUp, login, logout, getProfile
} = require('../controllers/advocate/advAuthController');

const {
  uploadPan, uploadAadhar, uploadEnrollmentCertificate, uploadPhoto, uploadVideo
} = require('../controllers/advocate/advVerificationController');

const {
  setAvailability,
  listAvailability,
  alterSlot,
  deleteSlot,
  listBookingRequests,
  respondToBooking,
  scheduleMeeting,
  listUpcomingAppointments,
  listPastAppointments
} = require('../controllers/advocate/advAvailabilityController');

// --- Middleware ---
const { protectAdvocate } = require('../middleware/advocateAuthMiddleware');
const { authLimiter } = require('../middleware/rateLimiter');
const advocateUpload = require('../utils/advocateMulterConfig');

// =============================================================================
// PUBLIC ROUTES
// =============================================================================
router.post('/signup', authLimiter, signUp);
router.post('/login',  authLimiter, login);

// =============================================================================
// PROTECTED ROUTES (require valid JWT)
// =============================================================================
router.use(protectAdvocate);

// --- Account ---
router.post('/logout',  logout);
router.get('/profile',  getProfile);

// --- Verification Document Uploads ---
router.patch('/verify/pan',        advocateUpload.single('panImage'),              uploadPan);
router.patch('/verify/aadhar',     advocateUpload.single('aadharImage'),           uploadAadhar);
router.patch('/verify/enrollment', advocateUpload.single('enrollmentCertificate'), uploadEnrollmentCertificate);
router.patch('/verify/photo',      advocateUpload.single('photo'),                 uploadPhoto);
router.patch('/verify/video',      advocateUpload.single('video'),                 uploadVideo);

// --- Availability Management ---
router.post('/availability',        setAvailability);    // Set slots (with recurrence)
router.get('/availability',         listAvailability);   // List my slots
router.patch('/availability/:id',   alterSlot);          // Edit a slot
router.delete('/availability/:id',  deleteSlot);         // Remove a slot

// --- Appointment Management ---
router.get('/appointments/requests',           listBookingRequests);     // View pending requests
router.get('/appointments/upcoming',           listUpcomingAppointments);// Upcoming accepted
router.get('/appointments/past',               listPastAppointments);    // Historical
router.patch('/appointments/:id/respond',      respondToBooking);        // Accept / Reject
router.patch('/appointments/:id/schedule',     scheduleMeeting);         // Add meeting details

module.exports = router;