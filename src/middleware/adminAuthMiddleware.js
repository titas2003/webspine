const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

/**
 * @desc  Protect Admin Routes
 * Verifies JWT, checks admin exists and is active, attaches req.admin
 */
exports.protectAdmin = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access Denied: No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Ensure the token belongs to an admin (role claim)
    if (decoded.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Forbidden: Admin access only' });
    }

    const admin = await Admin.findById(decoded.id).select('-password -otpHash');
    if (!admin || !admin.isActive) {
      return res.status(401).json({ success: false, message: 'Admin account not found or deactivated' });
    }

    req.admin = admin;
    next();
  } catch (err) {
    const message = err.name === 'TokenExpiredError'
      ? 'Session expired, please login again'
      : 'Invalid token';
    return res.status(401).json({ success: false, message });
  }
};
