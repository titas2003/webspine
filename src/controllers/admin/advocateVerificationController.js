const Advocate = require('../../models/Advocates');
const { sendVerificationStatusMail } = require('../../utils/mailer');

// ---------------------------------------------------------------------------
// @desc    Verify or reject an advocate (update vStatus with reason)
// @route   PATCH /api/admin/advocates/:advId/verify
// @body    { vStatus: 'Verified' | 'Rejected', reason: '...' }
// @access  Protected (admin)
// ---------------------------------------------------------------------------
exports.verifyAdvocate = async (req, res) => {
  try {
    const { advId } = req.params;
    const { vStatus, reason } = req.body;

    // 1. Validate vStatus
    if (!vStatus || !['Verified', 'Rejected'].includes(vStatus)) {
      return res.status(400).json({
        success: false,
        message: "vStatus must be either 'Verified' or 'Rejected'"
      });
    }

    // 2. Reason is mandatory for rejection
    if (vStatus === 'Rejected' && (!reason || !reason.trim())) {
      return res.status(400).json({
        success: false,
        message: 'A reason is required when rejecting an advocate'
      });
    }

    // 3. Find advocate by advId
    const advocate = await Advocate.findOne({ advId: advId.toUpperCase() });

    if (!advocate) {
      return res.status(404).json({
        success: false,
        message: `Advocate with ID '${advId}' not found`
      });
    }

    // 4. Prevent redundant updates
    if (advocate.vStatus === vStatus) {
      return res.status(400).json({
        success: false,
        message: `Advocate is already '${vStatus}'`
      });
    }

    // 5. Update advocate
    advocate.vStatus    = vStatus;
    advocate.vReason    = reason ? reason.trim() : (vStatus === 'Verified' ? 'Approved by admin' : null);
    advocate.vUpdatedBy = req.admin._id;
    await advocate.save();

    // 6. Notify advocate via email (fire-and-forget)
    sendVerificationStatusMail(
      advocate.email,
      advocate.name,
      'Account',           // docType — "Account Verification"
      vStatus,
      advocate.vReason
    );

    res.status(200).json({
      success: true,
      message: `Advocate ${advocate.advId} has been ${vStatus.toLowerCase()} successfully`,
      data: {
        advId: advocate.advId,
        name: advocate.name,
        email: advocate.email,
        vStatus: advocate.vStatus,
        vReason: advocate.vReason,
        updatedBy: req.admin.admId || req.admin._id
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------------------------------------------------------------------
// @desc    Get single advocate details (admin view — all fields)
// @route   GET /api/admin/advocates/:advId
// @access  Protected (admin)
// ---------------------------------------------------------------------------
exports.getAdvocateDetails = async (req, res) => {
  try {
    const { advId } = req.params;

    const advocate = await Advocate.findOne({ advId: advId.toUpperCase() })
      .select('-password')
      .populate('courtDivision', 'name slug')
      .populate('specialization', 'name slug')
      .populate('vUpdatedBy', 'admId name')
      .lean();

    if (!advocate) {
      return res.status(404).json({
        success: false,
        message: `Advocate with ID '${advId}' not found`
      });
    }

    res.status(200).json({ success: true, data: advocate });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
