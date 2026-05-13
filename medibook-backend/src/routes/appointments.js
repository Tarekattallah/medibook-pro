const express = require('express')
const router  = express.Router()
const ctrl    = require('../controllers/appointmentController')
const { protect, restrictTo } = require('../middleware/auth')

router.use(protect)

router.post('/',              restrictTo('patient'), ctrl.bookAppointment)
router.get('/my',             restrictTo('patient'), ctrl.getMyAppointments)
router.get('/doctor',         restrictTo('doctor'),  ctrl.getDoctorAppointments)
router.get('/admin/all',      restrictTo('admin'),   ctrl.getAllAppointments)
router.get('/:id',                                   ctrl.getAppointment)
router.patch('/:id/cancel',                          ctrl.cancelAppointment)
router.patch('/:id/complete', restrictTo('doctor'),  ctrl.completeAppointment)
router.patch('/:id/reschedule', restrictTo('patient'), ctrl.rescheduleAppointment)

module.exports = router
