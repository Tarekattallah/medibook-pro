const mongoose = require('mongoose')
const bcrypt   = require('bcryptjs')
const crypto   = require('crypto')

// ── Reusable sub-schemas ──────────────────────────────────────────
const availabilitySchema = new mongoose.Schema({
  day:   {
    type: String,
    enum: ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],
    required: true,
  },
  slots: [{
    type: String,
    match: [/^\d{2}:\d{2}$/, 'Slot must be in HH:MM format'],
  }],
}, { _id: false })

const educationSchema = new mongoose.Schema({
  degree:      { type: String, required: true, trim: true, maxlength: 200 },
  institution: { type: String, required: true, trim: true, maxlength: 200 },
  year:        {
    type: String,
    trim: true,
    match: [/^\d{4}(-\d{4})?$/, 'Year must be YYYY or YYYY-YYYY'],
  },
}, { _id: false })

// ── Main Schema ───────────────────────────────────────────────────
const userSchema = new mongoose.Schema({

  // ── Shared fields ──
  name: {
    type:      String,
    required:  [true, 'Name is required'],
    trim:      true,
    maxlength: [100, 'Name cannot exceed 100 characters'],
    match:     [/^[A-Za-z]+(?:[ .'-][A-Za-z]+)*$/, 'Name can only contain English letters, spaces, hyphens, or apostrophes.'],
  },
  email: {
  type:      String,
  required:  [true, 'Email is required'],
  unique:    true,
  lowercase: true,
  trim:      true,
  match:     [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email'],
},
  password: {
    type:      String,
    required:  [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    select:    false,
  },
  role: {
    type:    String,
    enum:    { values: ['patient', 'doctor', 'admin'], message: 'Invalid role' },
    default: 'patient',
  },
  phone: {
    type:  String,
    trim:  true,
    match: [/^\+?[\d\s\-()]{7,20}$/, 'Please provide a valid phone number'],
  },
  avatar:      { type: String, default: '', trim: true },
  dateOfBirth: {
    type:     Date,
    validate: {
      validator: v => !v || v < new Date(),
      message:   'Date of birth must be in the past',
    },
  },
  isActive: { type: Boolean, default: true },

  // ── Patient-specific ──
  bloodType: {
    type: String,
    enum: { values: ['A+','A-','B+','B-','AB+','AB-','O+','O-',''], message: 'Invalid blood type' },
  },
  allergies: [{
    type:      String,
    trim:      true,
    maxlength: 100,
  }],

  // ── Doctor-specific ──
  specialty: {
    type:      String,
    trim:      true,
    maxlength: 100,
  },
  licenseNumber: {
    type:  String,
    trim:  true,
    match: [/^[A-Za-z0-9\-]{3,30}$/, 'Invalid license number format'],
  },
  yearsExperience: {
    type: Number,
    min:  [0,   'Years of experience cannot be negative'],
    max:  [70,  'Years of experience seems too high'],
  },
  price: {
    type: Number,
    min:  [0,    'Price cannot be negative'],
    max:  [99999,'Price seems too high'],
  },
  bio: {
    type:      String,
    trim:      true,
    maxlength: [2000, 'Bio cannot exceed 2000 characters'],
  },
  languages: [{
    type:      String,
    trim:      true,
    maxlength: 50,
  }],
  location: {
    type:      String,
    trim:      true,
    maxlength: 200,
  },

  // ← NEW
  specializations: [{
    type:      String,
    trim:      true,
    maxlength: 100,
  }],

  // ← NEW
  conditions: [{
    type:      String,
    trim:      true,
    maxlength: 100,
  }],

  // ← NEW
  education: [educationSchema],

  // ── System-managed (never user-editable) ──
  rating:      { type: Number, default: 0, min: 0, max: 5 },
  reviewCount: { type: Number, default: 0, min: 0 },
  isVerified:  { type: Boolean, default: false },

  availability: [availabilitySchema],

  // ── Password reset ──
  passwordResetToken:   { type: String, select: false },
  passwordResetExpires: { type: Date,   select: false },
  passwordChangedAt:    { type: Date,   select: false },   

}, {
  timestamps: true,
  strict: true,
})

// ── Indexes ───────────────────────────────────────────────────────
userSchema.index({ role: 1, isActive: 1 })
userSchema.index({ role: 1, specialty: 1 })
userSchema.index({ role: 1, rating: -1 })
userSchema.index({ email: 1 }, { unique: true })

// ── Pre-save: hash password ───────────────────────────────────────
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()
  this.password = await bcrypt.hash(this.password, 12)
  next()
})

// ── Methods ───────────────────────────────────────────────────────
userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password)
}

userSchema.methods.createPasswordResetToken = function () {
  const raw = crypto.randomBytes(32).toString('hex')
  this.passwordResetToken   = crypto.createHash('sha256').update(raw).digest('hex')
  this.passwordResetExpires = Date.now() + 15 * 60 * 1000   // 15 min
  return raw
}

// ── toJSON: strip sensitive fields ───────────────────────────────
userSchema.methods.toJSON = function () {
  const obj = this.toObject()
  delete obj.password
  delete obj.passwordResetToken
  delete obj.passwordResetExpires
  delete obj.passwordChangedAt   
  delete obj.__v
  return obj
}

module.exports = mongoose.model('User', userSchema)