const mongoose = require('mongoose')

const reviewSchema = new mongoose.Schema({
  patient:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctor:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  appointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
  rating:      { type: Number, required: true, min: 1, max: 5 },
  comment:     { type: String, trim: true, maxlength: 1000 },
}, { timestamps: true })

// One review per appointment
reviewSchema.index({ patient: 1, appointment: 1 }, { unique: true })

// After save → update doctor's average rating automatically
reviewSchema.post('save', async function () {
  const stats = await mongoose.model('Review').aggregate([
    { $match: { doctor: this.doctor } },
    { $group: { _id: '$doctor', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } }
  ])
  if (stats.length > 0) {
    await mongoose.model('User').findByIdAndUpdate(this.doctor, {
      rating:      Math.round(stats[0].avgRating * 10) / 10,
      reviewCount: stats[0].count,
    })
  }
})

module.exports = mongoose.model('Review', reviewSchema)
