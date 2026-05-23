const mongoose = require('mongoose');

const emergencyRequestSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Patient is required']
  },
  type: {
    type: String,
    enum: {
      values: ['teleconsult', 'support_chat'],
      message: 'Type must be teleconsult or support_chat'
    },
    required: [true, 'Type is required']
  },
  message: {
    type: String,
    trim: true,
    maxlength: [500, 'Message cannot exceed 500 characters']
  },
  status: {
    type: String,
    enum: {
      values: ['pending', 'accepted', 'rejected', 'completed'],
      message: 'Invalid status'
    },
    default: 'pending'
  },
  handledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  responseMessage: {
    type: String,
    trim: true,
    maxlength: [500, 'Response message cannot exceed 500 characters']
  }
}, {
  timestamps: true,
  strict: true
});

// منع طلبين معلقين من نفس النوع لنفس المريض (حماية قاعدة بيانات)
emergencyRequestSchema.index(
  { patient: 1, type: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: 'pending' } }
);

module.exports = mongoose.model('EmergencyRequest', emergencyRequestSchema);