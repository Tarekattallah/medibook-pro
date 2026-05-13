const MedicalRecord = require('../models/MedicalRecord')
const path  = require('path')
const fs    = require('fs')

// GET /api/medical-records  — patient's own records
exports.getRecords = async (req, res) => {
  try {
    const { type, page = 1, limit = 20 } = req.query
    const filter = { patient: req.user._id }
    if (type) filter.type = type

    const skip = (Number(page) - 1) * Number(limit)
    const [records, total] = await Promise.all([
      MedicalRecord.find(filter)
        .populate('doctor', 'name specialty')
        .sort('-date')
        .skip(skip)
        .limit(Number(limit)),
      MedicalRecord.countDocuments(filter)
    ])
    res.json({ status: 'success', total, records })
  } catch (err) { res.status(500).json({ message: err.message }) }
}

// POST /api/medical-records  — patient uploads a file
exports.createRecord = async (req, res) => {
  try {
    const { title, type = 'other', description } = req.body

    if (!title) return res.status(400).json({ message: 'Title is required.' })

    const attachments = []
    if (req.file) {
      attachments.push({
        name: req.file.originalname,
        url:  `/uploads/${req.file.filename}`,
        type: req.file.mimetype,
        size: req.file.size,
      })
    }

    const record = await MedicalRecord.create({
      patient:     req.user._id,
      title,
      type,
      description,
      attachments,
      date:        new Date(),
    })

    await record.populate('doctor', 'name specialty')
    res.status(201).json({ status: 'success', record })
  } catch (err) { res.status(400).json({ message: err.message }) }
}

// DELETE /api/medical-records/:id
exports.deleteRecord = async (req, res) => {
  try {
    const record = await MedicalRecord.findOne({ _id: req.params.id, patient: req.user._id })
    if (!record) return res.status(404).json({ message: 'Record not found.' })

    // Delete file from disk
    record.attachments.forEach(a => {
      const filePath = path.join(__dirname, '../../uploads', path.basename(a.url))
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
    })

    await record.deleteOne()
    res.json({ status: 'success', message: 'Record deleted.' })
  } catch (err) { res.status(500).json({ message: err.message }) }
}

// GET /api/medical-records/patient/:id  — doctor or admin views patient records
exports.getPatientRecords = async (req, res) => {
  try {
    const records = await MedicalRecord.find({ patient: req.params.id })
      .populate('doctor', 'name specialty')
      .sort('-date')
    res.json({ status: 'success', records })
  } catch (err) { res.status(500).json({ message: err.message }) }
}
