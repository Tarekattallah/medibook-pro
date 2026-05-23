const express = require('express')
const { body } = require('express-validator')
const router  = express.Router()
const ctrl    = require('../controllers/authController')
const { protect } = require('../middleware/auth')

/* ─── Validation rules ───────────────────────────────────────────── */

const registerValidation = [
  // Name: 2-100 chars, letters only (EN or AR)
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters.')
    .matches(/^[A-Za-z\u0600-\u06FF]+(?:[ .'\-][A-Za-z\u0600-\u06FF]+)*$/)
    .withMessage('Name can only contain letters, spaces, hyphens, or apostrophes.'),

  // Email: ASCII only, strict regex, no normalizeEmail (يحرّف الإيميل)
  body('email')
    .trim()
    .toLowerCase()
    .custom(val => {
      if (/[^\x00-\x7F]/.test(val))
        throw new Error('Email must contain English characters only.')
      const EMAIL_REGEX = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/
      if (!EMAIL_REGEX.test(val))
        throw new Error('Please provide a valid email address.')
      return true
    }),

  // Password: min 8, max 128, uppercase + number required
  body('password')
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be between 8 and 128 characters.')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter.')
    .matches(/[0-9]/)
    .withMessage('Password must contain at least one number.'),

  // Role: whitelist فقط — يمنع أي قيمة تانية
  body('role')
    .optional()
    .isIn(['patient', 'doctor'])
    .withMessage('Invalid role selected.'),

  // Phone: optional
  body('phone')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 20 })
    .withMessage('Phone number is too long.'),

  // Date of birth: optional, valid date
  body('dateOfBirth')
    .optional({ checkFalsy: true })
    .isISO8601()
    .withMessage('Please provide a valid date of birth.')
    .toDate(),
]

const loginValidation = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required.'),
  body('password')
    .notEmpty()
    .withMessage('Password is required.'),
]

/* ─── Routes ─────────────────────────────────────────────────────── */

router.post('/register',              registerValidation, ctrl.register)
router.post('/login',                 loginValidation,    ctrl.login)
router.post('/forgot-password',       ctrl.forgotPassword)
router.patch('/reset-password/:token', ctrl.resetPassword)

router.get('/me',                protect, ctrl.getMe)
router.patch('/update-profile',  protect, ctrl.updateProfile)
router.patch('/change-password', protect, ctrl.changePassword)

module.exports = router