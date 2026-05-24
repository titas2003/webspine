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
    const Appointment = require('../../models/Appointment');
    const User = require('../../models/User');

    // 1. Overall Financials
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
    const financials = stats.length > 0 ? stats[0] : { totalPlatformFees: 0, totalAdvocateEarnings: 0, totalVolume: 0 };

    // 2. Monthly Revenue Trends (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const monthlyTrendsRaw = await Transaction.aggregate([
      { $match: { status: 'success', createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } },
          revenue: { $sum: '$platformFeeCollected' },
          volume: { $sum: '$amountPaidByClient' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);
    // Format monthly trends
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const revenueTrends = monthlyTrendsRaw.map(t => ({
      label: `${monthNames[t._id.month - 1]} ${t._id.year}`,
      revenue: t.revenue,
      volume: t.volume
    }));

    // 3. Location Trends (Clients by State/Address)
    const locationTrends = await User.aggregate([
      {
        $project: {
          loc: { $ifNull: ['$state', { $ifNull: ['$location.address', 'Unspecified'] }] }
        }
      },
      { $group: { _id: '$loc', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 6 }
    ]);

    // 4. Appointment Status Trends
    const appointmentTrends = await Appointment.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        ...financials,
        revenueTrends,
        locationTrends: locationTrends.map(l => ({ location: l._id, count: l.count })),
        appointmentTrends: appointmentTrends.map(a => ({ status: a._id, count: a.count }))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
