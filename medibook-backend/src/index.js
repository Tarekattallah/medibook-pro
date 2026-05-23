require('dotenv').config()
const express        = require('express')
const cors           = require('cors')
const helmet         = require('helmet')
const morgan         = require('morgan')
const rateLimit      = require('express-rate-limit')
const mongoSanitize  = require('express-mongo-sanitize')
const xss            = require('xss-clean')
const path           = require('path')
const connectDB      = require('./config/db')

const app = express()
connectDB()

// ── CORS ───────────────────────────────────────────────────────────
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  process.env.FRONTEND_URL,
].filter(Boolean)

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true)
    cb(new Error('Not allowed by CORS'))
    // ❌ شيلنا الـ vercel wildcard — لو محتاجه حطه في FRONTEND_URL في الـ .env
  },
  credentials: true,
}))

// ── Security middlewares ───────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))
app.use(mongoSanitize())   // يمنع NoSQL injection من req.body/params/query
app.use(xss())             // يمنع XSS من الـ req.body

// ── Logging ───────────────────────────────────────────────────────
// في production نستخدم 'tiny' بدل 'combined' عشان منلوجش headers فيها tokens
app.use(morgan(process.env.NODE_ENV === 'production' ? 'tiny' : 'dev'))

// ── Body parsing ──────────────────────────────────────────────────
app.use(express.json({ limit: '50kb' }))  // ✅ 50kb كافية لأي JSON payload

// ── Static files ──────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

// ── Rate limiting ─────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 دقيقة
  max:      200,
  standardHeaders: true,      // بيرجع RateLimit headers في الـ response
  legacyHeaders:  false,
  message: { message: 'Too many requests. Please try again later.' }
})

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      20,
  standardHeaders: true,
  legacyHeaders:  false,
  message: { message: 'Too many attempts. Try again in 15 minutes.' }
})

app.use('/api/',                     limiter)
app.use('/api/auth/login',           authLimiter)
app.use('/api/auth/register',        authLimiter)
app.use('/api/auth/forgot-password', authLimiter)

// ── Routes ────────────────────────────────────────────────────────
app.use('/api/auth',            require('./routes/auth'))
app.use('/api/doctors',         require('./routes/doctors'))
app.use('/api/appointments',    require('./routes/appointments'))
app.use('/api/medical-records', require('./routes/medicalRecords'))
app.use('/api/notifications',   require('./routes/notifications'))
app.use('/api/emergency', require('./routes/emergency'))
app.use('/api/admin',           require('./routes/admin'))

// ── Health check ──────────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({
  status: 'ok',
  env:    process.env.NODE_ENV,
  time:   new Date().toISOString()
}))

// ── Setup admin — development only ────────────────────────────────
// ✅ متاح في dev بس — في production اشيله أو حطه وراء حماية
if (process.env.NODE_ENV !== 'production') {
  app.post('/api/setup-admin', async (req, res) => {
    try {
      const User   = require('./models/User')
      const bcrypt = require('bcryptjs')
      const hashed = await bcrypt.hash('password', 12)
      const existing = await User.findOne({ email: 'admin@demo.com' })
      if (existing) {
        existing.password = hashed
        existing.role     = 'admin'
        existing.isActive = true
        await existing.save()
        return res.json({ message: 'Admin reset ✅' })
      }
      await User.create({
        name: 'Admin User', email: 'admin@demo.com',
        password: hashed, role: 'admin', isActive: true
      })
      res.json({ message: 'Admin created ✅' })
    } catch (err) {
      res.status(500).json({ message: 'Setup failed.' })  // مش بنرجع err.message
    }
  })
}

// ── Global error handler ──────────────────────────────────────────
app.use((err, req, res, next) => {
  // لوج الـ error في السيرفر دايماً
  console.error(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`, err.message)

  if (err.code === 'LIMIT_FILE_SIZE')
    return res.status(400).json({ message: 'File too large. Max allowed size exceeded.' })
  if (err.message?.includes('Invalid file type'))
    return res.status(400).json({ message: err.message })
  if (err.name === 'CastError')
    return res.status(400).json({ message: 'Invalid ID format.' })
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field'
    return res.status(400).json({ message: `${field} already exists.` })
  }
  if (err.name === 'ValidationError') {
    const msg = Object.values(err.errors).map(e => e.message).join(', ')
    return res.status(400).json({ message: msg })
  }
  if (err.name === 'JsonWebTokenError')
    return res.status(401).json({ message: 'Invalid token.' })
  if (err.name === 'TokenExpiredError')
    return res.status(401).json({ message: 'Token expired. Please log in again.' })
  if (err.message === 'Not allowed by CORS')
    return res.status(403).json({ message: 'CORS: Origin not allowed.' })

  // ✅ في production مش بنرجع أي details عن الـ error
  res.status(err.status || 500).json({
    message: process.env.NODE_ENV === 'production'
      ? 'Something went wrong. Please try again.'
      : err.message || 'Internal server error'
  })
})

// ── 404 ───────────────────────────────────────────────────────────
app.use((req, res) =>
  res.status(404).json({ message: `Route ${req.originalUrl} not found.` })
)

// ── Start server ──────────────────────────────────────────────────
const PORT = process.env.PORT || 4000
app.listen(PORT, () => {
  console.log(`\n🚀 MediBook API → http://localhost:${PORT}`)
  console.log(`   Env         → ${process.env.NODE_ENV}`)
  console.log(`   Health      → http://localhost:${PORT}/api/health\n`)
})