const express = require('express')
const router = express.Router()
const ctrl = require('../controllers/doctorController')
const { protect, restrictTo } = require('../middleware/auth')

router.get('/search', ctrl.searchDoctors)
router.get('/',       protect, restrictTo('admin'), ctrl.getAllDoctors)
router.get('/:id',            ctrl.getDoctor)
router.get('/:id/availability', ctrl.getAvailability)
router.post('/:id/reviews', protect, restrictTo('patient'), ctrl.addReview)
router.patch('/:id/verify', protect, restrictTo('admin'), ctrl.verifyDoctor)

module.exports = router
