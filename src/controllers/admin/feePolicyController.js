const FeePolicy = require('../../models/FeePolicy');

// ---------------------------------------------------------------------------
// HELPER: shared by signup controller and fees controller
// Returns the matching FeePolicy for a given yearsOfExperience
// ---------------------------------------------------------------------------
const findPolicyForExperience = async (years) => {
  const policies = await FeePolicy.find({ isActive: true }).sort({ minYears: 1 });
  return policies.find(p =>
    years >= p.minYears && (p.maxYears === null || years < p.maxYears)
  ) || null;
};

module.exports.findPolicyForExperience = findPolicyForExperience;

// ---------------------------------------------------------------------------
// DEFAULT SEED DATA
// ---------------------------------------------------------------------------
const DEFAULT_POLICIES = [
  { bracketKey: '1-3',  minYears: 1,  maxYears: 3,    defaultFee: 300,  maxFee: 900  },
  { bracketKey: '3-6',  minYears: 3,  maxYears: 6,    defaultFee: 700,  maxFee: 1000 },
  { bracketKey: '6-11', minYears: 6,  maxYears: 11,   defaultFee: 1500, maxFee: 1800 },
  { bracketKey: '11+',  minYears: 11, maxYears: null,  defaultFee: 4000, maxFee: 4500 }
];

// ---------------------------------------------------------------------------
// @desc    Seed default fee policies (one-time / idempotent)
// @route   POST /api/admin/fee-policies/seed
// @access  Protected (admin)
// ---------------------------------------------------------------------------
exports.seedDefaultPolicies = async (req, res) => {
  try {
    const results = [];
    for (const policy of DEFAULT_POLICIES) {
      const doc = await FeePolicy.findOneAndUpdate(
        { bracketKey: policy.bracketKey },
        { $setOnInsert: policy },
        { upsert: true, new: true, returnDocument: 'after' }
      );
      results.push(doc);
    }
    res.status(200).json({
      success: true,
      message: 'Default fee policies seeded successfully',
      data: results
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------------------------------------------------------------------
// @desc    Get all fee policies
// @route   GET /api/admin/fee-policies
// @access  Protected (admin)
// ---------------------------------------------------------------------------
exports.getAllPolicies = async (req, res) => {
  try {
    const policies = await FeePolicy.find().sort({ minYears: 1 });
    res.status(200).json({ success: true, count: policies.length, data: policies });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------------------------------------------------------------------
// @desc    Upsert (create or update) a fee policy bracket
// @route   PUT /api/admin/fee-policies/:bracketKey
// @body    { defaultFee, maxFee, minYears?, maxYears?, isActive? }
// @access  Protected (admin)
// ---------------------------------------------------------------------------
exports.upsertPolicy = async (req, res) => {
  try {
    const { bracketKey } = req.params;
    const { defaultFee, maxFee, minYears, maxYears, isActive } = req.body;

    // Validate bracketKey
    if (!['1-3', '3-6', '6-11', '11+'].includes(bracketKey)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid bracketKey. Must be one of: 1-3, 3-6, 6-11, 11+'
      });
    }

    // Validate defaultFee <= maxFee
    if (defaultFee !== undefined && maxFee !== undefined && defaultFee > maxFee) {
      return res.status(400).json({
        success: false,
        message: 'defaultFee cannot be greater than maxFee'
      });
    }

    const updates = {};
    if (defaultFee !== undefined) updates.defaultFee = defaultFee;
    if (maxFee !== undefined)     updates.maxFee     = maxFee;
    if (minYears !== undefined)   updates.minYears   = minYears;
    if (maxYears !== undefined)   updates.maxYears   = maxYears;
    if (isActive !== undefined)   updates.isActive   = isActive;

    const policy = await FeePolicy.findOneAndUpdate(
      { bracketKey },
      { $set: updates },
      { new: true, upsert: false, runValidators: true }
    );

    if (!policy) {
      return res.status(404).json({
        success: false,
        message: `Bracket '${bracketKey}' not found. Run /api/admin/fee-policies/seed first.`
      });
    }

    res.status(200).json({ success: true, message: 'Fee policy updated', data: policy });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
