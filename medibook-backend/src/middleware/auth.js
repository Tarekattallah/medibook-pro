const jwt  = require('jsonwebtoken')
const User = require('../models/User')

// Verify JWT token
exports.protect = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.split(' ')[1]
      : null

    if (!token)
      return res.status(401).json({ message: 'Not authenticated. Please log in.' })

    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    const user = await User.findById(decoded.id).select('+password +passwordChangedAt')
    if (!user || !user.isActive)
      return res.status(401).json({ message: 'User no longer exists.' })

    // ✅ لو الـ password اتغير بعد ما التوكن اتعمل — التوكن يبقى invalid
    if (user.passwordChangedAt) {
      const changedAt = parseInt(user.passwordChangedAt.getTime() / 1000, 10)
      if (decoded.iat < changedAt)
        return res.status(401).json({ message: 'Password was changed. Please log in again.' })
    }

    req.user = user
    next()
  } catch {
    res.status(401).json({ message: 'Invalid or expired token.' })
  }
}

// Role-based access
exports.restrictTo = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role))
    return res.status(403).json({ message: 'You do not have permission to perform this action.' })
  next()
}