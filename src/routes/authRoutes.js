const express = require('express');
const router = express.Router();
const { register, login, logout } = require('../controllers/authController');

router.post('/logout', logout);
router.post('/register', register);
router.post('/login', login);


module.exports = router; // <--- This line is vital