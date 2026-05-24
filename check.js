require('dotenv').config();
const mongoose = require('mongoose');
const AvailabilitySlot = require('./src/models/AvailabilitySlot');
const Appointment = require('./src/models/Appointment');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  console.log('Connected to DB');
  const slots = await AvailabilitySlot.find({});
  console.log('Total slots:', slots.length);
  const availableSlots = slots.filter(s => s.status === 'available');
  console.log('Available slots:', availableSlots.length);
  
  if (availableSlots.length > 0) {
      console.log('Sample available slot:', availableSlots[0]);
  }

  const appointments = await Appointment.find({}).sort({createdAt: -1}).limit(5);
  console.log('Recent appointments:', appointments.map(a => ({
      id: a._id, status: a.status, slotId: a.slotId
  })));

  process.exit(0);
});
