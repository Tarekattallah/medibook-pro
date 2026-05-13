const jwt    = require('jsonwebtoken')
const crypto = require('crypto')
const { validationResult } = require('express-validator')
const User   = require('../models/User')

const signToken = id => jwt.sign({ id }, process.env.JWT_SECRET, {
  expiresIn: process.env.JWT_EXPIRES_IN || '7d'
})

const sendToken = (user, statusCode, res) => {
  const token = signToken(user._id)
  res.status(statusCode).json({
    status: 'success',
    token,
    user: {
      id:         user._id,
      name:       user.name,
      email:      user.email,
      role:       user.role,
      avatar:     user.avatar,
      phone:      user.phone,
      specialty:  user.specialty,
      isVerified: user.isVerified,
      availability: user.availability,
    }
  })
}

// POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg })
    const { name, email, password, role, phone, dateOfBirth } = req.body
    if (await User.findOne({ email })) return res.status(400).json({ message: 'Email already registered.' })
    const user = await User.create({ name, email, password, role: role || 'patient', phone, dateOfBirth })
    sendToken(user, 201, res)
  } catch (err) { res.status(500).json({ message: err.message }) }
}

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required.' })
    const user = await User.findOne({ email }).select('+password')
    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ message: 'Incorrect email or password.' })
    if (!user.isActive) return res.status(403).json({ message: 'Account is deactivated.' })
    sendToken(user, 200, res)
  } catch (err) { res.status(500).json({ message: err.message }) }
}

// GET /api/auth/me
exports.getMe = async (req, res) => {
  res.json({ status: 'success', user: req.user })
}

// PATCH /api/auth/update-profile
exports.updateProfile = async (req, res) => {
  try {
    const allowed = ['name','phone','dateOfBirth','bio','specialty','languages','location','price','yearsExperience','licenseNumber','bloodType','availability']
    const updates = {}
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k] })
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true })
    res.json({ status: 'success', user })
  } catch (err) { res.status(400).json({ message: err.message }) }
}

// PATCH /api/auth/change-password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body
    const user = await User.findById(req.user._id).select('+password')
    if (!(await user.comparePassword(currentPassword)))
      return res.status(401).json({ message: 'Current password is incorrect.' })
    user.password = newPassword
    await user.save()
    sendToken(user, 200, res)
  } catch (err) { res.status(400).json({ message: err.message }) }
}

// POST /api/auth/forgot-password
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body
    if (!email) return res.status(400).json({ message: 'Email is required.' })

    const user = await User.findOne({ email })
    // Always return 200 — don't reveal if email exists (security)
    if (!user) return res.json({ status: 'success', message: 'If this email exists, a reset link has been sent.' })

    const rawToken = user.createPasswordResetToken()
    await user.save({ validateBeforeSave: false })

    const resetURL = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${rawToken}`

    // In production: send real email via SendGrid / Nodemailer
    // For now: log to console (easy to swap with email service)
    console.log(`\n🔐 PASSWORD RESET LINK for ${email}:\n${resetURL}\n`)

    /* --- Nodemailer example (add nodemailer to package.json when ready) ---
    const transporter = nodemailer.createTransport({ ... })
    await transporter.sendMail({
      to: email,
      subject: 'MediBook Pro — Password Reset',
      html: `<p>Click <a href="${resetURL}">here</a> to reset your password. Link expires in 15 minutes.</p>`
    })
    */

    res.json({ status: 'success', message: 'If this email exists, a reset link has been sent.' })
  } catch (err) {
    // Clear token on error
    if (err.user) { err.user.passwordResetToken = undefined; err.user.passwordResetExpires = undefined; await err.user.save({ validateBeforeSave: false }) }
    res.status(500).json({ message: 'Failed to send reset email. Try again later.' })
  }
}

// PATCH /api/auth/reset-password/:token
exports.resetPassword = async (req, res) => {
  try {
    const { newPassword } = req.body
    if (!newPassword || newPassword.length < 8)
      return res.status(400).json({ message: 'Password must be at least 8 characters.' })

    // Hash the raw token to compare with DB
    const hashed = crypto.createHash('sha256').update(req.params.token).digest('hex')

    const user = await User.findOne({
      passwordResetToken:   hashed,
      passwordResetExpires: { $gt: Date.now() },
    })

    if (!user) return res.status(400).json({ message: 'Invalid or expired reset token.' })

    user.password             = newPassword
    user.passwordResetToken   = undefined
    user.passwordResetExpires = undefined
    await user.save()

    sendToken(user, 200, res)
  } catch (err) { res.status(400).json({ message: err.message }) }
}
