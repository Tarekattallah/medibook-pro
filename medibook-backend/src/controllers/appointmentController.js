const Appointment = require('../models/Appointment')
const User        = require('../models/User')
const { createNotification } = require('./notificationController')

// POST /api/appointments
exports.bookAppointment = async (req, res) => {
  try {
    const { doctorId, date, timeSlot, type, notes, price } = req.body

    const doctor = await User.findOne({ _id: doctorId, role: 'doctor' })
    if (!doctor) return res.status(404).json({ message: 'Doctor not found.' })

    const d = new Date(date)
    const conflict = await Appointment.findOne({
      doctor: doctorId,
      date: { $gte: new Date(d.setHours(0,0,0,0)), $lte: new Date(d.setHours(23,59,59,999)) },
      timeSlot,
      status: { $in: ['pending','confirmed'] }
    })
    if (conflict) return res.status(400).json({ message: 'This slot is already booked. Please choose another time.' })

    const appointment = await Appointment.create({
      patient:  req.user._id,
      doctor:   doctorId,
      date:     new Date(date),
      timeSlot,
      type:     type || 'in-person',
      notes,
      price:    price || doctor.price,
      status:   'confirmed',
    })

    // Notify patient
    await createNotification(req.user._id, {
      type:  'appointment',
      title: 'Appointment Confirmed',
      body:  `Your appointment with ${doctor.name} on ${new Date(date).toLocaleDateString('en',{month:'short',day:'numeric'})} at ${timeSlot} is confirmed.`,
      link:  '/patient/appointments',
    })

    // Notify doctor
    await createNotification(doctorId, {
      type:  'appointment',
      title: 'New Appointment',
      body:  `${req.user.name} booked an appointment with you on ${new Date(date).toLocaleDateString('en',{month:'short',day:'numeric'})} at ${timeSlot}.`,
      link:  '/doctor/dashboard',
    })

    res.status(201).json({ status: 'success', appointment })
  } catch (err) { res.status(400).json({ message: err.message }) }
}

// GET /api/appointments/my
exports.getMyAppointments = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query
    const filter = { patient: req.user._id }
    if (status) filter.status = status
    const skip = (Number(page) - 1) * Number(limit)
    const [appointments, total] = await Promise.all([
      Appointment.find(filter).sort('-date').skip(skip).limit(Number(limit)),
      Appointment.countDocuments(filter)
    ])
    res.json({ status: 'success', total, appointments })
  } catch (err) { res.status(500).json({ message: err.message }) }
}

// GET /api/appointments/doctor
exports.getDoctorAppointments = async (req, res) => {
  try {
    const { status, date, page = 1, limit = 20 } = req.query
    const filter = { doctor: req.user._id }
    if (status) filter.status = status
    if (date) {
      const d = new Date(date)
      filter.date = { $gte: new Date(d.setHours(0,0,0,0)), $lte: new Date(d.setHours(23,59,59,999)) }
    }
    const skip = (Number(page) - 1) * Number(limit)
    const appointments = await Appointment.find(filter).sort('date timeSlot').skip(skip).limit(Number(limit))
    res.json({ status: 'success', appointments })
  } catch (err) { res.status(500).json({ message: err.message }) }
}

// GET /api/appointments/:id
exports.getAppointment = async (req, res) => {
  try {
    const apt = await Appointment.findById(req.params.id)
    if (!apt) return res.status(404).json({ message: 'Appointment not found.' })
    const isOwner = apt.patient._id.toString() === req.user._id.toString() ||
                    apt.doctor._id.toString()   === req.user._id.toString()
    if (!isOwner && req.user.role !== 'admin') return res.status(403).json({ message: 'Access denied.' })
    res.json({ status: 'success', appointment: apt })
  } catch (err) { res.status(500).json({ message: err.message }) }
}

