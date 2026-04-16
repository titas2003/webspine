const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Blacklist = require('../models/Blacklist'); // Import the Blacklist model

/**
 * @desc    Middleware to protect routes for Clients
 * Checks for Bearer token, Blacklist status, and attaches client to req.user
 */
exports.protectClient = async (req, res, next) => {
  let token;

  // 1. Extract Token
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Access Denied: No token provided' 
    });
  }

  try {
    // 2. Check if token is Blacklisted (Logged out)
    const isBlacklisted = await Blacklist.findOne({ token });
    if (isBlacklisted) {
      return res.status(401).json({ 
        success: false, 
        message: 'Session ended. Please login again.' 
      });
    }

    // 3. Verify Token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 4. Find User & Exclude Password
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Account not found or session expired' 
      });
    }

    next();
  } catch (err) {
    const message = err.name === 'TokenExpiredError' ? 'Session expired, please login again' : 'Invalid token';
    return res.status(401).json({ 
      success: false, 
      message 
    });
  }
};