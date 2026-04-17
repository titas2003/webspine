const express = require('express');
const router = express.Router();

// Import the refined controller functions
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

// Import your new middleware
const { protectClient } = require('../middleware/clientAuthMiddleware');

// --- PUBLIC ROUTES ---
router.post('/signup', signUp); // Changed from register to signUp
router.post('/login', login);

// --- PROTECTED ROUTES (Requires Login) ---
router.use(protectClient); 

router.post('/logout', logout);
router.get('/profile', getProfile); // This is your "me" route
router.put('/profile', updateProfile);
router.patch('/location', updateLocation);
router.get('/v-status', getVerificationStatus);
router.patch('/update-email', updateEmail);
router.patch('/update-phone', updatePhone);

module.exports = router;