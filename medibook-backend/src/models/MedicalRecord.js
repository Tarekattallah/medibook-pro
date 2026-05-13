const mongoose = require('mongoose')

const medicalRecordSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  appointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
  type: {
    type: String,
    enum: ['consultation', 'prescription', 'lab-result', 'imaging', 'vaccination', 'other'],
    required: true
  },
  title: { type: String, required: true },
  description: { type: String },
  diagnosis: { type: String },
  prescription: [{
    medication: String,
    dosage: String,
    frequency: String,
    duration: String
  }],
  attachments: [{ name: String, url: String, type: String, size: Number }],
  date: { type: Date, default: Date.now },
  isPrivate: { type: Boolean, default: false },
}, { timestamps: true })

medicalRecordSchema.index({ patient: 1, date: -1 })

module.exports = mongoose.model('MedicalRecord', medicalRecordSchema)
