require('dotenv').config()
const express   = require('express')
const cors      = require('cors')
const helmet    = require('helmet')
const morgan    = require('morgan')
const rateLimit = require('express-rate-limit')
const path      = require('path')
const connectDB = require('./config/db')

const app = express()
connectDB()

// CORS — allow frontend origins
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  process.env.FRONTEND_URL,
].filter(Boolean)

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true)
    // Allow all vercel.app subdomains
    if (origin.endsWith('.vercel.app')) return cb(null, true)
    cb(new Error('Not allowed by CORS'))
  },
  credentials: true,
}))

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'))
app.use(express.json({ limit: '10mb' }))

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

// Rate limiting
const limiter     = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 })
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20,
  message: { message: 'Too many attempts. Try again in 15 minutes.' }
})
app.use('/api/', limiter)
app.use('/api/auth/login',           authLimiter)
app.use('/api/auth/register',        authLimiter)
app.use('/api/auth/forgot-password', authLimiter)

// Routes
app.use('/api/auth',            require('./routes/auth'))
app.use('/api/doctors',         require('./routes/doctors'))
app.use('/api/appointments',    require('./routes/appointments'))
app.use('/api/medical-records', require('./routes/medicalRecords'))
app.use('/api/notifications',   require('./routes/notifications'))
app.use('/api/admin',           require('./routes/admin'))

// Health check
app.get('/api/health', (req, res) => res.json({
  status: 'ok',
  env:    process.env.NODE_ENV,
  time:   new Date().toISOString()
}))

// Quick admin setup
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
      return res.json({ message: 'Admin reset ✅ Email: admin@demo.com | Password: password' })
    }
    await User.create({ name:'Admin User', email:'admin@demo.com', password:hashed, role:'admin', isActive:true })
    res.json({ message: 'Admin created ✅ Email: admin@demo.com | Password: password' })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// Global error handler
app.use((err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE')             return res.status(400).json({ message: 'File too large. Max 10 MB.' })
  if (err.message?.includes('Invalid file type')) return res.status(400).json({ message: err.message })
  if (err.name === 'CastError')                   return res.status(400).json({ message: 'Invalid ID format.' })
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field'
    return res.status(400).json({ message: `${field} already exists.` })
  }
  if (err.name === 'ValidationError') {
    const msg = Object.values(err.errors).map(e => e.message).join(', ')
    return res.status(400).json({ message: msg })
  }
  if (err.name === 'JsonWebTokenError') return res.status(401).json({ message: 'Invalid token.' })
  if (err.name === 'TokenExpiredError') return res.status(401).json({ message: 'Token expired. Please log in again.' })
  if (process.env.NODE_ENV !== 'production') console.error(err)
  res.status(err.status || 500).json({ message: err.message || 'Internal server error' })
})

app.use((req, res) => res.status(404).json({ message: `Route ${req.originalUrl} not found` }))

const PORT = process.env.PORT || 4000
app.listen(PORT, () => {
  console.log(`\n🚀 MediBook API → http://localhost:${PORT}`)
  console.log(`   Health      → http://localhost:${PORT}/api/health\n`)
})
