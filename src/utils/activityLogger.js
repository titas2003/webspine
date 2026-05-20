const ActivityLog = require('../models/ActivityLog');

/**
 * Helper to log user activities
 * @param {ObjectId|string} userId 
 * @param {string} userModel - 'User' | 'Advocates' | 'Admin'
 * @param {string} action - e.g., 'LOGIN', 'SIGNUP', 'BOOK_APPOINTMENT'
 * @param {Object} details - Flexible metadata
 */
exports.logActivity = async (userId, userModel, action, details = {}) => {
  try {
    await ActivityLog.create({
      userId,
      userModel,
      action,
      details
    });
  } catch (error) {
    // We don't want activity logging failures to crash the main request
    console.error(`[ActivityLogger] Failed to log ${action} for ${userModel} ${userId}:`, error.message);
  }
};
