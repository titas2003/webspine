const Appointment = require('../models/Appointment');

// @desc    Get all appointments for the logged-in advocate
// @route   GET /api/appointments
exports.getAppointments = async (req, res) => {
  try {
    // req.advocate.id comes from your protect middleware
    const appointments = await Appointment.find({ advocateId: req.advocate.id })
                                          .sort({ date: 1 });
    res.status(200).json({ success: true, count: appointments.length, data: appointments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a new appointment
// @route   POST /api/appointments
exports.createAppointment = async (req, res) => {
  try {
    const { clientName, caseType, date, time, meetingLink } = req.body;
    
    const appointment = await Appointment.create({
      advocateId: req.advocate.id,
      clientName,
      caseType,
      date,
      time,
      meetingLink
    });

    res.status(201).json({ success: true, data: appointment });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};