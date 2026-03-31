const Appointment = require('../models/Appointment');
const Availability = require('../models/Availability');

// @desc    Get appointments for the logged-in advocate (with optional status filter)
// @route   GET /api/appointments
exports.getAppointments = async (req, res) => {
  try {
    const { status } = req.query; // Allows ?status=Accepted
    const query = { advocateId: req.advocate.id };
    
    if (status) {
      query.status = status;
    }

    const appointments = await Appointment.find(query).sort({ date: 1, time: 1 });
    
    res.status(200).json({ 
      success: true, 
      count: appointments.length, 
      data: appointments 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a new appointment request (Public/Client API)
// @route   POST /api/appointments/request
exports.createAppointmentRequest = async (req, res) => {
  try {
    const { advocateId, clientName, caseType, date, time } = req.body;
    
    const appointment = await Appointment.create({
      advocateId,
      clientName,
      caseType,
      date,
      time,
      status: 'Pending' // Initial state for new requests
    });

    res.status(201).json({ success: true, data: appointment });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Update appointment status (Accept/Reject/Complete)
// @route   PATCH /api/appointments/:id/status
exports.updateAppointmentStatus = async (req, res) => {
  try {
    const { status, meetingLink } = req.body;
    const appointment = await Appointment.findOneAndUpdate(
      { _id: req.params.id, advocateId: req.advocate.id },
      { status, meetingLink },
      { new: true, runValidators: true }
    );

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    res.status(200).json({ success: true, data: appointment });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getSyncedCalendar = async (req, res) => {
  try {
    const { date } = req.params; // Format: YYYY-MM-DD
    const advocateId = req.advocate.id;

    // 1. Fetch all "Set" availability for this advocate
    const availability = await Availability.findOne({ advocateId });
    
    // 2. Fetch all "Accepted" appointments for this specific date
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const bookings = await Appointment.find({
      advocateId,
      status: 'Accepted',
      date: { $gte: startOfDay, $lte: endOfDay }
    });

    // 3. Logic: Mark slots as "Booked" if they exist in the Appointment collection
    const bookedTimes = bookings.map(b => b.time); // e.g. ["10:00 AM", "02:00 PM"]

    res.status(200).json({
      success: true,
      date,
      bookedTimes,
      allAvailableSlots: availability ? availability.slots : []
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
