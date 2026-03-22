const Advocate = require('../models/Advocates');

// @desc    Search advocates by city and area (Public)
// @route   GET /api/advocates/search
exports.searchAdvocates = async (req, res) => {
  try {
    const { city, area, specialization } = req.query;
    let query = { isActive: true }; // Only show active advocates

    if (city) query.city = new RegExp(city, 'i'); // Case-insensitive
    if (area) query.area = new RegExp(area, 'i');
    if (specialization) query.specialization = specialization;

    const advocates = await Advocate.find(query)
      .select('fullName specialization city area profileImage experienceYears bio') // Don't send sensitive data
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

// @desc    Get current advocate profile (Private)
// @route   GET /api/advocates/me
exports.getMe = async (req, res) => {
  try {
    // req.advocate is set by your 'protect' middleware
    const advocate = await Advocate.findById(req.advocate.id);
    res.status(200).json({ success: true, data: advocate });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};