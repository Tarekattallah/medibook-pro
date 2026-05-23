const jwt    = require('jsonwebtoken')
const crypto = require('crypto')
const { validationResult } = require('express-validator')
const User   = require('../models/User')

/* ─── Helpers ────────────────────────────────────────────────────── */

const signToken = id => jwt.sign({ id }, process.env.JWT_SECRET, {
  expiresIn: process.env.JWT_EXPIRES_IN || '7d'
})

const sendToken = (user, statusCode, res) => {
  const token = signToken(user._id)
  res.status(statusCode).json({
    status: 'success',
    token,
    user: {
      id:           user._id,
      name:         user.name,
      email:        user.email,
      role:         user.role,
      avatar:       user.avatar,
      phone:        user.phone,
      specialty:    user.specialty,
      isVerified:   user.isVerified,
      availability: user.availability,
    }
  })
}

/* ─── Constants ──────────────────────────────────────────────────── */

const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com', 'tempmail.com', '10minutemail.com', 'guerrillamail.com',
  'sharklasers.com', 'yopmail.com', 'throwaway.email', 'trashmail.com',
  'temp-mail.org', 'fakeinbox.com', 'moakt.com', 'getnada.com', 'mailnesia.com',
  'dispostable.com', 'mailnull.com', 'spamgourmet.com', 'trashmail.me',
  'maildrop.cc', 'discard.email', 'spambox.us', 'tempinbox.com',
])

const NAME_REGEX_EN = /^[A-Za-z]+(?:[ .'\-][A-Za-z]+)*$/
const NAME_REGEX_AR = /^[\u0600-\u06FF]+(?:[ \u0600-\u06FF]+)*$/
const EMAIL_REGEX   = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/

/* ─── Controllers ────────────────────────────────────────────────── */

// POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty())
      return res.status(400).json({ message: errors.array()[0].msg })

    const { name, email, password, role, phone, dateOfBirth } = req.body

    // منع تسجيل admin من الواجهة
    if (role === 'admin') {
      return res.status(400).json({ message: 'Invalid role selected.' })
    }

    // التحقق من الاسم — يقبل English وعربي، يرفض mixed
    const trimmedName = (name ?? '').trim()
    if (!trimmedName || trimmedName.length < 2 || trimmedName.length > 100) {
      return res.status(400).json({ message: 'Name must be between 2 and 100 characters.' })
    }
    if (!NAME_REGEX_EN.test(trimmedName) && !NAME_REGEX_AR.test(trimmedName)) {
      return res.status(400).json({ message: 'Name can only contain letters (English or Arabic), spaces, hyphens, or apostrophes.' })
    }

    // التحقق من البريد — ASCII فقط، يرفض Unicode وعربي
    const trimmedEmail = (email ?? '').trim().toLowerCase()
    if (/[^\x00-\x7F]/.test(trimmedEmail)) {
      return res.status(400).json({ message: 'Email must contain English characters only.' })
    }
    if (!EMAIL_REGEX.test(trimmedEmail)) {
      return res.status(400).json({ message: 'Please provide a valid email address.' })
    }
    const domain = trimmedEmail.split('@')[1]
    if (!domain || domain.length < 4) {
      return res.status(400).json({ message: 'Invalid email domain.' })
    }
    if (DISPOSABLE_DOMAINS.has(domain)) {
      return res.status(400).json({ message: 'Disposable email addresses are not allowed.' })
    }

    // التحقق من الباسورد
    if (!password || password.length < 8 || password.length > 128) {
      return res.status(400).json({ message: 'Password must be between 8 and 128 characters.' })
    }
    if (!/[A-Z]/.test(password)) {
      return res.status(400).json({ message: 'Password must contain at least one uppercase letter.' })
    }
    if (!/[0-9]/.test(password)) {
      return res.status(400).json({ message: 'Password must contain at least one number.' })
    }

    // منع تكرار البريد — 409 Conflict عشان الـ frontend يميّزه
    if (await User.findOne({ email: trimmedEmail })) {
      return res.status(409).json({ message: 'Email already registered.' })
    }

    const user = await User.create({
      name:        trimmedName,
      email:       trimmedEmail,
      password,
      role:        role || 'patient',
      phone:       phone       || undefined,
      dateOfBirth: dateOfBirth || undefined,
    })

    sendToken(user, 201, res)

  } catch (err) {
    // لا نكشف تفاصيل الـ error للـ client
    console.error('[register]', err)
    res.status(500).json({ message: 'Registration failed. Please try again.' })
  }
}

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password)
      return res.status(400).json({ message: 'Email and password are required.' })

    const user = await User.findOne({ email: (email ?? '').trim().toLowerCase() }).select('+password')

    // رسالة generic — لا نكشف إن الإيميل موجود أو لا
    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ message: 'Incorrect email or password.' })

    if (!user.isActive)
      return res.status(403).json({ message: 'Account is deactivated.' })

    sendToken(user, 200, res)
  } catch (err) {
    console.error('[login]', err)
    res.status(500).json({ message: 'Login failed. Please try again.' })
  }
}

