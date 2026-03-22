const Availability = require('../models/Availability');

exports.setAvailability = async (req, res) => {
  try {
    const { schedules } = req.body; // Array of {dayOfWeek, startTime, endTime}
    
    // Clear old schedule and replace with new one (Simplest approach)
    await Availability.deleteMany({ advocateId: req.advocate.id });
    
    const newSchedules = schedules.map(s => ({
      ...s,
      advocateId: req.advocate.id
    }));

    const saved = await Availability.insertMany(newSchedules);
    res.status(200).json({ success: true, data: saved });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};