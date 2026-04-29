const User = require('../../models/User');
const { sendVerificationSubmittedMail } = require('../../utils/mailer');

// --- Helper: Update Document Path ---
const updateDocPath = async (userId, field, filePath, res) => {
  try {
    const update = {};
    update[field] = filePath;

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: update },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.status(200).json({
      success: true,
      message: `${field.split('.').pop()} uploaded successfully`,
      path: filePath
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Upload Aadhar Image
exports.uploadAadhar = async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
  sendVerificationSubmittedMail(req.user.email, req.user.name, 'Aadhar Card');
  await updateDocPath(req.user.id, 'verificationDocs.aadharImage', req.file.path, res);
};

// @desc    Upload PAN Image
exports.uploadPan = async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
  sendVerificationSubmittedMail(req.user.email, req.user.name, 'PAN Card');
  await updateDocPath(req.user.id, 'verificationDocs.panImage', req.file.path, res);
};

// @desc    Upload Profile Photo
exports.uploadPhoto = async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
  sendVerificationSubmittedMail(req.user.email, req.user.name, 'Profile Photo');
  await updateDocPath(req.user.id, 'photo', req.file.path, res);
};

// @desc    Upload Verification Video
exports.uploadVideo = async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
  sendVerificationSubmittedMail(req.user.email, req.user.name, 'Verification Video');
  await updateDocPath(req.user.id, 'verificationDocs.videoUrl', req.file.path, res);
};