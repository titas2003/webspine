const Appointment = require('../../models/Appointment');
const Advocate = require('../../models/Advocates');

// ---------------------------------------------------------------------------
// @desc    Get Advocate Dashboard Statistics
// @route   GET /api/advocate/stats
// @access  Private (Advocate)
// ---------------------------------------------------------------------------
exports.getDashboardStats = async (req, res) => {
  try {
    const advocateId = req.user._id;

    // Run aggregation queries in parallel for efficiency
    const [
      pendingCount,
      unattendedCount,
      rejectedCount,
      totalCount,
      completedCount,
      advocate
    ] = await Promise.all([
      Appointment.countDocuments({ advocateId, status: 'pending' }),
      Appointment.countDocuments({ advocateId, status: 'accepted' }),
      Appointment.countDocuments({ advocateId, status: 'rejected' }),
      Appointment.countDocuments({ advocateId, status: { $in: ['accepted', 'completed'] } }), // Active/Past
      Appointment.countDocuments({ advocateId, status: 'completed' }),
      Advocate.findById(advocateId).select('feesPerSitting')
    ]);

    const feesPerSitting = advocate?.feesPerSitting || 0;
    const totalEarnings = completedCount * feesPerSitting;

    res.status(200).json({
      success: true,
      data: {
        pendingRequests: pendingCount,
        unattendedAppointments: unattendedCount,
        rejectedAppointments: rejectedCount,
        totalAppointments: totalCount,
        totalEarnings: totalEarnings
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
