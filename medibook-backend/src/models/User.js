const mongoose = require('mongoose')
const bcrypt   = require('bcryptjs')
const crypto   = require('crypto')

const userSchema = new mongoose.Schema({
  name:      { type: String, required: true, trim: true },
  email:     { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:  { type: String, required: true, minlength: 8, select: false },
  role:      { type: String, enum: ['patient', 'doctor', 'admin'], default: 'patient' },
  phone:     { type: String },
  avatar:    { type: String, default: '' },
  dateOfBirth: { type: Date },
  isActive:  { type: Boolean, default: true },

  // Patient-specific
  bloodType: { type: String },
  allergies: [String],

  // Doctor-specific
  specialty:       { type: String },
  licenseNumber:   { type: String },
  yearsExperience: { type: Number },
  price:           { type: Number },
  bio:             { type: String },
  languages:       [String],
  location:        { type: String },
  rating:          { type: Number, default: 0 },
  reviewCount:     { type: Number, default: 0 },
  isVerified:      { type: Boolean, default: false },
  availability: [{
    day:   String,
    slots: [String],
  }],

  // Password reset
  passwordResetToken:   { type: String, select: false },
  passwordResetExpires: { type: Date,   select: false },
}, { timestamps: true })

// Hash password before save
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next()
  this.password = await bcrypt.hash(this.password, 12)
  next()
})

// Compare password
userSchema.methods.comparePassword = async function(candidate) {
  return bcrypt.compare(candidate, this.password)
}

// Generate password reset token
userSchema.methods.createPasswordResetToken = function() {
  const raw   = crypto.randomBytes(32).toString('hex')
  this.passwordResetToken   = crypto.createHash('sha256').update(raw).digest('hex')
  this.passwordResetExpires = Date.now() + 15 * 60 * 1000 // 15 min
  return raw
}

// Remove sensitive fields from JSON
userSchema.methods.toJSON = function() {
  const obj = this.toObject()
  delete obj.password
  delete obj.passwordResetToken
  delete obj.passwordResetExpires
  return obj
}


// Indexes for common queries
userSchema.index({ role: 1, isActive: 1 })
userSchema.index({ role: 1, specialty: 1 })
userSchema.index({ role: 1, rating: -1 })

module.exports = mongoose.model('User', userSchema)
