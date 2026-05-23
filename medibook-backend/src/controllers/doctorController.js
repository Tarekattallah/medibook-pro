const User        = require('../models/User')
const Review      = require('../models/Review')
const Appointment = require('../models/Appointment')

// ── Helpers ───────────────────────────────────────────────────────

// Sanitize string — منع XSS
const sanitizeString = str =>
  typeof str === 'string'
    ? str.replace(/<[^>]*>/g, '').trim()
    : str

// Escape regex — منع ReDoS
const escapeRegex = str =>
  str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// Validate MongoDB ObjectId
const isValidId = id => /^[0-9a-fA-F]{24}$/.test(id)

// ── Whitelist ─────────────────────────────────────────────────────
const DOCTOR_EDITABLE_FIELDS = [
  'name', 'phone', 'dateOfBirth',
  'specialty', 'yearsExperience', 'price', 'bio',
  'languages', 'location', 'availability',
  'specializations',
  'conditions',
  'education',
]
// ✅ avatar شيلناه من الـ whitelist — بيتعدل عن طريق /avatar route بس

// ═══════════════════════════════════════════════════════════════════
// GET /api/doctors/search
// ═══════════════════════════════════════════════════════════════════
exports.searchDoctors = async (req, res) => {
  try {
    const {
      q, specialty, location,
      minRating, maxPrice,
      page = 1, limit = 12
    } = req.query

    const pageNum  = Math.max(1, parseInt(page)  || 1)
    const limitNum = Math.min(50, Math.max(1, parseInt(limit) || 12))

    const filter = { role: 'doctor', isActive: true }

    // ✅ escapeRegex — منع ReDoS
    if (specialty) {
      const safe = escapeRegex(sanitizeString(specialty).slice(0, 100))
      filter.specialty = { $regex: safe, $options: 'i' }
    }
    if (location) {
      const safe = escapeRegex(sanitizeString(location).slice(0, 100))
      filter.location = { $regex: safe, $options: 'i' }
    }
    if (q) {
      const safe = escapeRegex(sanitizeString(q).slice(0, 100))
      filter.$or = [
        { name:      { $regex: safe, $options: 'i' } },
        { specialty: { $regex: safe, $options: 'i' } },
        { bio:       { $regex: safe, $options: 'i' } },
      ]
    }

    if (minRating) {
      const r = parseFloat(minRating)
      if (!isNaN(r) && r >= 0 && r <= 5) filter.rating = { $gte: r }
    }
    if (maxPrice) {
      const p = parseFloat(maxPrice)
      if (!isNaN(p) && p >= 0) filter.price = { $lte: p }
    }

    const skip = (pageNum - 1) * limitNum
    const [doctors, total] = await Promise.all([
      User.find(filter)
.select('name avatar specialty location rating reviewCount price yearsExperience isVerified languages bio specializations')        .sort({ rating: -1, reviewCount: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      User.countDocuments(filter)
    ])

    res.json({ status: 'success', total, page: pageNum, results: doctors.length, doctors })
  } catch (err) {
    console.error('[searchDoctors]', err)
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}

// ═══════════════════════════════════════════════════════════════════
// GET /api/doctors/:id
// ═══════════════════════════════════════════════════════════════════
exports.getDoctor = async (req, res) => {
  try {
    if (!isValidId(req.params.id))
      return res.status(400).json({ message: 'Invalid doctor ID.' })

    const doctor = await User.findOne({ _id: req.params.id, role: 'doctor' })
      .select(
        'name avatar specialty location rating reviewCount price ' +
        'yearsExperience isVerified languages bio ' +
        'specializations conditions education availability'
      )
      .lean()

    if (!doctor) return res.status(404).json({ message: 'Doctor not found.' })

    const reviews = await Review.find({ doctor: req.params.id })
      .populate('patient', 'name avatar')
      .sort('-createdAt')
      .limit(20)
      .lean()

    res.json({ status: 'success', doctor, reviews })
  } catch (err) {
    console.error('[getDoctor]', err)
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}

// ═══════════════════════════════════════════════════════════════════
// PATCH /api/doctors/:id
// ═══════════════════════════════════════════════════════════════════
exports.updateDoctor = async (req, res) => {
  try {
    if (!isValidId(req.params.id))
      return res.status(400).json({ message: 'Invalid doctor ID.' })

    if (req.user.role === 'doctor' && req.user._id.toString() !== req.params.id)
      return res.status(403).json({ message: 'Not authorized to update this profile.' })

    // ── Whitelist filtering ──
    const updates = {}
    for (const key of DOCTOR_EDITABLE_FIELDS) {
      if (req.body[key] === undefined) continue
      updates[key] = req.body[key]
    }

    if (Object.keys(updates).length === 0)
      return res.status(400).json({ message: 'No valid fields to update.' })

    // ── Sanitize strings ──
    for (const key of ['name', 'bio', 'location', 'specialty']) {
      if (updates[key]) updates[key] = sanitizeString(updates[key])
    }
    if (updates.languages)
      updates.languages = updates.languages.map(sanitizeString)
    if (updates.specializations)
      updates.specializations = updates.specializations.map(sanitizeString)
    if (updates.conditions)
      updates.conditions = updates.conditions.map(sanitizeString)
    if (updates.education) {
      updates.education = updates.education.map(ed => ({
        degree:      sanitizeString(ed.degree      ?? ''),
        institution: sanitizeString(ed.institution ?? ''),
        year:        sanitizeString(ed.year        ?? ''),
      }))
    }

    // ── Array size limits ──
    if (updates.languages?.length       > 10) return res.status(400).json({ message: 'Max 10 languages.'        })
    if (updates.specializations?.length > 20) return res.status(400).json({ message: 'Max 20 specializations.'  })
    if (updates.conditions?.length      > 30) return res.status(400).json({ message: 'Max 30 conditions.'       })
    if (updates.education?.length       > 10) return res.status(400).json({ message: 'Max 10 education items.'  })
    if (updates.availability?.length    > 7)  return res.status(400).json({ message: 'Max 7 availability days.' })

    const doctor = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password -passwordResetToken -passwordResetExpires')

    if (!doctor) return res.status(404).json({ message: 'Doctor not found.' })

    res.json({ status: 'success', doctor })
  } catch (err) {
    console.error('[updateDoctor]', err)
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message)
      return res.status(400).json({ message: messages.join(', ') })
    }
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}

// ═══════════════════════════════════════════════════════════════════
// PATCH /api/doctors/:id/avatar
// ═══════════════════════════════════════════════════════════════════
exports.uploadAvatar = async (req, res) => {
  try {
    if (!isValidId(req.params.id))
      return res.status(400).json({ message: 'Invalid doctor ID.' })

    if (req.user.role === 'doctor' && req.user._id.toString() !== req.params.id)
      return res.status(403).json({ message: 'Not authorized to update this profile.' })

    if (!req.avatarUrl)
      return res.status(400).json({ message: 'No image file provided.' })

    const doctor = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'doctor' },
      { $set: { avatar: req.avatarUrl } },
      { new: true }
    ).select('name avatar')

    if (!doctor) return res.status(404).json({ message: 'Doctor not found.' })

    res.json({ status: 'success', avatar: doctor.avatar, doctor })
  } catch (err) {
    console.error('[uploadAvatar]', err)
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}

// ═══════════════════════════════════════════════════════════════════
// GET /api/doctors/:id/availability
// ═══════════════════════════════════════════════════════════════════
exports.getAvailability = async (req, res) => {
  try {
    if (!isValidId(req.params.id))
      return res.status(400).json({ message: 'Invalid doctor ID.' })

    const { date } = req.query
    if (!date) return res.status(400).json({ message: 'Date is required.' })

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || isNaN(Date.parse(date)))
      return res.status(400).json({ message: 'Invalid date format. Use YYYY-MM-DD.' })

    const requested  = new Date(date)

    // منع تواريخ قديمة أكتر من شهر
    const oneMonthAgo = new Date()
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)
    if (requested < oneMonthAgo)
      return res.status(400).json({ message: 'Date is too far in the past.' })

    // ✅ منع تواريخ بعيدة في المستقبل أكتر من 3 شهور
    const maxFuture = new Date()
    maxFuture.setMonth(maxFuture.getMonth() + 3)
    if (requested > maxFuture)
      return res.status(400).json({ message: 'Cannot check availability more than 3 months ahead.' })

    const doctor = await User.findOne({ _id: req.params.id, role: 'doctor' })
      .select('availability')
      .lean()
    if (!doctor) return res.status(404).json({ message: 'Doctor not found.' })

    const startOfDay = new Date(date); startOfDay.setHours(0,  0,  0,   0)
    const endOfDay   = new Date(date); endOfDay.setHours(23, 59, 59, 999)

    const booked = await Appointment.find({
      doctor: req.params.id,
      date:   { $gte: startOfDay, $lte: endOfDay },
      status: { $in: ['pending', 'confirmed'] }
    }).select('timeSlot').lean()

    const bookedSlots = new Set(booked.map(a => a.timeSlot))

    const DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
    const dayName   = DAY_NAMES[new Date(date).getDay()]

    const dayAvail = doctor.availability?.find(d => d.day === dayName)
    const allSlots = dayAvail?.slots || ['09:00','10:00','11:00','12:00','14:00','15:00','16:00','17:00']

    const slots = allSlots.map(time => ({
      time,
      available: !bookedSlots.has(time)
    }))

    res.json({ status: 'success', date, day: dayName, slots })
  } catch (err) {
    console.error('[getAvailability]', err)
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}

// ═══════════════════════════════════════════════════════════════════
// POST /api/doctors/:id/reviews
// ═══════════════════════════════════════════════════════════════════
exports.addReview = async (req, res) => {
  try {
    if (!isValidId(req.params.id))
      return res.status(400).json({ message: 'Invalid doctor ID.' })

    const { rating, comment, appointmentId } = req.body

    const r = Number(rating)
    if (!r || r < 1 || r > 5 || !Number.isInteger(r))
      return res.status(400).json({ message: 'Rating must be a whole number between 1 and 5.' })

    // ✅ Validate appointmentId
    if (!appointmentId || !isValidId(appointmentId))
      return res.status(400).json({ message: 'Valid appointment ID is required.' })

    const cleanComment = comment ? sanitizeString(comment).slice(0, 1000) : ''

    const doctor = await User.findOne({ _id: req.params.id, role: 'doctor' }).lean()
    if (!doctor) return res.status(404).json({ message: 'Doctor not found.' })

    // منع الدكتور يعمل review لنفسه
    if (req.user._id.toString() === req.params.id)
      return res.status(400).json({ message: 'Doctors cannot review themselves.' })

    // ✅ تحقق إن الـ appointment ده فعلاً completed وتابع للمريض ده مع الدكتور ده
    const appointment = await Appointment.findOne({
      _id:     appointmentId,
      patient: req.user._id,
      doctor:  req.params.id,
      status:  'completed',
    }).lean()
    if (!appointment)
      return res.status(403).json({ message: 'You can only review doctors you have visited.' })

    // منع duplicate review على نفس الـ appointment
    const existing = await Review.findOne({
      patient:     req.user._id,
      doctor:      req.params.id,
      appointment: appointmentId,
    })
    if (existing)
      return res.status(400).json({ message: 'You already reviewed this appointment.' })

    const review = await Review.create({
      patient:     req.user._id,
      doctor:      req.params.id,
      appointment: appointmentId,
      rating:      r,
      comment:     cleanComment,
    })
    await review.populate('patient', 'name avatar')

    res.status(201).json({ status: 'success', review })
  } catch (err) {
    console.error('[addReview]', err)
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}

// ═══════════════════════════════════════════════════════════════════
// GET /api/doctors — admin only
// ═══════════════════════════════════════════════════════════════════
exports.getAllDoctors = async (req, res) => {
  try {
    const pageNum  = Math.max(1, parseInt(req.query.page)  || 1)
    const limitNum = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20))

    const filter = { role: 'doctor' }
    if (req.query.isVerified !== undefined)
      filter.isVerified = req.query.isVerified === 'true'

    const skip = (pageNum - 1) * limitNum
    const [doctors, total] = await Promise.all([
      User.find(filter)
        .select('-password -passwordResetToken -passwordResetExpires -__v')
        .sort('-createdAt')
        .skip(skip)
        .limit(limitNum)
        .lean(),
      User.countDocuments(filter)
    ])

    res.json({ status: 'success', total, doctors })
  } catch (err) {
    console.error('[getAllDoctors]', err)
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}

// ═══════════════════════════════════════════════════════════════════
// PATCH /api/doctors/:id/verify — admin only
// ═══════════════════════════════════════════════════════════════════
exports.verifyDoctor = async (req, res) => {
  try {
    if (!isValidId(req.params.id))
      return res.status(400).json({ message: 'Invalid doctor ID.' })

    const doctor = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'doctor' },
      { $set: { isVerified: true } },
      { new: true }
    ).select('-password -passwordResetToken -passwordResetExpires -__v')

    if (!doctor) return res.status(404).json({ message: 'Doctor not found.' })

    res.json({ status: 'success', doctor })
  } catch (err) {
    console.error('[verifyDoctor]', err)
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}