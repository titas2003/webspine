const AvailabilitySlot = require('../../models/AvailabilitySlot');
const Appointment = require('../../models/Appointment');
const Advocate = require('../../models/Advocates');
const { sendBookingConfirmationMail, sendNewBookingRequestMail } = require('../../utils/mailer');

// ---------------------------------------------------------------------------
// HELPER: Combine a Date and "HH:MM" string into a single JS Date
// ---------------------------------------------------------------------------
const combineDateTime = (date, timeStr) => {
  const d = new Date(date);
  const [hours, minutes] = timeStr.split(':').map(Number);
  d.setHours(hours, minutes, 0, 0);
  return d;
};

// ---------------------------------------------------------------------------
// @desc    Get Available Slots of an Advocate
// @route   GET /api/user/advocates/:advId/slots
// @query   from, to (ISO date strings — optional filter)
// ---------------------------------------------------------------------------
exports.getAdvocateSlots = async (req, res) => {
  try {
    const { advId } = req.params;
    const { from, to } = req.query;

    const advocate = await Advocate.findOne({ advId: advId.toUpperCase() });
    if (!advocate) {
      return res.status(404).json({ success: false, message: 'Advocate not found' });
    }

    const filter = {
      advId: advId.toUpperCase(),
      status: 'available',
      date: { $gte: new Date() } // Only future slots
    };

    if (from) filter.date.$gte = new Date(from);
    if (to) filter.date.$lte = new Date(to);

    const slots = await AvailabilitySlot.find(filter).sort({ date: 1, startTime: 1 });

    res.status(200).json({
      success: true,
      advocate: { advId: advocate.advId, name: advocate.name, state: advocate.state },
      count: slots.length,
      data: slots
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------------------------------------------------------------------
// @desc    Request a Booking
// @route   POST /api/user/appointments
// @body    { slotId, notes? }
// ---------------------------------------------------------------------------
exports.requestBooking = async (req, res) => {
  try {
    const { slotId, notes } = req.body;

    if (!slotId) {
      return res.status(400).json({ success: false, message: 'slotId is required' });
    }

    // 1. Check slot exists and is available
    const slot = await AvailabilitySlot.findById(slotId);
    if (!slot) return res.status(404).json({ success: false, message: 'Slot not found' });
    if (slot.status !== 'available') {
      return res.status(409).json({ success: false, message: 'This slot is no longer available' });
    }

    // 2. Create the appointment
    const scheduledAt = combineDateTime(slot.date, slot.startTime);

    const appointment = await Appointment.create({
      clientId: req.user._id,
      advocateId: slot.advocateId,
      slotId: slot._id,
      scheduledAt,
      notes: notes || null,
      status: 'pending'
    });

    // 3. Lock the slot immediately to prevent double-booking
    slot.status = 'booked';
    slot.appointmentId = appointment._id;
    await slot.save();

    // 4. Send notification emails (fire-and-forget)
    const advocate = await Advocate.findById(slot.advocateId).select('name email');
    sendBookingConfirmationMail(
      req.user.email, req.user.name,
      slot.date, slot.startTime, slot.endTime,
      advocate ? advocate.name : 'the Advocate'
    );
    if (advocate) {
      sendNewBookingRequestMail(
        advocate.email, advocate.name,
        req.user.name, slot.date, slot.startTime, slot.endTime
      );
    }

    res.status(201).json({
      success: true,
      message: 'Booking request sent successfully. Awaiting advocate confirmation.',
      data: appointment
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------------------------------------------------------------------
// @desc    Get Status of a Single Booking
// @route   GET /api/user/appointments/:id
// ---------------------------------------------------------------------------
exports.getBookingStatus = async (req, res) => {
  try {
    const appointment = await Appointment.findOne({ _id: req.params.id, clientId: req.user._id })
      .populate('advocateId', 'advId name email state')
      .populate('slotId', 'date startTime endTime');

    if (!appointment) return res.status(404).json({ success: false, message: 'Appointment not found' });

    res.status(200).json({ success: true, data: appointment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------------------------------------------------------------------
// @desc    List Upcoming Bookings (accepted, future)
// @route   GET /api/user/appointments/upcoming
// ---------------------------------------------------------------------------
exports.listUpcomingBookings = async (req, res) => {
  try {
    const appointments = await Appointment.find({
      clientId: req.user._id,
      status: 'accepted',
      scheduledAt: { $gte: new Date() }
    })
      .populate('advocateId', 'advId name email state')
      .populate('slotId', 'date startTime endTime')
      .sort({ scheduledAt: 1 });

    res.status(200).json({ success: true, count: appointments.length, data: appointments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------------------------------------------------------------------
// @desc    List Past Appointments
// @route   GET /api/user/appointments/past
// ---------------------------------------------------------------------------
exports.listPastAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({
      clientId: req.user._id,
      scheduledAt: { $lt: new Date() }
    })
      .populate('advocateId', 'advId name email state')
      .populate('slotId', 'date startTime endTime')
      .sort({ scheduledAt: -1 });

    res.status(200).json({ success: true, count: appointments.length, data: appointments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------------------------------------------------------------------
// @desc    Cancel a Booking Request
// @route   PATCH /api/user/appointments/:id/cancel
// ---------------------------------------------------------------------------
exports.cancelBooking = async (req, res) => {
  try {
    const appointment = await Appointment.findOne({ _id: req.params.id, clientId: req.user._id });
    if (!appointment) return res.status(404).json({ success: false, message: 'Appointment not found' });

    if (['cancelled', 'completed', 'rejected'].includes(appointment.status)) {
      return res.status(400).json({ success: false, message: `Appointment is already ${appointment.status}` });
    }

    // Free up the slot
    await AvailabilitySlot.findByIdAndUpdate(appointment.slotId, {
      status: 'available',
      appointmentId: null
    });

    appointment.status = 'cancelled';
    await appointment.save();

    res.status(200).json({ success: true, message: 'Appointment cancelled. The slot is now available again.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
