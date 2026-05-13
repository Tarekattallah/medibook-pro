const mongoose = require('mongoose')

const appointmentSchema = new mongoose.Schema({
  patient:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctor:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  date:      { type: Date, required: true },
  timeSlot:  { type: String, required: true }, // '09:00'
  type:      { type: String, enum: ['in-person', 'video'], default: 'in-person' },
  status:    { type: String, enum: ['pending', 'confirmed', 'cancelled', 'completed'], default: 'pending' },

  notes:         { type: String },          // Patient notes
  doctorNotes:   { type: String },          // Doctor notes after visit
  price:         { type: Number },
  cancelReason:  { type: String },
  cancelledBy:   { type: String, enum: ['patient', 'doctor', 'admin'] },
}, { timestamps: true })

// Auto-populate patient and doctor
appointmentSchema.pre(/^find/, function (next) {
  this.populate('patient', 'name email phone avatar')
      .populate('doctor', 'name email specialty avatar location price rating')
  next()
})


// Indexes
appointmentSchema.index({ patient: 1, date: -1 })
appointmentSchema.index({ doctor: 1, date: 1, timeSlot: 1 })
appointmentSchema.index({ doctor: 1, status: 1 })

module.exports = mongoose.model('Appointment', appointmentSchema)
