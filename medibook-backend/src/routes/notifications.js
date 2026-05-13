const express = require('express')
const router  = express.Router()
const ctrl    = require('../controllers/notificationController')
const { protect } = require('../middleware/auth')

router.use(protect)

router.get('/',                      ctrl.getNotifications)
router.patch('/mark-all-read',       ctrl.markAllRead)
router.patch('/:id/read',            ctrl.markRead)
router.delete('/:id',                ctrl.deleteNotification)

module.exports = router
