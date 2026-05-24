const cron = require('node-cron');
const Appointment = require('../models/Appointment');
const AvailabilitySlot = require('../models/AvailabilitySlot');

// Run every hour
cron.schedule('0 * * * *', async () => {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Find appointments that have been awaiting_payment for more than 24 hours
    // Assuming 'updatedAt' is when the advocate accepted it
    const expiredAppointments = await Appointment.find({
      status: 'awaiting_payment',
      updatedAt: { $lt: twentyFourHoursAgo }
    });

    if (expiredAppointments.length === 0) return;

    console.log(`Cron: Found ${expiredAppointments.length} expired awaiting_payment appointments. Cancelling...`);

    for (const appt of expiredAppointments) {
      appt.status = 'cancelled';
      appt.rejectionReason = 'Payment timeout (24 hours)';
      await appt.save();

      // Free up the slot
      if (appt.slotId) {
        await AvailabilitySlot.findByIdAndUpdate(appt.slotId, {
          status: 'available',
          appointmentId: null
        });
      }
    }

    console.log(`Cron: Successfully cancelled ${expiredAppointments.length} unpaid appointments.`);
  } catch (err) {
    console.error('Cron Error in auto-cancellation:', err);
  }
});

console.log('Cron jobs initialized');
