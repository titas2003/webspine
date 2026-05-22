const User = require('../../models/User');
const Appointment = require('../../models/Appointment');

/**
 * @desc    Get all clients (paginated)
 * @route   GET /api/admin/clients
 * @access  Protected (Admin only)
 */
exports.getAllClients = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;

    const query = {};
    
    // Optional search by name, email, phone
    if (req.query.search) {
      query.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } },
        { phone: { $regex: req.query.search, $options: 'i' } },
        { clientId: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    if (req.query.status) {
      query.vStatus = req.query.status;
    }

    const total = await User.countDocuments(query);
    const clients = await User.find(query)
      .select('-password -tokens')
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit);

    res.status(200).json({
      success: true,
      count: clients.length,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      },
      data: clients
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get single client with appointment history
 * @route   GET /api/admin/clients/:id
 * @access  Protected (Admin only)
 */
exports.getClientById = async (req, res) => {
  try {
    const client = await User.findById(req.params.id).select('-password -tokens');
    
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }

    // Fetch appointment history
    const appointments = await Appointment.find({ clientId: client._id })
      .populate('advocateId', 'name email phone specialization')
      .sort({ createdAt: -1 })
      .limit(20);

    res.status(200).json({
      success: true,
      data: {
        client,
        appointments
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Update client details or status (block/unblock)
 * @route   PATCH /api/admin/clients/:id
 * @access  Protected (Admin only)
 */
exports.updateClient = async (req, res) => {
  try {
    const { name, phone, state, isBlocked } = req.body;

    const client = await User.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }

    if (name !== undefined) client.name = name;
    if (phone !== undefined) client.phone = phone;
    if (state !== undefined) client.state = state;
    
    // Add logic if we later introduce a true 'isBlocked' field in User schema, 
    // for now we just handle profile updates. Let's assume User has it or we can set it.
    if (isBlocked !== undefined) {
      client.isBlocked = isBlocked;
    }

    await client.save();

    res.status(200).json({
      success: true,
      message: 'Client updated successfully',
      data: client
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