// PATCH /api/appointments/:id/cancel
exports.cancelAppointment = async (req, res) => {
  try {
    const apt = await Appointment.findById(req.params.id)
    if (!apt) return res.status(404).json({ message: 'Appointment not found.' })

    const isOwner = apt.patient._id.toString() === req.user._id.toString() ||
                    apt.doctor._id.toString()   === req.user._id.toString()
    if (!isOwner && req.user.role !== 'admin') return res.status(403).json({ message: 'Access denied.' })
    if (apt.status === 'cancelled') return res.status(400).json({ message: 'Already cancelled.' })

    apt.status       = 'cancelled'
    apt.cancelReason = req.body.reason || ''
    apt.cancelledBy  = req.user.role
    await apt.save()

    // Notify the other party
    const notifyId = req.user.role === 'patient' ? apt.doctor._id : apt.patient._id
    await createNotification(notifyId, {
      type:  'cancellation',
      title: 'Appointment Cancelled',
      body:  `An appointment on ${new Date(apt.date).toLocaleDateString('en',{month:'short',day:'numeric'})} at ${apt.timeSlot} has been cancelled.`,
      link:  req.user.role === 'patient' ? '/doctor/dashboard' : '/patient/appointments',
    })

    res.json({ status: 'success', appointment: apt })
  } catch (err) { res.status(400).json({ message: err.message }) }
}

// PATCH /api/appointments/:id/complete
exports.completeAppointment = async (req, res) => {
  try {
    const apt = await Appointment.findById(req.params.id)
    if (!apt) return res.status(404).json({ message: 'Appointment not found.' })
    if (apt.doctor._id.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Access denied.' })

    apt.status      = 'completed'
    apt.doctorNotes = req.body.doctorNotes || ''
    await apt.save()

    // Prompt patient to leave review
    await createNotification(apt.patient._id, {
      type:  'review',
      title: 'How was your visit?',
      body:  `Your appointment is complete. Leave a review to help other patients.`,
      link:  `/doctor/${apt.doctor._id}`,
    })

    res.json({ status: 'success', appointment: apt })
  } catch (err) { res.status(400).json({ message: err.message }) }
}

// PATCH /api/appointments/:id/reschedule
exports.rescheduleAppointment = async (req, res) => {
  try {
    const { date, timeSlot } = req.body
    if (!date || !timeSlot) return res.status(400).json({ message: 'date and timeSlot are required.' })

    const apt = await Appointment.findById(req.params.id)
    if (!apt) return res.status(404).json({ message: 'Appointment not found.' })
    if (apt.patient._id.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Access denied.' })
    if (!['confirmed','pending'].includes(apt.status)) return res.status(400).json({ message: 'Cannot reschedule this appointment.' })

    // Check new slot not taken
    const d = new Date(date)
    const conflict = await Appointment.findOne({
      doctor: apt.doctor._id, timeSlot,
      date: { $gte: new Date(d.setHours(0,0,0,0)), $lte: new Date(d.setHours(23,59,59,999)) },
      status: { $in: ['pending','confirmed'] },
      _id: { $ne: apt._id }
    })
    if (conflict) return res.status(400).json({ message: 'This slot is already booked. Please choose another.' })

    apt.date     = new Date(date)
    apt.timeSlot = timeSlot
    await apt.save()

    // Notify doctor
    await createNotification(apt.doctor._id, {
      type:  'appointment',
      title: 'Appointment Rescheduled',
      body:  `${req.user.name} rescheduled their appointment to ${new Date(date).toLocaleDateString('en',{month:'short',day:'numeric'})} at ${timeSlot}.`,
      link:  '/doctor/dashboard',
    })

    res.json({ status: 'success', appointment: apt })
  } catch (err) { res.status(400).json({ message: err.message }) }
}

// GET /api/appointments/admin/all
exports.getAllAppointments = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query
    const filter = status ? { status } : {}
    const skip = (Number(page) - 1) * Number(limit)
    const [appointments, total] = await Promise.all([
      Appointment.find(filter).sort('-createdAt').skip(skip).limit(Number(limit)),
      Appointment.countDocuments(filter)
    ])
    res.json({ status: 'success', total, appointments })
  } catch (err) { res.status(500).json({ message: err.message }) }
}
