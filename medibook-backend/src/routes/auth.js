const express = require('express')
const { body } = require('express-validator')
const router  = express.Router()
const ctrl    = require('../controllers/authController')
const { protect } = require('../middleware/auth')

router.post('/register', [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Invalid email'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
], ctrl.register)

router.post('/login',           ctrl.login)
router.post('/forgot-password', ctrl.forgotPassword)
router.patch('/reset-password/:token', ctrl.resetPassword)

router.get('/me',                  protect, ctrl.getMe)
router.patch('/update-profile',    protect, ctrl.updateProfile)
router.patch('/change-password',   protect, ctrl.changePassword)

module.exports = router
