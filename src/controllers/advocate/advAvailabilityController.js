const AvailabilitySlot = require('../../models/AvailabilitySlot');
const Appointment = require('../../models/Appointment');
const User = require('../../models/User');
const { sendBookingResponseMail, sendMeetingScheduledMail } = require('../../utils/mailer');

// ---------------------------------------------------------------------------
// HELPER: Generate a UUID-like group ID for recurring slots
// ---------------------------------------------------------------------------
const generateGroupId = () => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
};

// ---------------------------------------------------------------------------
// HELPER: Build date list for recurrence
// Returns array of Date objects between startDate and recurrenceEnd
// ---------------------------------------------------------------------------
const buildRecurrenceDates = (startDate, recurrenceEnd, recurrence) => {
  const dates = [];
  const current = new Date(startDate);
  const end = new Date(recurrenceEnd);

  while (current <= end) {
    dates.push(new Date(current));
    if (recurrence === 'weekly') {
      current.setDate(current.getDate() + 7);
    } else if (recurrence === 'monthly') {
      current.setMonth(current.getMonth() + 1);
    } else {
      break; // 'none' — only one slot
    }
  }
  return dates;
};

// ---------------------------------------------------------------------------
// @desc    Set Availability
// @route   POST /api/advocate/availability
// @body    { date, startTime, endTime, recurrence, recurrenceEnd }
//          recurrence: 'none' | 'weekly' | 'monthly'
//          recurrenceEnd: required when recurrence !== 'none'
// ---------------------------------------------------------------------------
exports.setAvailability = async (req, res) => {
  try {
    const { date, startTime, endTime, recurrence = 'none', recurrenceEnd } = req.body;

    if (!date || !startTime || !endTime) {
      return res.status(400).json({ success: false, message: 'date, startTime, and endTime are required' });
    }

    if (recurrence !== 'none' && !recurrenceEnd) {
      return res.status(400).json({ success: false, message: 'recurrenceEnd is required for recurring slots' });
    }

    const recurrenceEndDate = recurrence !== 'none' ? new Date(recurrenceEnd) : new Date(date);
    const dates = buildRecurrenceDates(new Date(date), recurrenceEndDate, recurrence);

    const groupId = recurrence !== 'none' ? generateGroupId() : null;

    const slotDocs = dates.map(d => ({
      advocateId: req.user._id,
      advId: req.user.advId,
      date: d,
      startTime,
      endTime,
      recurrence,
      recurrenceGroupId: groupId,
      status: 'available'
    }));

    const created = await AvailabilitySlot.insertMany(slotDocs);

    res.status(201).json({
      success: true,
      message: `${created.length} slot(s) created successfully`,
      data: created
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------------------------------------------------------------------
// @desc    List My Availability Slots
// @route   GET /api/advocate/availability
// @query   status (optional: available|booked|blocked), from, to (ISO dates)
// ---------------------------------------------------------------------------
exports.listAvailability = async (req, res) => {
  try {
    const { status, from, to } = req.query;

    const filter = { advId: req.user.advId };
    if (status) filter.status = status;
    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = new Date(from);
      if (to) filter.date.$lte = new Date(to);
    }

    const slots = await AvailabilitySlot.find(filter).sort({ date: 1, startTime: 1 });

    res.status(200).json({ success: true, count: slots.length, data: slots });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------------------------------------------------------------------
// @desc    Alter (Update) a Specific Slot
// @route   PATCH /api/advocate/availability/:id
// @body    { date, startTime, endTime, status }  — any combination
// ---------------------------------------------------------------------------
exports.alterSlot = async (req, res) => {
  try {
    const { date, startTime, endTime, status } = req.body;

    // Guard: Cannot alter a booked slot's time
    const slot = await AvailabilitySlot.findOne({ _id: req.params.id, advId: req.user.advId });
    if (!slot) return res.status(404).json({ success: false, message: 'Slot not found' });

    if (slot.status === 'booked' && (date || startTime || endTime)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot change time of a booked slot. Cancel the appointment first.'
      });
    }

    const updates = {};
    if (date) updates.date = new Date(date);
    if (startTime) updates.startTime = startTime;
    if (endTime) updates.endTime = endTime;
    if (status) updates.status = status;

    const updated = await AvailabilitySlot.findByIdAndUpdate(slot._id, updates, { new: true, runValidators: true });

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------------------------------------------------------------------
// @desc    Delete (Remove) a Specific Slot
// @route   DELETE /api/advocate/availability/:id
// ---------------------------------------------------------------------------
exports.deleteSlot = async (req, res) => {
  try {
    const slot = await AvailabilitySlot.findOne({ _id: req.params.id, advId: req.user.advId });
    if (!slot) return res.status(404).json({ success: false, message: 'Slot not found' });

    if (slot.status === 'booked') {
      return res.status(400).json({ success: false, message: 'Cannot delete a booked slot. Cancel the appointment first.' });
    }

    await slot.deleteOne();
    res.status(200).json({ success: true, message: 'Slot removed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------------------------------------------------------------------
// @desc    List Pending Booking Requests
// @route   GET /api/advocate/appointments/requests
// ---------------------------------------------------------------------------
exports.listBookingRequests = async (req, res) => {
  try {
    const requests = await Appointment.find({
      advocateId: req.user._id,
      status: 'pending'
    })
      .populate('clientId', 'name email phone clientId')
      .populate('slotId', 'date startTime endTime')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: requests.length, data: requests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------------------------------------------------------------------
// @desc    Accept or Reject a Booking Request
// @route   PATCH /api/advocate/appointments/:id/respond
// @body    { action: 'accept' | 'reject', rejectionReason? }
// ---------------------------------------------------------------------------
exports.respondToBooking = async (req, res) => {
  try {
    const { action, rejectionReason } = req.body;

    if (!['accept', 'reject'].includes(action)) {
      return res.status(400).json({ success: false, message: 'action must be "accept" or "reject"' });
    }

    const appointment = await Appointment.findOne({ _id: req.params.id, advocateId: req.user._id });
    if (!appointment) return res.status(404).json({ success: false, message: 'Appointment not found' });

    if (appointment.status !== 'pending') {
      return res.status(400).json({ success: false, message: `Appointment is already ${appointment.status}` });
    }

    if (action === 'accept') {
      appointment.status = 'accepted';
    } else {
      appointment.status = 'rejected';
      appointment.rejectionReason = rejectionReason || null;

      // Free up the slot when rejected
      await AvailabilitySlot.findByIdAndUpdate(appointment.slotId, {
        status: 'available',
        appointmentId: null
      });
    }

    await appointment.save();

    // Notify client of advocate's decision
    const slot = await AvailabilitySlot.findById(appointment.slotId).select('date startTime endTime');
    const client = await User.findById(appointment.clientId).select('name email');
    if (client && slot) {
      sendBookingResponseMail(
        client.email, client.name,
        action === 'accept' ? 'accepted' : 'rejected',
        slot.date, slot.startTime, slot.endTime,
        rejectionReason || null
      );
    }

    res.status(200).json({
      success: true,
      message: `Appointment ${action}ed successfully`,
      data: appointment
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------------------------------------------------------------------
// @desc    Schedule Meeting (add link/address after accepting)
// @route   PATCH /api/advocate/appointments/:id/schedule
// @body    { meetingType: 'online'|'in-person', meetingLink?, meetingAddress? }
// ---------------------------------------------------------------------------
exports.scheduleMeeting = async (req, res) => {
  try {
    const { meetingType, meetingLink, meetingAddress } = req.body;

    if (!meetingType) {
      return res.status(400).json({ success: false, message: 'meetingType is required' });
    }
    if (meetingType === 'online' && !meetingLink) {
      return res.status(400).json({ success: false, message: 'meetingLink is required for online meetings' });
    }
    if (meetingType === 'in-person' && !meetingAddress) {
      return res.status(400).json({ success: false, message: 'meetingAddress is required for in-person meetings' });
    }

    const appointment = await Appointment.findOne({ _id: req.params.id, advocateId: req.user._id });
    if (!appointment) return res.status(404).json({ success: false, message: 'Appointment not found' });

    if (appointment.status !== 'accepted') {
      return res.status(400).json({ success: false, message: 'Can only schedule meetings for accepted appointments' });
    }

    appointment.meetingType = meetingType;
    appointment.meetingLink = meetingLink || null;
    appointment.meetingAddress = meetingAddress || null;
    await appointment.save();

    // Notify client of meeting details
    const slot = await AvailabilitySlot.findById(appointment.slotId).select('date startTime endTime');
    const client = await User.findById(appointment.clientId).select('name email');
    if (client && slot) {
      sendMeetingScheduledMail(
        client.email, client.name,
        meetingType, slot.date, slot.startTime, slot.endTime,
        meetingLink || null, meetingAddress || null
      );
    }

    res.status(200).json({ success: true, message: 'Meeting details saved', data: appointment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------------------------------------------------------------------
// @desc    List Upcoming Appointments (accepted, future)
// @route   GET /api/advocate/appointments/upcoming
// ---------------------------------------------------------------------------
exports.listUpcomingAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({
      advocateId: req.user._id,
      status: 'accepted',
      scheduledAt: { $gte: new Date() }
    })
      .populate('clientId', 'name email phone clientId')
      .populate('slotId', 'date startTime endTime')
      .sort({ scheduledAt: 1 });

    res.status(200).json({ success: true, count: appointments.length, data: appointments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------------------------------------------------------------------
// @desc    List Past Appointments
// @route   GET /api/advocate/appointments/past
// ---------------------------------------------------------------------------
exports.listPastAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({
      advocateId: req.user._id,
      scheduledAt: { $lt: new Date() }
    })
      .populate('clientId', 'name email phone clientId')
      .populate('slotId', 'date startTime endTime')
      .sort({ scheduledAt: -1 });

    res.status(200).json({ success: true, count: appointments.length, data: appointments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
