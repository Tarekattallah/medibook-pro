const mongoose = require('mongoose')

const notificationSchema = new mongoose.Schema({
  user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type:    { type: String, enum: ['appointment', 'reminder', 'review', 'system', 'cancellation'], default: 'system' },
  title:   { type: String, required: true },
  body:    { type: String, required: true },
  link:    { type: String, default: '/' },
  read:    { type: Boolean, default: false },
}, { timestamps: true })

notificationSchema.index({ user: 1, createdAt: -1 })

module.exports = mongoose.model('Notification', notificationSchema)
