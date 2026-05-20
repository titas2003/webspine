const Advocates = require('../../models/Advocates');
const Appointment = require('../../models/Appointment');

/**
 * @desc    Get all advocates (paginated)
 * @route   GET /api/admin/advocates
 * @access  Protected (Admin only)
 */
exports.getAllAdvocates = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;

    const query = {};
    
    // Optional search by name, email, phone, advId
    if (req.query.search) {
      query.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } },
        { phone: { $regex: req.query.search, $options: 'i' } },
        { advId: { $regex: req.query.search, $options: 'i' } }
      ];
    }
    
    // Optional filter by vStatus
    if (req.query.status) {
      query.vStatus = req.query.status;
    }

    const total = await Advocates.countDocuments(query);
    const advocates = await Advocates.find(query)
      .select('-password -tokens')
      .populate('courtDivision', 'name')
      .populate('specialization', 'name')
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit);

    res.status(200).json({
      success: true,
      count: advocates.length,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      },
      data: advocates
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Update advocate details or status (block/unblock)
 * @route   PATCH /api/admin/advocates/:advId
 * @access  Protected (Admin only)
 */
exports.updateAdvocate = async (req, res) => {
  try {
    const { name, phone, state, vStatus, isBlocked } = req.body;

    // Use findOne to match the custom advId string instead of MongoDB _id
    const advocate = await Advocates.findOne({ advId: req.params.advId });
    if (!advocate) {
      return res.status(404).json({ success: false, message: 'Advocate not found' });
    }

    if (name !== undefined) advocate.name = name;
    if (phone !== undefined) advocate.phone = phone;
    if (state !== undefined) advocate.state = state;
    if (vStatus !== undefined) advocate.vStatus = vStatus;
    
    if (isBlocked !== undefined) {
      advocate.isBlocked = isBlocked;
    }

    await advocate.save();

    res.status(200).json({
      success: true,
      message: 'Advocate updated successfully',
      data: advocate
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
