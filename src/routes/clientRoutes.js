const express = require('express');
const router = express.Router();

// 1. Import Multer Utility
const upload = require('../utils/clientMulterConfig');

// 2. Import Controllers
// Authentication & Account
const { 
  signUp, 
  login, 
  logout, 
  getProfile, 
  updateProfile, 
  updateLocation, 
  getVerificationStatus,
  updateEmail,
  updatePhone
} = require('../controllers/client/userAuthController'); 

// New Verification Controller
const {
  uploadAadhar,
  uploadPan,
  uploadPhoto,
  uploadVideo
} = require('../controllers/client/verificationController');

// 3. Import Middleware
const { protectClient } = require('../middleware/clientAuthMiddleware');

// --- PUBLIC ROUTES ---
router.post('/signup', signUp);
router.post('/login', login);

// --- PROTECTED ROUTES (Requires Login) ---
router.use(protectClient); 

// Account Management
router.post('/logout', logout);
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.patch('/location', updateLocation);
router.get('/v-status', getVerificationStatus);
router.patch('/update-email', updateEmail);
router.patch('/update-phone', updatePhone);

// --- VERIFICATION DOCUMENT UPLOADS ---
/**
 * Note: The 'upload.single()' parameter MUST match the Key 
 * you use in your Postman form-data request.
 */
router.patch('/verify/aadhar', upload.single('aadharImage'), uploadAadhar);
router.patch('/verify/pan', upload.single('panImage'), uploadPan);
router.patch('/verify/photo', upload.single('photo'), uploadPhoto);
router.patch('/verify/video', upload.single('video'), uploadVideo);

module.exports = router;