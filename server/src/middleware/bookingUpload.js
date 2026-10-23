const multer = require('multer');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const uploadDir = path.join(
  __dirname,
  '../../uploads/booking-attachments'
);

fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },

  filename: (_req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();
    cb(null, `${crypto.randomUUID()}${extension}`);
  },
});

const allowedMimeTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/heic',
  'image/heif',
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/3gpp',
]);

const upload = multer({
  storage,
  limits: {
    fileSize: 2 * 1024 * 1024,
    files: 5,
  },

  fileFilter: (_req, file, cb) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      return cb(
        new Error('Only supported image and video files are allowed.')
      );
    }

    cb(null, true);
  },
});

module.exports = upload;