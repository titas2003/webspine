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

/**
 * @desc    Get total platform financial stats
 * @route   GET /api/admin/system/financials
 * @access  Protected (Admin only)
 */
exports.getFinancialStats = async (req, res) => {
  try {
    const Transaction = require('../../models/Transaction');

    const stats = await Transaction.aggregate([
      { $match: { status: 'success' } },
      { 
        $group: { 
          _id: null, 
          totalPlatformFees: { $sum: '$platformFeeCollected' },
          totalAdvocateEarnings: { $sum: '$advocateEarnings' },
          totalVolume: { $sum: '$amountPaidByClient' }
        } 
      }
    ]);

    const data = stats.length > 0 ? stats[0] : { totalPlatformFees: 0, totalAdvocateEarnings: 0, totalVolume: 0 };

    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
