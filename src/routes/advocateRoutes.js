const express = require('express');
const router = express.Router();

// Logging
const requestLogger = require('../middleware/requestLogger');
const { advocateLogger } = require('../utils/logger');
router.use(requestLogger(advocateLogger));

// --- Controllers ---
const {
  signUp, login, logout, getProfile, updateProfile, updateProfilePhoto
} = require('../controllers/advocate/advAuthController');

const {
  getVerificationStatus,
  uploadPan, editPan,
  uploadAadhar, editAadhar,
  uploadEnrollmentCertificate, editEnrollment,
  uploadPhoto, editPhoto,
  uploadVideo, editVideo
} = require('../controllers/advocate/advVerificationController');

const {
  getFees, updateFees
} = require('../controllers/advocate/advFeesController');

const {
  updateLocation
} = require('../controllers/advocate/advLocationController');

const {
  setAvailability,
  listAvailability,
  alterSlot,
  deleteSlot,
  listBookingRequests,
  respondToBooking,
  scheduleMeeting,
  listUpcomingAppointments,
  listPastAppointments,
  listAllAppointments,
  completeAppointment
} = require('../controllers/advocate/advAvailabilityController');

const {
  getDashboardStats
} = require('../controllers/advocate/advStatsController');

const {
  listDocuments,
  uploadDocument,
  saveNote,
  getDocument,
  downloadDocument,
  deleteDocument,
  getMyClients,
  getMyAppointments
} = require('../controllers/advocate/advDocumentController');

const {
  getAdvocateClients,
  updateClientVStatus,
  notifyClientForReview,
  verifyClientDoc
} = require('../controllers/advocate/advClientVerifyController');

// --- Middleware ---
const { protectAdvocate } = require('../middleware/advocateAuthMiddleware');
const { authLimiter } = require('../middleware/rateLimiter');
const advocateUpload = require('../utils/advocateMulterConfig');
const documentUpload = require('../utils/documentMulterConfig');

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
router.patch('/profile', updateProfile);
router.post('/profile/photo', advocateUpload.single('photo'), updateProfilePhoto);

// --- Dashboard Stats ---
router.get('/stats',    getDashboardStats);

// --- Fee Management ---
router.get('/fees',     getFees);
router.patch('/fees',   updateFees);

// --- Location ---
router.patch('/location', updateLocation);   // Set / update GPS coordinates

// --- Verification Document Management ---
// 1. GET (Check status/Parallel check)
router.get('/verify/:type', getVerificationStatus);

// 2. PATCH (Initial Upload - Fails if exists)
router.patch('/verify/pan',        advocateUpload.single('panImage'),              uploadPan);
router.patch('/verify/aadhar',     advocateUpload.single('aadharImage'),           uploadAadhar);
router.patch('/verify/enrollment', advocateUpload.single('enrollmentCertificate'), uploadEnrollmentCertificate);
router.patch('/verify/photo',      advocateUpload.single('photo'),                 uploadPhoto);
router.patch('/verify/video',      advocateUpload.single('video'),                 uploadVideo);

// 3. PUT (Edit / Replace - Fails if Verified)
router.put('/verify/pan',        advocateUpload.single('panImage'),              editPan);
router.put('/verify/aadhar',     advocateUpload.single('aadharImage'),           editAadhar);
router.put('/verify/enrollment', advocateUpload.single('enrollmentCertificate'), editEnrollment);
router.put('/verify/photo',      advocateUpload.single('photo'),                 editPhoto);
router.put('/verify/video',      advocateUpload.single('video'),                 editVideo);

// --- Availability Management ---
router.post('/availability',        setAvailability);    // Set slots (with recurrence)
router.get('/availability',         listAvailability);   // List my slots
router.patch('/availability/:id',   alterSlot);          // Edit a slot
router.delete('/availability/:id',  deleteSlot);         // Remove a slot

// --- Appointment Management ---
router.get('/appointments/requests',           listBookingRequests);     // View pending requests
router.get('/appointments/upcoming',           listUpcomingAppointments);// Upcoming accepted
router.get('/appointments/past',               listPastAppointments);    // Historical
router.get('/appointments/all',                listAllAppointments);     // All appointments
router.patch('/appointments/:id/respond',      respondToBooking);        // Accept / Reject
router.patch('/appointments/:id/schedule',     scheduleMeeting);         // Add meeting details
router.patch('/appointments/:id/complete',     completeAppointment);     // Mark as completed

// --- Document Center ---
router.get('/documents/clients',               getMyClients);            // Clients for Client Docs folder
router.get('/documents/appointments',          getMyAppointments);       // Appointments for dropdown
router.get('/documents',                       listDocuments);
router.get('/documents/:id',                   getDocument);
router.get('/documents/:id/download',          downloadDocument);
router.post('/documents/upload',               documentUpload.single('file'), uploadDocument);
router.post('/documents/note',                 saveNote);
router.delete('/documents/:id',                deleteDocument);

// --- Client Verification Center ---
router.get('/clients',                                getAdvocateClients);    // All appointment clients + KYC status
router.patch('/clients/:clientId/verify',             updateClientVStatus);   // Verify or reject entire client
router.patch('/clients/:clientId/verify-doc',         verifyClientDoc);       // Mark individual doc verified/rejected
router.post('/clients/:clientId/notify',              notifyClientForReview); // Send doc-review notification

module.exports = router;