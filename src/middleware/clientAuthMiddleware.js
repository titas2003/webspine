const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * @desc    Middleware to protect routes for Clients
 * Checks for Bearer token and attaches client user to req.user
 */
exports.protectClient = async (req, res, next) => {
  let token;

  // Check for token in headers
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Not authorized to access this route, no token provided' 
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach the client from the "Clients" collection to the request object
    req.user = await User.findById(decoded.id);

    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'User no longer exists' 
      });
    }

    next();
  } catch (err) {
    return res.status(401).json({ 
      success: false, 
      message: 'Token verification failed' 
    });
  }
};