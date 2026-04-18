const multer = require('multer');
const path = require('path');
const fs = require('fs');

/**
 * @desc Storage Engine for Client-specific uploads
 * Organizes files by ClientID inside the uploads directory
 */
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // 1. Get clientId from the request (attached by protectClient middleware)
    const clientId = req.user ? req.user.clientId : 'unauthenticated';
    
    // 2. Define sub-path: uploads/clients/CLIENTID
    const userDir = path.join('uploads', 'clients', clientId);

    // 3. Recursive directory creation
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }

    cb(null, userDir);
  },
  filename: function (req, file, cb) {
    // Format: key-timestamp-random.ext
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

/**
 * @desc File filter to enforce document security
 */
const fileFilter = (req, file, cb) => {
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.mp4', '.mov', '.avi'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPG, PNG, and Video formats are supported.'), false);
  }
};

const clientUpload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { 
    fileSize: 25 * 1024 * 1024 // 25MB limit to accommodate high-quality verification videos
  }
});

module.exports = clientUpload;