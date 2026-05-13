const jwt = require('jsonwebtoken')
const User = require('../models/User')

// Verify JWT token
exports.protect = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.split(' ')[1]
      : null

    if (!token) return res.status(401).json({ message: 'Not authenticated. Please log in.' })

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(decoded.id)
    if (!user || !user.isActive) return res.status(401).json({ message: 'User no longer exists.' })

    req.user = user
    next()
  } catch {
    res.status(401).json({ message: 'Invalid or expired token.' })
  }
}

// Role-based access
exports.restrictTo = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: `Access denied. Requires role: ${roles.join(' or ')}` })
  }
  next()
}
