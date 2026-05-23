const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/emergencyController');
const { protect, restrictTo } = require('../middleware/auth');

// جميع المسارات تتطلب تسجيل الدخول
router.use(protect);

// المريض
router.post('/request', restrictTo('patient'), ctrl.createEmergencyRequest);
router.get('/my-requests', restrictTo('patient'), ctrl.getMyEmergencyRequests);
router.delete('/:id', restrictTo('patient'), ctrl.cancelRequest);

// الطبيب والمدير
router.get('/doctor/pending', restrictTo('doctor', 'admin'), ctrl.getPendingRequests);
router.patch('/:id/handle', restrictTo('doctor', 'admin'), ctrl.handleRequest);

module.exports = router;