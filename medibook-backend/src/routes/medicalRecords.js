const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/medicalRecordController');
const { protect, restrictTo } = require('../middleware/auth');
const { uploadMiddleware } = require('../middleware/upload');

router.get('/my', protect, restrictTo('patient'), ctrl.getRecords);
router.post('/', protect, restrictTo('patient'), uploadMiddleware, ctrl.createRecord);
router.delete('/:id', protect, restrictTo('patient'), ctrl.deleteRecord);
router.get('/patient/:id', protect, restrictTo('doctor', 'admin'), ctrl.getPatientRecords);


module.exports = router;