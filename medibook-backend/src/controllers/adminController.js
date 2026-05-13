const User = require('../models/User')
const Appointment = require('../models/Appointment')

// GET /api/admin/stats
exports.getStats = async (req, res) => {
  try {
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1)
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)

    const [
      totalUsers, totalPatients, totalDoctors,
      pendingDoctors, appointmentsToday, appointmentsMonth,
      totalAppointments, cancelledCount
    ] = await Promise.all([
      User.countDocuments({ isActive: true }),
      User.countDocuments({ role: 'patient', isActive: true }),
      User.countDocuments({ role: 'doctor', isActive: true }),
      User.countDocuments({ role: 'doctor', isVerified: false }),
      Appointment.countDocuments({ date: { $gte: today, $lt: tomorrow } }),
      Appointment.countDocuments({ createdAt: { $gte: monthStart } }),
      Appointment.countDocuments(),
      Appointment.countDocuments({ status: 'cancelled' }),
    ])

    const cancellationRate = totalAppointments > 0
      ? ((cancelledCount / totalAppointments) * 100).toFixed(1)
      : 0

    res.json({
      status: 'success',
      stats: {
        totalUsers, totalPatients, totalDoctors, pendingDoctors,
        appointmentsToday, appointmentsMonth, totalAppointments,
        cancellationRate: `${cancellationRate}%`
      }
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// GET /api/admin/users
exports.getUsers = async (req, res) => {
  try {
    const { role, isActive, search, page = 1, limit = 20 } = req.query
    const filter = {}
    if (role)   filter.role = role
    if (isActive !== undefined) filter.isActive = isActive === 'true'
    if (search) filter.$or = [
      { name:  { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ]
    const skip = (Number(page) - 1) * Number(limit)
    const [users, total] = await Promise.all([
      User.find(filter).sort('-createdAt').skip(skip).limit(Number(limit)),
      User.countDocuments(filter)
    ])
    res.json({ status: 'success', total, users })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// PATCH /api/admin/users/:id/toggle-active
exports.toggleUserActive = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
    if (!user) return res.status(404).json({ message: 'User not found.' })
    user.isActive = !user.isActive
    await user.save()
    res.json({ status: 'success', user })
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
}

// PATCH /api/admin/users/:id/role
exports.changeRole = async (req, res) => {
  try {
    const { role } = req.body
    if (!['patient','doctor','admin'].includes(role)) return res.status(400).json({ message: 'Invalid role.' })
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true })
    if (!user) return res.status(404).json({ message: 'User not found.' })
    res.json({ status: 'success', user })
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
}

// GET /api/admin/analytics
exports.getAnalytics = async (req, res) => {
  try {
    // Appointments per month (last 7 months)
    const months = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setMonth(d.getMonth() - i, 1)
      d.setHours(0, 0, 0, 0)
      const end = new Date(d)
      end.setMonth(end.getMonth() + 1)
      const count = await Appointment.countDocuments({ createdAt: { $gte: d, $lt: end } })
      months.push({
        month: d.toLocaleString('default', { month: 'short' }),
        year:  d.getFullYear(),
        count
      })
    }

    // Top specialties
    const specialties = await User.aggregate([
      { $match: { role: 'doctor' } },
      { $group: { _id: '$specialty', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 6 }
    ])

    // New users per month
    const newUsers = []
    for (let i = 2; i >= 0; i--) {
      const d = new Date()
      d.setMonth(d.getMonth() - i, 1)
      d.setHours(0, 0, 0, 0)
      const end = new Date(d)
      end.setMonth(end.getMonth() + 1)
      const count = await User.countDocuments({ createdAt: { $gte: d, $lt: end } })
      newUsers.push({ month: d.toLocaleString('default', { month: 'short' }), count })
    }

    res.json({ status: 'success', analytics: { monthlyAppointments: months, topSpecialties: specialties, newUsers } })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// DELETE /api/admin/users/:id
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
    if (!user) return res.status(404).json({ message: 'User not found.' })
    if (user.role === 'admin') return res.status(400).json({ message: 'Cannot delete an admin account.' })
    // Delete all their appointments too
    const Appointment = require('../models/Appointment')
    await Appointment.deleteMany({ $or: [{ patient: req.params.id }, { doctor: req.params.id }] })
    await User.findByIdAndDelete(req.params.id)
    res.json({ status: 'success', message: 'User and related data deleted.' })
  } catch (err) { res.status(500).json({ message: err.message }) }
}
