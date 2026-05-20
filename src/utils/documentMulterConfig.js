const multer = require('multer');
const path = require('path');
const fs = require('fs');

/**
 * @desc  Multer config for Document Center uploads.
 * Stores files at: uploads/documents/{advId}/{category}/
 * Allowed types: PDF, TXT, DOCX, XLSX, PNG, JPG, JPEG
 */
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const advId = req.user ? req.user.advId : 'unauthenticated';
    const category = req.body.category || 'my_docs';

    const dir = path.join('uploads', 'documents', advId, category);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `doc-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const ALLOWED_EXTENSIONS = ['.pdf', '.txt', '.docx', '.xlsx', '.png', '.jpg', '.jpeg'];
const ALLOWED_MIMES = [
  'application/pdf',
  'text/plain',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/png',
  'image/jpg',
  'image/jpeg'
];

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ALLOWED_EXTENSIONS.includes(ext) && ALLOWED_MIMES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Allowed: PDF, TXT, DOCX, XLSX, PNG, JPG, JPEG'), false);
  }
};

const documentUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 20 * 1024 * 1024 } // 20 MB per file
});

module.exports = documentUpload;
