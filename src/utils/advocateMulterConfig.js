const multer = require('multer');
const path = require('path');
const fs = require('fs');

/**
 * @desc Storage Engine for Advocate-specific uploads
 * Organizes files by AdvID: uploads/advocates/{advId}/
 * Dynamic destination: uses req.user.advId attached by protectAdvocate middleware
 */
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const advId = req.user ? req.user.advId : 'unauthenticated';

    // Organize into sub-folder per type for clarity
    const advDir = path.join('uploads', 'advocates', advId);

    if (!fs.existsSync(advDir)) {
      fs.mkdirSync(advDir, { recursive: true });
    }

    cb(null, advDir);
  },
  filename: function (req, file, cb) {
    // Format: fieldname-timestamp-random.ext  (e.g., panImage-1714145600000-123456789.jpg)
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

/**
 * @desc File filter allowing images (JPG/PNG/PDF) and videos (MP4/MOV/AVI)
 */
const fileFilter = (req, file, cb) => {
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.pdf', '.mp4', '.mov', '.avi'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPG, PNG, PDF, and Video formats are supported.'), false);
  }
};

const advocateUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB — accommodates high-quality enrollment certificates and videos
  }
});

module.exports = advocateUpload;
