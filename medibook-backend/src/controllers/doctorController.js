const User = require('../models/User')
const Review = require('../models/Review')
const Appointment = require('../models/Appointment')

// GET /api/doctors/search
exports.searchDoctors = async (req, res) => {
  try {
    const { q, specialty, location, minRating, maxPrice, date, page = 1, limit = 12 } = req.query

    const filter = { role: 'doctor', isActive: true }
    if (specialty) filter.specialty = { $regex: specialty, $options: 'i' }
    if (location)  filter.location  = { $regex: location,  $options: 'i' }
    if (q)         filter.$or = [
      { name:      { $regex: q, $options: 'i' } },
      { specialty: { $regex: q, $options: 'i' } },
      { bio:       { $regex: q, $options: 'i' } },
    ]
    if (minRating) filter.rating = { $gte: Number(minRating) }
    if (maxPrice)  filter.price  = { $lte: Number(maxPrice) }

    const skip = (Number(page) - 1) * Number(limit)
    const [doctors, total] = await Promise.all([
      User.find(filter).select('-availability').sort({ rating: -1, reviewCount: -1 }).skip(skip).limit(Number(limit)),
      User.countDocuments(filter)
    ])

    res.json({ status: 'success', total, page: Number(page), results: doctors.length, doctors })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// GET /api/doctors/:id
exports.getDoctor = async (req, res) => {
  try {
    const doctor = await User.findOne({ _id: req.params.id, role: 'doctor' })
    if (!doctor) return res.status(404).json({ message: 'Doctor not found.' })

    const reviews = await Review.find({ doctor: req.params.id })
      .populate('patient', 'name avatar')
      .sort('-createdAt')
      .limit(10)

    res.json({ status: 'success', doctor, reviews })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// GET /api/doctors/:id/availability
exports.getAvailability = async (req, res) => {
  try {
    const { date } = req.query
    if (!date) return res.status(400).json({ message: 'Date is required.' })

    const doctor = await User.findById(req.params.id).select('availability')
    if (!doctor) return res.status(404).json({ message: 'Doctor not found.' })

    // Get booked slots for that date
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    const booked = await Appointment.find({
      doctor: req.params.id,
      date: { $gte: startOfDay, $lte: endOfDay },
      status: { $in: ['pending', 'confirmed'] }
    }).select('timeSlot')

    const bookedSlots = booked.map(a => a.timeSlot)

    // Day of week
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const dayName = dayNames[new Date(date).getDay()]

    const dayAvail = doctor.availability?.find(d => d.day === dayName)
    const allSlots = dayAvail?.slots || ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00']

    const slots = allSlots.map(time => ({
      time,
      available: !bookedSlots.includes(time)
    }))

    res.json({ status: 'success', date, day: dayName, slots })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// POST /api/doctors/:id/reviews
exports.addReview = async (req, res) => {
  try {
    const { rating, comment, appointmentId } = req.body

    // Validate rating
    const r = Number(rating)
    if (!r || r < 1 || r > 5 || !Number.isInteger(r))
      return res.status(400).json({ message: 'Rating must be a whole number between 1 and 5.' })

    // Validate doctor exists
    const doctor = await User.findOne({ _id: req.params.id, role: 'doctor' })
    if (!doctor) return res.status(404).json({ message: 'Doctor not found.' })

    // Prevent duplicate review per appointment
    const existing = await Review.findOne({ patient: req.user._id, doctor: req.params.id, appointment: appointmentId })
    if (existing) return res.status(400).json({ message: 'You already reviewed this appointment.' })

    const review = await Review.create({
      patient: req.user._id,
      doctor: req.params.id,
      appointment: appointmentId,
      rating,
      comment
    })
    await review.populate('patient', 'name avatar')
    res.status(201).json({ status: 'success', review })
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
}

// GET /api/doctors (admin - all doctors)
exports.getAllDoctors = async (req, res) => {
  try {
    const { isVerified, page = 1, limit = 20 } = req.query
    const filter = { role: 'doctor' }
    if (isVerified !== undefined) filter.isVerified = isVerified === 'true'
    const skip = (Number(page) - 1) * Number(limit)
    const [doctors, total] = await Promise.all([
      User.find(filter).sort('-createdAt').skip(skip).limit(Number(limit)),
      User.countDocuments(filter)
    ])
    res.json({ status: 'success', total, doctors })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// PATCH /api/doctors/:id/verify (admin)
exports.verifyDoctor = async (req, res) => {
  try {
    const doctor = await User.findByIdAndUpdate(
      req.params.id,
      { isVerified: true },
      { new: true }
    )
    if (!doctor) return res.status(404).json({ message: 'Doctor not found.' })
    res.json({ status: 'success', doctor })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
