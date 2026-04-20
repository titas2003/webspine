const jwt = require('jsonwebtoken');
const Advocate = require('../models/Advocates');
const Blacklist = require('../models/Blacklist');

/**
 * @desc    Middleware to protect routes for Advocates
 */
exports.protectAdvocate = async (req, res, next) => {
  let token;

  // 1. Extract Token from Headers
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
    // 2. Check Blacklist (Logged out tokens)
    const isBlacklisted = await Blacklist.findOne({ token });
    if (isBlacklisted) {
      return res.status(401).json({ 
        success: false, 
        message: 'Session ended. Please login again.' 
      });
    }

    // 3. Verify Token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 4. Find Advocate & Exclude Password
    // IMPORTANT: We search the Advocate model here
    req.user = await Advocate.findById(decoded.id).select('-password');

    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Advocate account not found' 
      });
    }

    next();
  } catch (err) {
    const message = err.name === 'TokenExpiredError' ? 'Session expired' : 'Invalid token';
    return res.status(401).json({ 
      success: false, 
      message 
    });
  }
};