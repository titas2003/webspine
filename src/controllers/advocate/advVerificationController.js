const Advocate = require('../../models/Advocates');
const { sendVerificationSubmittedMail } = require('../../utils/mailer');
const fs = require('fs');

/**
 * Helper: Extract document data from advocate object
 */
const getDocData = (advocate, type) => {
  const docs = advocate.verificationDocs || {};
  switch (type) {
    case 'pan':        return { panImage: docs.panImage, panNumber: advocate.panNumber };
    case 'aadhar':     return { aadharImage: docs.aadharImage, aadharNumber: advocate.aadharNumber };
    case 'enrollment': return { enrollmentCertificate: docs.enrollmentCertificate, enrollmentNumber: advocate.enrollmentNumber, barId: advocate.barId };
    case 'photo':      return { photo: advocate.photo };
    case 'video':      return { videoUrl: docs.videoUrl };
    default:           return {};
  }
};

/**
 * Helper: Get path of existing document
 */
const getExistingPath = (advocate, type) => {
  const docs = advocate.verificationDocs || {};
  if (type === 'pan') return docs.panImage;
  if (type === 'aadhar') return docs.aadharImage;
  if (type === 'enrollment') return docs.enrollmentCertificate;
  if (type === 'photo') return advocate.photo;
  if (type === 'video') return docs.videoUrl;
  return null;
};

// =============================================================================
// GET APIs (Parallel status check)
// =============================================================================

exports.getVerificationStatus = async (req, res) => {
  try {
    const advocate = await Advocate.findOne({ advId: req.user.advId });
    if (!advocate) return res.status(404).json({ success: false, message: 'Advocate not found' });

    const type = req.params.type; // 'pan', 'aadhar', etc.
    const data = getDocData(advocate, type);

    res.status(200).json({
      success: true,
      vStatus: advocate.vStatus,
      data: Object.values(data).some(v => v) ? data : null
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// =============================================================================
// PATCH APIs (Initial Upload / Status Check)
// =============================================================================

const handleInitialUpload = async (req, res, type) => {
  const advId = req.user.advId;
  const advocate = await Advocate.findOne({ advId });
  if (!advocate) {
    if (req.file) fs.unlinkSync(req.file.path);
    return res.status(404).json({ success: false, message: 'Advocate not found' });
  }

  const existingPath = getExistingPath(advocate, type);

  // 1. If document already exists, reject PATCH upload
  if (existingPath) {
    if (req.file) fs.unlinkSync(req.file.path);
    return res.status(200).json({
      success: true,
      message: `${type.toUpperCase()} data is already uploaded. Use Edit/PUT to replace it.`,
      data: getDocData(advocate, type),
      vStatus: advocate.vStatus
    });
  }

  // 2. If no file, it's just a check (return null or data)
  if (!req.file) {
    return res.status(200).json({
      success: true,
      message: `No ${type.toUpperCase()} file found on record.`,
      data: null,
      vStatus: advocate.vStatus
    });
  }

  // 3. Process Initial Upload
  const updates = {};
  if (type === 'pan') {
    updates['verificationDocs.panImage'] = req.file.path;
    if (req.body.panNumber) updates.panNumber = req.body.panNumber.trim().toUpperCase();
  } else if (type === 'aadhar') {
    updates['verificationDocs.aadharImage'] = req.file.path;
    if (req.body.aadharNumber) updates.aadharNumber = req.body.aadharNumber.trim();
  } else if (type === 'enrollment') {
    updates['verificationDocs.enrollmentCertificate'] = req.file.path;
    if (req.body.enrollmentNumber) updates.enrollmentNumber = req.body.enrollmentNumber.trim();
    if (req.body.barId) updates.barId = req.body.barId.trim();
  } else if (type === 'photo') {
    updates.photo = req.file.path;
  } else if (type === 'video') {
    updates['verificationDocs.videoUrl'] = req.file.path;
  }

  const updated = await Advocate.findOneAndUpdate({ advId }, { $set: updates }, { new: true });
  sendVerificationSubmittedMail(updated.email, updated.name, type.toUpperCase());

  res.status(201).json({
    success: true,
    message: `${type.toUpperCase()} uploaded successfully`,
    data: getDocData(updated, type)
  });
};

exports.uploadPan = (req, res) => handleInitialUpload(req, res, 'pan');
exports.uploadAadhar = (req, res) => handleInitialUpload(req, res, 'aadhar');
exports.uploadEnrollmentCertificate = (req, res) => handleInitialUpload(req, res, 'enrollment');
exports.uploadPhoto = (req, res) => handleInitialUpload(req, res, 'photo');
exports.uploadVideo = (req, res) => handleInitialUpload(req, res, 'video');

// =============================================================================
// PUT APIs (Edit / Re-upload)
// =============================================================================

const handleEditUpload = async (req, res, type) => {
  const advId = req.user.advId;
  const advocate = await Advocate.findOne({ advId });
  if (!advocate) {
    if (req.file) fs.unlinkSync(req.file.path);
    return res.status(404).json({ success: false, message: 'Advocate not found' });
  }

  // 1. Lock if Verified
  if (advocate.vStatus === 'Verified') {
    if (req.file) fs.unlinkSync(req.file.path);
    return res.status(403).json({
      success: false,
      message: 'Cannot edit verified documents. Account is locked.'
    });
  }

  // 2. Must provide a file or some data to edit
  if (!req.file && Object.keys(req.body).length === 0) {
    return res.status(400).json({ success: false, message: 'Provide new file or data to update' });
  }

  const updates = {};
  const existingPath = getExistingPath(advocate, type);

  if (req.file) {
    // Delete old file
    if (existingPath && fs.existsSync(existingPath)) {
      fs.unlinkSync(existingPath);
    }
    
    if (type === 'pan') updates['verificationDocs.panImage'] = req.file.path;
    else if (type === 'aadhar') updates['verificationDocs.aadharImage'] = req.file.path;
    else if (type === 'enrollment') updates['verificationDocs.enrollmentCertificate'] = req.file.path;
    else if (type === 'photo') updates.photo = req.file.path;
    else if (type === 'video') updates['verificationDocs.videoUrl'] = req.file.path;
  }

  if (type === 'pan' && req.body.panNumber) updates.panNumber = req.body.panNumber.trim().toUpperCase();
  if (type === 'aadhar' && req.body.aadharNumber) updates.aadharNumber = req.body.aadharNumber.trim();
  if (type === 'enrollment') {
    if (req.body.enrollmentNumber) updates.enrollmentNumber = req.body.enrollmentNumber.trim();
    if (req.body.barId) updates.barId = req.body.barId.trim();
  }

  const updated = await Advocate.findOneAndUpdate({ advId }, { $set: updates }, { new: true });
  sendVerificationSubmittedMail(updated.email, updated.name, `${type.toUpperCase()} (Updated)`);

  res.status(200).json({
    success: true,
    message: `${type.toUpperCase()} updated successfully`,
    data: getDocData(updated, type)
  });
};

exports.editPan = (req, res) => handleEditUpload(req, res, 'pan');
exports.editAadhar = (req, res) => handleEditUpload(req, res, 'aadhar');
exports.editEnrollment = (req, res) => handleEditUpload(req, res, 'enrollment');
exports.editPhoto = (req, res) => handleEditUpload(req, res, 'photo');
exports.editVideo = (req, res) => handleEditUpload(req, res, 'video');
