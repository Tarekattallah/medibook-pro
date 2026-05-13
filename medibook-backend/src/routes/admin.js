const express = require('express')
const router  = express.Router()
const ctrl    = require('../controllers/adminController')
const { protect, restrictTo } = require('../middleware/auth')

router.use(protect, restrictTo('admin'))

router.get('/stats',                     ctrl.getStats)
router.get('/analytics',                 ctrl.getAnalytics)
router.get('/users',                     ctrl.getUsers)
router.patch('/users/:id/toggle-active', ctrl.toggleUserActive)
router.patch('/users/:id/role',          ctrl.changeRole)
router.delete('/users/:id',              ctrl.deleteUser)

module.exports = router
