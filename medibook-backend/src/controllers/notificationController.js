const Notification = require('../models/Notification')

// GET /api/notifications  — get my notifications
exports.getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20, unread } = req.query
    const filter = { user: req.user._id }
    if (unread === 'true') filter.read = false

    const skip = (Number(page) - 1) * Number(limit)
    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(filter).sort('-createdAt').skip(skip).limit(Number(limit)),
      Notification.countDocuments(filter),
      Notification.countDocuments({ user: req.user._id, read: false }),
    ])
    res.json({ status: 'success', total, unreadCount, notifications })
  } catch (err) { res.status(500).json({ message: err.message }) }
}

// PATCH /api/notifications/:id/read
exports.markRead = async (req, res) => {
  try {
    const n = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { read: true },
      { new: true }
    )
    if (!n) return res.status(404).json({ message: 'Notification not found.' })
    res.json({ status: 'success', notification: n })
  } catch (err) { res.status(400).json({ message: err.message }) }
}

// PATCH /api/notifications/mark-all-read
exports.markAllRead = async (req, res) => {
  try {
    await Notification.updateMany({ user: req.user._id, read: false }, { read: true })
    res.json({ status: 'success', message: 'All notifications marked as read.' })
  } catch (err) { res.status(400).json({ message: err.message }) }
}

// DELETE /api/notifications/:id
exports.deleteNotification = async (req, res) => {
  try {
    const n = await Notification.findOneAndDelete({ _id: req.params.id, user: req.user._id })
    if (!n) return res.status(404).json({ message: 'Notification not found.' })
    res.json({ status: 'success', message: 'Notification deleted.' })
  } catch (err) { res.status(400).json({ message: err.message }) }
}

// Helper — create notification (used internally by other controllers)
exports.createNotification = async (userId, { type, title, body, link }) => {
  try {
    await Notification.create({ user: userId, type, title, body, link: link || '/' })
  } catch (err) { console.error('Notification error:', err.message) }
}
