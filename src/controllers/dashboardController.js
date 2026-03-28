const Appointment = require('../models/Appointment'); // Assuming you have an Appointment model
const Advocate = require('../models/Advocates');
const Availability = require('../models/Availability');

// @desc    Get Advocate Dashboard Stats & Recent Activity
// @route   GET /api/dashboard/stats
exports.getDashboardStats = async (req, res) => {
  try {
    const advocateId = req.advocate.id;

    // 1. Get Total Appointments Count
    const totalAppointments = await Appointment.countDocuments({ advocateId });

    // 2. Get Pending/Upcoming Appointments
    const upcomingAppointments = await Appointment.find({ 
      advocateId, 
      status: 'scheduled',
      date: { $gte: new Date() } 
    })
    .sort({ date: 1, startTime: 1 })
    .limit(5)
    .populate('clientId', 'fullName email'); // Assuming a Client model exists

    // 3. Get total Active Slots (Availability)
    const activeSlots = await Availability.countDocuments({ advocateId });

    // 4. Calculate "New Clients" (e.g., booked in the last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const newClientsCount = await Appointment.distinct('clientId', {
      advocateId,
      createdAt: { $gte: thirtyDaysAgo }
    });

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalAppointments,
          upcomingCount: upcomingAppointments.length,
          activeSlots,
          newClients: newClientsCount.length
        },
        recentAppointments: upcomingAppointments
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};