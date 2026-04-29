const express = require('express');
const router = express.Router();

// Logging
const requestLogger = require('../middleware/requestLogger');
const { adminLogger } = require('../utils/logger');
router.use(requestLogger(adminLogger));

// Controllers
const {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory
} = require('../controllers/admin/categoryController');

// =============================================================================
// NOTE: Admin auth middleware will be added here once Admin auth is built.
//       For now these routes are open for development purposes only.
//       TODO: router.use(protectAdmin) before going to production.
// =============================================================================

// --- Advocate Category Management ---
router.post('/categories',       createCategory);    // Create category or subcategory
router.get('/categories',        getCategories);     // Get full nested tree
router.get('/categories/:id',    getCategoryById);   // Get single with children
router.patch('/categories/:id',  updateCategory);    // Edit category
router.delete('/categories/:id', deleteCategory);    // Soft delete

module.exports = router;
