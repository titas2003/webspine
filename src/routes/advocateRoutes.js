const express = require('express');
const router = express.Router();

const {
  signUp,
  login,
  logout,
  getProfile
} = require('../controllers/advocate/advAuthController');

const {
  uploadPan,
  uploadAadhar,
  uploadEnrollmentCertificate,
  uploadPhoto,
  uploadVideo
} = require('../controllers/advocate/advVerificationController');

// Import Middleware
const { protectAdvocate } = require('../middleware/advocateAuthMiddleware');
const { authLimiter } = require('../middleware/rateLimiter');
const advocateUpload = require('../utils/advocateMulterConfig');

// --- PUBLIC ROUTES ---
router.post('/signup', authLimiter, signUp);
router.post('/login', authLimiter, login);

// --- PROTECTED ROUTES ---
router.use(protectAdvocate);

// Account
router.post('/logout', logout);
router.get('/profile', getProfile);

// --- VERIFICATION DOCUMENT UPLOADS ---
/**
 * Note: The `upload.single()` key MUST match the form-data Key you use in Postman.
 * Enrollment route also accepts enrollmentNumber / barId as text fields.
 */
router.patch('/verify/pan',        advocateUpload.single('panImage'),              uploadPan);
router.patch('/verify/aadhar',     advocateUpload.single('aadharImage'),           uploadAadhar);
router.patch('/verify/enrollment', advocateUpload.single('enrollmentCertificate'), uploadEnrollmentCertificate);
router.patch('/verify/photo',      advocateUpload.single('photo'),                 uploadPhoto);
router.patch('/verify/video',      advocateUpload.single('video'),                 uploadVideo);

module.exports = router;