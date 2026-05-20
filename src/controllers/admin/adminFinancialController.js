const Transaction = require('../../models/Transaction');

/**
 * @desc    Get all financial transactions with full details
 * @route   GET /api/admin/financials/transactions
 * @access  Protected (Admin only)
 */
exports.getAllTransactions = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;

    const total = await Transaction.countDocuments();
    const transactions = await Transaction.find()
      .populate('appointmentId', 'status date startTime meetingType meetingLink meetingAddress')
      .populate('advocateId', 'name email phone advId')
      .populate('clientId', 'name email phone')
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit);

    res.status(200).json({
      success: true,
      count: transactions.length,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      },
      data: transactions
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
