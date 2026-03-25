const Advocate = require('../models/Advocates');
const Availability = require('../models/Availability'); // 1. Import the Availability model

// @desc    Search advocates by city and area (Public)
// @route   GET /api/advocates/search
exports.searchAdvocates = async (req, res) => {
  try {
    const { city, area, specialization } = req.query;
    let query = { isActive: true };

    if (city) query.city = new RegExp(city, 'i');
    if (area) query.area = new RegExp(area, 'i');
    if (specialization) query.specialization = specialization;

    const advocates = await Advocate.find(query)
      .select('fullName specialization city area profileImage experienceYears bio')
      .lean();

    res.status(200).json({
      success: true,
      count: advocates.length,
      data: advocates
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching advocates" });
  }
};

// @desc    Get current advocate profile AND their availability (Private)
// @route   GET /api/advocates/me
exports.getMe = async (req, res) => {
  try {
    // 2. Fetch the advocate profile
    // req.advocate.id is provided by your protect middleware
    const advocate = await Advocate.findById(req.advocate.id).lean();

    if (!advocate) {
      return res.status(404).json({ success: false, message: 'Advocate not found' });
    }

    // 3. Fetch the availability schedules for THIS advocate
    const schedules = await Availability.find({ advocateId: req.advocate.id });

    // 4. Combine them into a single response
    res.status(200).json({ 
      success: true, 
      data: {
        ...advocate,
        schedules // This sends the array of slots back to the frontend
      } 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};