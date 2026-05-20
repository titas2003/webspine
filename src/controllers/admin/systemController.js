const Blacklist = require('../../models/Blacklist');
const User = require('../../models/User');
const Advocates = require('../../models/Advocates');
const { sendAdminBulkNotification } = require('../../utils/mailer');

/**
 * @desc    Drop all active sessions platform-wide
 * @route   POST /api/admin/system/drop-all-sessions
 * @access  Protected (Admin only)
 */
exports.dropAllSessions = async (req, res) => {
  try {
    // 1. Create a GLOBAL_LOGOUT record in the blacklist
    // Middlewares check JWT iat against this record's createdAt
    await Blacklist.create({
      token: 'GLOBAL_LOGOUT'
    });

    // 2. Gather all user emails (clients + advocates) to notify — fire and forget
    const [clients, advocates] = await Promise.all([
      User.find().select('email'),
      Advocates.find().select('email')
    ]);

    const allEmails = [
      ...clients.map(c => c.email),
      ...advocates.map(a => a.email)
    ].filter(Boolean);

    if (allEmails.length > 0) {
      // Fire-and-forget — don't await, so the API responds immediately
      sendAdminBulkNotification(
        allEmails,
        'Scheduled Maintenance — Session Reset',
        `<p>Dear MacclouSpine User,</p>
        <p>We sincerely apologise for the inconvenience.</p>
        <p>
          All active sessions, including yours, have been <strong>dropped intentionally</strong> 
          by MacclouSpine due to a scheduled <strong>maintenance activity</strong>.
        </p>
        <p>Please log in again to continue using the platform. We appreciate your patience and understanding.</p>
        <br/>
        <p>Warm regards,<br/><strong>MacclouSpine Team</strong></p>`
      );
    }

    res.status(200).json({
      success: true,
      message: `All active sessions have been invalidated. Maintenance notification sent to ${allEmails.length} registered users.`
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
