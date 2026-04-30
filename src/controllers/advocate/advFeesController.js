const Advocate = require('../../models/Advocates');
const { findPolicyForExperience } = require('../admin/feePolicyController');

// ---------------------------------------------------------------------------
// @desc    Get advocate's current fee info + bracket details
// @route   GET /api/advocate/fees
// @access  Protected (advocate)
// ---------------------------------------------------------------------------
exports.getFees = async (req, res) => {
  try {
    const advocate = await Advocate.findById(req.user._id).select('feesPerSitting yearsOfExperience');
    if (!advocate) return res.status(404).json({ success: false, message: 'Advocate not found' });

    const policy = await findPolicyForExperience(advocate.yearsOfExperience || 0);

    res.status(200).json({
      success: true,
      data: {
        feesPerSitting: advocate.feesPerSitting,
        yearsOfExperience: advocate.yearsOfExperience,
        bracket: policy ? {
          bracketKey: policy.bracketKey,
          defaultFee: policy.defaultFee,
          maxFee: policy.maxFee
        } : null
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------------------------------------------------------------------
// @desc    Update advocate's fees (and optionally years of experience)
// @route   PATCH /api/advocate/fees
// @body    { feesPerSitting?, yearsOfExperience? }
// @access  Protected (advocate)
//
// Rules:
//  - feesPerSitting must be >= ₹1 and <= bracket maxFee
//  - If yearsOfExperience changes → bracket changes → fee resets to new bracket's defaultFee
//    (Option B: always reset to default on bracket change)
// ---------------------------------------------------------------------------
exports.updateFees = async (req, res) => {
  try {
    const { feesPerSitting, yearsOfExperience } = req.body;

    if (feesPerSitting === undefined && yearsOfExperience === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Provide at least one of: feesPerSitting, yearsOfExperience'
      });
    }

    const advocate = await Advocate.findById(req.user._id);
    if (!advocate) return res.status(404).json({ success: false, message: 'Advocate not found' });

    let targetYears = yearsOfExperience !== undefined ? yearsOfExperience : advocate.yearsOfExperience;

    // Look up the bracket for the target experience
    const policy = await findPolicyForExperience(targetYears);
    if (!policy) {
      return res.status(400).json({
        success: false,
        message: 'No fee policy found for the given years of experience. Contact admin.'
      });
    }

    const bracketChanged =
      yearsOfExperience !== undefined &&
      yearsOfExperience !== advocate.yearsOfExperience;

    let newFee;

    if (bracketChanged) {
      // Option B: bracket changed → always reset to new bracket's default fee
      newFee = policy.defaultFee;
    } else if (feesPerSitting !== undefined) {
      // Same bracket, advocate is manually setting fee
      if (feesPerSitting < 1) {
        return res.status(400).json({ success: false, message: 'Fees must be at least ₹1' });
      }
      if (feesPerSitting > policy.maxFee) {
        return res.status(400).json({
          success: false,
          message: `Fees cannot exceed ₹${policy.maxFee} for your experience bracket (${policy.bracketKey} years)`
        });
      }
      newFee = feesPerSitting;
    } else {
      newFee = advocate.feesPerSitting;
    }

    advocate.yearsOfExperience = targetYears;
    advocate.feesPerSitting = newFee;
    await advocate.save();

    res.status(200).json({
      success: true,
      message: bracketChanged
        ? `Experience bracket updated to '${policy.bracketKey}'. Fee reset to default ₹${newFee}.`
        : 'Fees updated successfully',
      data: {
        feesPerSitting: newFee,
        yearsOfExperience: targetYears,
        bracket: {
          bracketKey: policy.bracketKey,
          maxFee: policy.maxFee
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
