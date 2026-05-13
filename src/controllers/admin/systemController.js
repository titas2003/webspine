const Blacklist = require('../../models/Blacklist');

/**
 * @desc    Drop all active sessions platform-wide
 * @route   POST /api/admin/system/drop-all-sessions
 * @access  Protected (Admin only)
 */
exports.dropAllSessions = async (req, res) => {
  try {
    // Create a GLOBAL_LOGOUT record in the blacklist
    // Middlewares check JWT iat against this record's createdAt
    await Blacklist.create({
      token: 'GLOBAL_LOGOUT'
    });

    res.status(200).json({
      success: true,
      message: 'All active sessions have been invalidated successfully.'
    });
  } catch (error) {
    console.error('Error dropping all sessions:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to drop sessions'
    });
  }
};
