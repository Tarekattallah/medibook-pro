const multer  = require('multer')
const path    = require('path')
const crypto  = require('crypto')

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../../uploads')),
  filename:    (req, file, cb) => {
    const ext    = path.extname(file.originalname)
    const unique = crypto.randomBytes(16).toString('hex')
    cb(null, `${Date.now()}-${unique}${ext}`)
  }
})

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg','image/png','image/gif','image/webp','application/pdf',
    'application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document']
  if (allowed.includes(file.mimetype)) cb(null, true)
  else cb(new Error('Invalid file type. Only images, PDF, and Word documents are allowed.'), false)
}

module.exports = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10 MB
})
