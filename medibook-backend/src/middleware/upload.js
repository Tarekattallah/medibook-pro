const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const RECORDS_DIR = path.join(__dirname, '../../uploads/records');
if (!fs.existsSync(RECORDS_DIR)) {
  fs.mkdirSync(RECORDS_DIR, { recursive: true });
}

const ALLOWED_MIME_TYPES = [
  'application/pdf', 'image/jpeg', 'image/png',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];
const MAX_FILE_SIZE = 15 * 1024 * 1024;

const MAGIC_BYTES = {
  'application/pdf': [0x25, 0x50, 0x44, 0x46],
  'image/jpeg': [0xFF, 0xD8, 0xFF],
  'image/png': [0x89, 0x50, 0x4E, 0x47],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [0x50, 0x4B, 0x03, 0x04],
  'application/msword': [0xD0, 0xCF, 0x11, 0xE0],
};

const detectMimeFromBuffer = (buffer) => {
  for (const [mime, bytes] of Object.entries(MAGIC_BYTES)) {
    if (bytes.every((b, i) => buffer[i] === b)) return mime;
  }
  return null;
};

const storage = multer.memoryStorage();
const fileFilter = (req, file, cb) => {
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return cb(new Error('Invalid file type. Allowed: PDF, JPG, PNG, DOC, DOCX.'), false);
  }
  cb(null, true);
};

const upload = multer({ storage, fileFilter, limits: { fileSize: MAX_FILE_SIZE, files: 1 } });

const processMedicalRecord = async (req, res, next) => {
  if (!req.file) return next();
  try {
    const detectedMime = detectMimeFromBuffer(req.file.buffer);
    if (!detectedMime || detectedMime !== req.file.mimetype) {
      return res.status(400).json({ message: 'Invalid file. File content does not match its type.' });
    }
    const ext = path.extname(req.file.originalname).toLowerCase();
    const safeExt = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx'].includes(ext) ? ext : '.bin';
    const filename = `record-${crypto.randomBytes(16).toString('hex')}${safeExt}`;
    const filepath = path.join(RECORDS_DIR, filename);
    await fs.promises.writeFile(filepath, req.file.buffer);
    req.medicalFile = {
      originalname: req.file.originalname,
      filename,
      path: filepath,
      mimetype: req.file.mimetype,
      size: req.file.size,
      url: `/uploads/records/${filename}`,
    };
    next();
  } catch (err) {
    console.error('[processMedicalRecord]', err);
    res.status(500).json({ message: 'Failed to process file. Please try again.' });
  }
};

module.exports = { uploadMiddleware: [upload.single('file'), processMedicalRecord] };