// GET /api/auth/me
exports.getMe = async (req, res) => {
  try {
    res.json({ status: 'success', user: req.user })
  } catch (err) {
    console.error('[getMe]', err)
    res.status(500).json({ message: 'Failed to fetch user.' })
  }
}

// PATCH /api/auth/update-profile
exports.updateProfile = async (req, res) => {
  try {
    const allowed = [
      'name', 'phone', 'dateOfBirth', 'bio', 'specialty',
      'languages', 'location', 'price', 'yearsExperience',
      'licenseNumber', 'bloodType', 'availability',
      'specializations', 'conditions', 'education',
    ]
    const updates = {}
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k] })

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    )
    res.json({ status: 'success', user })
  } catch (err) {
    console.error('[updateProfile]', err)
    res.status(400).json({ message: err.message || 'Failed to update profile.' })
  }
}

// PATCH /api/auth/change-password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body

    if (!currentPassword || !newPassword)
      return res.status(400).json({ message: 'Both current and new password are required.' })

    if (newPassword.length < 8 || newPassword.length > 128)
      return res.status(400).json({ message: 'New password must be between 8 and 128 characters.' })

    if (!/[A-Z]/.test(newPassword))
      return res.status(400).json({ message: 'New password must contain at least one uppercase letter.' })

    if (!/[0-9]/.test(newPassword))
      return res.status(400).json({ message: 'New password must contain at least one number.' })

    const user = await User.findById(req.user._id).select('+password')
    if (!(await user.comparePassword(currentPassword)))
      return res.status(401).json({ message: 'Current password is incorrect.' })

    user.password = newPassword
    await user.save()

    sendToken(user, 200, res)
  } catch (err) {
    console.error('[changePassword]', err)
    res.status(400).json({ message: 'Failed to change password. Please try again.' })
  }
}

// POST /api/auth/forgot-password
exports.forgotPassword = async (req, res) => {
  let user
  try {
    const { email } = req.body
    if (!email) return res.status(400).json({ message: 'Email is required.' })

    user = await User.findOne({ email: (email ?? '').trim().toLowerCase() })

    // Generic response — لا نكشف إن الإيميل موجود أو لا
    if (!user) {
      return res.json({ status: 'success', message: 'If this email exists, a reset link has been sent.' })
    }

    const rawToken = user.createPasswordResetToken()
    await user.save({ validateBeforeSave: false })

    const resetURL = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${rawToken}`
    console.log(`\n🔐 PASSWORD RESET LINK for ${email}:\n${resetURL}\n`)

    res.json({ status: 'success', message: 'If this email exists, a reset link has been sent.' })
  } catch (err) {
    console.error('[forgotPassword]', err)
    if (user) {
      user.passwordResetToken   = undefined
      user.passwordResetExpires = undefined
      await user.save({ validateBeforeSave: false })
    }
    res.status(500).json({ message: 'Failed to process request. Try again later.' })
  }
}

// PATCH /api/auth/reset-password/:token
exports.resetPassword = async (req, res) => {
  try {
    const { newPassword } = req.body

    if (!newPassword || newPassword.length < 8 || newPassword.length > 128)
      return res.status(400).json({ message: 'Password must be between 8 and 128 characters.' })

    if (!/[A-Z]/.test(newPassword))
      return res.status(400).json({ message: 'Password must contain at least one uppercase letter.' })

    if (!/[0-9]/.test(newPassword))
      return res.status(400).json({ message: 'Password must contain at least one number.' })

    const hashed = crypto.createHash('sha256').update(req.params.token).digest('hex')

    const user = await User.findOne({
      passwordResetToken:   hashed,
      passwordResetExpires: { $gt: Date.now() },
    })

    if (!user)
      return res.status(400).json({ message: 'Invalid or expired reset token.' })

    user.password             = newPassword
    user.passwordResetToken   = undefined
    user.passwordResetExpires = undefined
    await user.save()

    sendToken(user, 200, res)
  } catch (err) {
    console.error('[resetPassword]', err)
    res.status(400).json({ message: 'Failed to reset password. Please try again.' })
  }
}