const EmergencyRequest = require('../models/EmergencyRequest');
const User = require('../models/User');
const { createNotification } = require('./notificationController');

// POST /api/emergency/request
exports.createEmergencyRequest = async (req, res) => {
    try {
        const { type } = req.body;
        const message = typeof req.body.message === 'string'
            ? req.body.message.trim().slice(0, 500)
            : '';

        // التحقق من النوع (قائمة بيضاء)
        if (!type || !['teleconsult', 'support_chat'].includes(type)) {
            return res.status(400).json({ message: 'Invalid request type.' });
        }

        // منع الطلبات المكررة (فحص يدوي + فهرس قاعدة البيانات)
        const existing = await EmergencyRequest.findOne({
            patient: req.user._id,
            type,
            status: 'pending'
        }).lean();

        if (existing) {
            return res.status(400).json({
                message: `You already have a pending ${type === 'teleconsult' ? 'teleconsult' : 'support'} request. Please wait for a response.`
            });
        }

        // إنشاء الطلب
        const request = await EmergencyRequest.create({
            patient: req.user._id,
            type,
            message,
            status: 'pending'
        });

        // إرسال إشعارات للدور المناسب
        const targetRole = type === 'teleconsult' ? 'doctor' : 'admin';
        const targets = await User.find({
            role: targetRole,
            isActive: true
        }).select('_id').lean();

        // استخدام Promise.allSettled لضمان عدم فشل الطلب إذا فشل إرسال إشعار
        await Promise.allSettled(
            targets.map(target =>
                createNotification(target._id, {
                    type: 'emergency',
                    title: type === 'teleconsult'
                        ? 'Emergency Teleconsult Request'
                        : 'New Support Chat Request',
                    body: `Patient ${req.user.name} is requesting ${type === 'teleconsult' ? 'an immediate teleconsult' : 'support chat'}.`,
                    link: type === 'teleconsult' ? '/doctor/emergency-requests' : '/admin/emergency-requests',
                    data: { requestId: request._id }
                })
            )
        );

        res.status(201).json({ status: 'success', request });

    } catch (err) {
        console.error('[createEmergencyRequest]', err);

        // معالجة خطأ الفهرس الفريد (حالة سباق نادرة)
        if (err.code === 11000) {
            return res.status(400).json({
                message: 'A pending request already exists. Please wait for a response.'
            });
        }

        res.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
};

// GET /api/emergency/my-requests (للمريض)
exports.getMyEmergencyRequests = async (req, res) => {
    try {
        const requests = await EmergencyRequest.find({
            patient: req.user._id
        })
            .sort('-createdAt')
            .limit(20)
            .lean();

        res.json({ status: 'success', requests });
    } catch (err) {
        console.error('[getMyEmergencyRequests]', err);
        res.status(500).json({ message: 'Something went wrong.' });
    }
};

// GET /api/emergency/doctor/pending (للطبيب أو المدير)
exports.getPendingRequests = async (req, res) => {
    try {
        // الطبيب يرى teleconsult، المدير يرى support_chat
        const type = req.user.role === 'admin' ? 'support_chat' : 'teleconsult';

        const requests = await EmergencyRequest.find({
            type,
            status: 'pending'
        })
            .populate('patient', 'name email phone')
            .sort('-createdAt')
            .lean();

        res.json({ status: 'success', requests });
    } catch (err) {
        console.error('[getPendingRequests]', err);
        res.status(500).json({ message: 'Something went wrong.' });
    }
};

// PATCH /api/emergency/:id/handle (للطبيب/المدير)
exports.handleRequest = async (req, res) => {
    try {
        const { action, responseMessage } = req.body;
        const allowedActions = ['accept', 'reject', 'complete'];

        if (!allowedActions.includes(action)) {
            return res.status(400).json({ message: 'Invalid action.' });
        }

        const request = await EmergencyRequest.findById(req.params.id);
        if (!request) {
            return res.status(404).json({ message: 'Request not found.' });
        }

        // لا يمكن تعديل طلب غير معلق إلا إذا كان الإجراء "complete" وكان الطلب مقبولاً
        if (request.status !== 'pending') {
            if (action !== 'complete' || request.status !== 'accepted') {
                return res.status(400).json({ message: 'Request already handled.' });
            }
        }

        // تحديث الحالة
        const statusMap = {
            accept: 'accepted',
            reject: 'rejected',
            complete: 'completed'
        };
        request.status = statusMap[action];
        request.handledBy = req.user._id;
        request.responseMessage = typeof responseMessage === 'string'
            ? responseMessage.trim().slice(0, 500)
            : '';

        await request.save();

        // إشعار المريض
        const notificationTitle = {
            accept: 'Teleconsult Accepted',
            reject: 'Request Declined',
            complete: 'Consultation Completed'
        };
        const notificationBody = {
            accept: `Dr. ${req.user.name} accepted your request. They will contact you shortly.`,
            reject: `Your request was declined. Please book a regular appointment.`,
            complete: `Your consultation request has been marked as completed.`
        };

        await createNotification(request.patient, {
            type: 'emergency_response',
            title: notificationTitle[action],
            body: notificationBody[action],
            link: '/patient/emergency-requests',
            data: { requestId: request._id }
        });

        res.json({ status: 'success', request });
    } catch (err) {
        console.error('[handleRequest]', err);
        res.status(500).json({ message: 'Something went wrong.' });
    }
};

// DELETE /api/emergency/:id (للمريض فقط)
exports.cancelRequest = async (req, res) => {
    try {
        const request = await EmergencyRequest.findById(req.params.id);

        if (!request) {
            return res.status(404).json({ message: 'Request not found.' });
        }

        // التحقق من أن الطلب يخص هذا المريض
        if (request.patient.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Access denied.' });
        }

        if (request.status !== 'pending') {
            return res.status(400).json({ message: 'Only pending requests can be cancelled.' });
        }

        await EmergencyRequest.findByIdAndDelete(req.params.id);
        res.json({ status: 'success', message: 'Request cancelled.' });
    } catch (err) {
        console.error('[cancelRequest]', err);
        res.status(500).json({ message: 'Something went wrong.' });
    }
};