const jwt = require('jsonwebtoken');
const Advocate = require('../models/Advocates');

const protect = async (req, res, next) => {
  let token;

  // Check if token exists in headers (Authorization: Bearer <token>)
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get advocate from the token (exclude password) and attach to request object
      req.advocate = await Advocate.findById(decoded.id).select('-password');

      next(); // Move to the actual controller
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

module.exports = { protect };