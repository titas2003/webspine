const Advocate = require('../../models/Advocates');
const { sendVerificationSubmittedMail } = require('../../utils/mailer');

/**
 * @desc  Helper: Update a single field on the Advocate document
 */
const updateAdvField = async (advId, fieldPath, value, res) => {
  const update = {};
  update[fieldPath] = value;

  const advocate = await Advocate.findOneAndUpdate(
    { advId },
    { $set: update },
    { new: true, runValidators: true }
  );

  if (!advocate) {
    return res.status(404).json({ success: false, message: 'Advocate not found' });
  }

  const label = fieldPath.split('.').pop();
  return res.status(200).json({
    success: true,
    message: `${label} updated successfully`,
    data: value
  });
};

// ---------------------------------------------------------
// @desc    Upload PAN Image
// @route   PATCH /api/advocate/verify/pan
// @body    panNumber (optional text field alongside file)
// ---------------------------------------------------------
exports.uploadPan = async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

  const { panNumber } = req.body;
  const advId = req.user.advId;
  const updates = { 'verificationDocs.panImage': req.file.path };

  if (panNumber) {
    const clean = panNumber.trim().toUpperCase();
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(clean)) {
      return res.status(400).json({ success: false, message: 'Invalid PAN format' });
    }
    updates.panNumber = clean;
  }

  const advocate = await Advocate.findOneAndUpdate(
    { advId },
    { $set: updates },
    { new: true, runValidators: true }
  );

  if (!advocate) return res.status(404).json({ success: false, message: 'Advocate not found' });

  res.status(200).json({
    success: true,
    message: 'PAN image uploaded successfully',
    data: { panImage: req.file.path, panNumber: advocate.panNumber || null }
  });

  sendVerificationSubmittedMail(advocate.email, advocate.name, 'PAN Card');
};

// ---------------------------------------------------------
// @desc    Upload Aadhar Image
// @route   PATCH /api/advocate/verify/aadhar
// @body    aadharNumber (optional text field alongside file)
// ---------------------------------------------------------
exports.uploadAadhar = async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

  const { aadharNumber } = req.body;
  const advId = req.user.advId;
  const updates = { 'verificationDocs.aadharImage': req.file.path };

  if (aadharNumber) {
    const clean = aadharNumber.trim();
    if (!/^[0-9]{12}$/.test(clean)) {
      return res.status(400).json({ success: false, message: 'Invalid Aadhar format (must be 12 digits)' });
    }
    updates.aadharNumber = clean;
  }

  const advocate = await Advocate.findOneAndUpdate(
    { advId },
    { $set: updates },
    { new: true, runValidators: true }
  );

  if (!advocate) return res.status(404).json({ success: false, message: 'Advocate not found' });

  res.status(200).json({
    success: true,
    message: 'Aadhar image uploaded successfully',
    data: { aadharImage: req.file.path, aadharNumber: advocate.aadharNumber || null }
  });

  sendVerificationSubmittedMail(advocate.email, advocate.name, 'Aadhar Card');
};

// ---------------------------------------------------------
// @desc    Upload Enrollment Certificate
// @route   PATCH /api/advocate/verify/enrollment
// @body    enrollmentNumber OR barId (at least one required alongside file)
// ---------------------------------------------------------
exports.uploadEnrollmentCertificate = async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

  const { enrollmentNumber, barId } = req.body;
  const advId = req.user.advId;

  if (!enrollmentNumber && !barId) {
    return res.status(400).json({
      success: false,
      message: 'Please provide either Enrollment Number or State BAR ID along with the certificate'
    });
  }

  const updates = { 'verificationDocs.enrollmentCertificate': req.file.path };
  if (enrollmentNumber) updates.enrollmentNumber = enrollmentNumber.trim();
  if (barId) updates.barId = barId.trim();

  const advocate = await Advocate.findOneAndUpdate(
    { advId },
    { $set: updates },
    { new: true, runValidators: true }
  );

  if (!advocate) return res.status(404).json({ success: false, message: 'Advocate not found' });

  res.status(200).json({
    success: true,
    message: 'Enrollment Certificate uploaded successfully',
    data: {
      enrollmentCertificate: req.file.path,
      enrollmentNumber: advocate.enrollmentNumber || null,
      barId: advocate.barId || null
    }
  });

  sendVerificationSubmittedMail(advocate.email, advocate.name, 'Enrollment Certificate');
};

// ---------------------------------------------------------
// @desc    Upload Self Photo
// @route   PATCH /api/advocate/verify/photo
// ---------------------------------------------------------
exports.uploadPhoto = async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
  sendVerificationSubmittedMail(req.user.email, req.user.name, 'Profile Photo');
  await updateAdvField(req.user.advId, 'photo', req.file.path, res);
};

// ---------------------------------------------------------
// @desc    Upload Self Video
// @route   PATCH /api/advocate/verify/video
// ---------------------------------------------------------
exports.uploadVideo = async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
  sendVerificationSubmittedMail(req.user.email, req.user.name, 'Verification Video');
  await updateAdvField(req.user.advId, 'verificationDocs.videoUrl', req.file.path, res);
};
