const express = require('express');
const router = express.Router();
const { getAllCategories } = require('../controllers/common/categoryController');

// Public routes
router.get('/categories', getAllCategories);

module.exports = router;
