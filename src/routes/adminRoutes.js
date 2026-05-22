const express = require('express');
const router = express.Router();

// Logging
const requestLogger = require('../middleware/requestLogger');
const { adminLogger } = require('../utils/logger');
router.use(requestLogger(adminLogger));

// Middleware
const { protectAdmin } = require('../middleware/adminAuthMiddleware');
const { authLimiter } = require('../middleware/rateLimiter');

// Rate limiter for OTP — stricter (3 requests per 15 minutes)
const rateLimit = require('express-rate-limit');
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  message: { success: false, message: 'Too many OTP requests. Please wait 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false
});

// Auth Controllers
const {
  signUp,
  loginPassword,
  requestOtp,
  loginOtp,
  getProfile,
  logout
} = require('../controllers/admin/adminAuthController');

// Category Controllers
const {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory
} = require('../controllers/admin/categoryController');

// Fee Policy Controllers
const {
  seedDefaultPolicies,
  getAllPolicies,
  upsertPolicy,
  refreshFees
} = require('../controllers/admin/feePolicyController');

// =============================================================================
// PUBLIC AUTH ROUTES
// =============================================================================
router.post('/signup', authLimiter, signUp);
router.post('/login', authLimiter, loginPassword);
router.post('/request-otp', otpLimiter, requestOtp);
router.post('/login-otp', authLimiter, loginOtp);

// =============================================================================
// PROTECTED ADMIN ROUTES
// =============================================================================
router.use(protectAdmin);

// Profile
router.get('/profile', getProfile);
router.post('/logout', logout);

// --- Advocate Category Management ---
router.post('/categories', createCategory);
router.get('/categories', getCategories);
router.get('/categories/:id', getCategoryById);
router.patch('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);

// --- Fee Policy Management ---
router.post('/fee-policies/refreshFees', refreshFees);
router.post('/fee-policies/seed', seedDefaultPolicies);
router.get('/fee-policies', getAllPolicies);
router.put('/fee-policies/:bracketKey', upsertPolicy);

// --- Advocate Search (shared controller with client) ---
const { searchAdvocates } = require('../controllers/client/advocateSearchController');
router.get('/advocates/search', searchAdvocates);

// --- Advocate Verification Management ---
const { verifyAdvocate, getAdvocateDetails } = require('../controllers/admin/advocateVerificationController');
router.get('/advocates/:advId',          getAdvocateDetails);   // View full advocate details
router.patch('/advocates/:advId/verify', verifyAdvocate);       // Verify or Reject

// --- System Management ---
const { dropAllSessions, getFinancialStats } = require('../controllers/admin/systemController');
const { getSystemHealth } = require('../controllers/admin/adminHealthController');

router.post('/system/drop-all-sessions', dropAllSessions);
router.get('/system/financials', getFinancialStats);
router.get('/system/health', getSystemHealth);

// =============================================================================
// NEW API ENDPOINTS (Platform Management)
// =============================================================================

// --- Client Visibility & Alteration ---
const { getAllClients, getClientById, updateClient } = require('../controllers/admin/adminClientController');
router.get('/clients', getAllClients);
router.get('/clients/:id', getClientById);
router.patch('/clients/:id', updateClient);

// --- Advocate Visibility & Alteration ---
const { getAllAdvocates, updateAdvocate } = require('../controllers/admin/adminAdvocateController');
router.get('/advocates', getAllAdvocates);
router.patch('/advocates/:advId/update', updateAdvocate); // '/advocates/:advId/verify' is used by VerificationController

// --- Appointment Visibility & Alteration ---
const { getAllAppointments, getAppointmentById, updateAppointmentStatus } = require('../controllers/admin/adminAppointmentController');
router.get('/appointments', getAllAppointments);
router.get('/appointments/:id', getAppointmentById);
router.patch('/appointments/:id/status', updateAppointmentStatus);

// --- Financial Transactions ---
const { getAllTransactions } = require('../controllers/admin/adminFinancialController');
router.get('/financials/transactions', getAllTransactions);

// --- Activity Logs (File-based, per role) ---
const { getAdvocateLogs, getClientLogs, getAdminLogs } = require('../controllers/admin/adminActivityController');
router.get('/activity/advocate', getAdvocateLogs);
router.get('/activity/client', getClientLogs);
router.get('/activity/admin', getAdminLogs);

// --- Bulk Notifications ---
const { sendBulkMailToAdvocates, sendBulkMailToClients } = require('../controllers/admin/adminNotificationController');
router.post('/notifications/advocates', sendBulkMailToAdvocates);
router.post('/notifications/clients', sendBulkMailToClients);

module.exports = router;

