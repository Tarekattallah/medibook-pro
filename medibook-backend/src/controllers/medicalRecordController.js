const MedicalRecord = require('../models/MedicalRecord')
const path = require('path')
const fs   = require('fs')

// -- escape regex metacharacters to prevent ReDoS attacks --
const escapeRegex = (str) =>
  str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// GET /api/medical-records  — patient's own records with search & pagination
exports.getRecords = async (req, res) => {
  try {
    const { type, page = 1, limit = 10, q } = req.query
    const pageNum  = Math.max(1, parseInt(page)  || 1)
    const limitNum = Math.min(50, Math.max(1, parseInt(limit) || 10))

    const filter = { patient: req.user._id }
    if (type) filter.type = type

    // Secure text search – escaped input to prevent ReDoS
    if (q && q.trim()) {
      const safe = escapeRegex(q.trim().slice(0, 100))
      filter.$or = [
        { providerName: { $regex: safe, $options: 'i' } },
        { summary:      { $regex: safe, $options: 'i' } },
        { reason:       { $regex: safe, $options: 'i' } },
        { description:  { $regex: safe, $options: 'i' } },
        { title:        { $regex: safe, $options: 'i' } }
      ]
    }

    const skip = (pageNum - 1) * limitNum

    const [records, total, allTotal] = await Promise.all([
      MedicalRecord.find(filter)
        .populate('doctor', 'name specialty')
        .sort('-date')
        .skip(skip)
        .limit(limitNum)
        .lean(),
      MedicalRecord.countDocuments(filter),
      MedicalRecord.countDocuments({ patient: req.user._id })
    ])

    res.json({
      status: 'success',
      total,
      allTotal,
      page: pageNum,
      results: records.length,
      records
    })
  } catch (err) {
    console.error('[getRecords]', err)
    res.status(500).json({ message: 'Something went wrong.' })
  }
}

// POST /api/medical-records  — patient uploads a file
exports.createRecord = async (req, res) => {
  try {
    const { title, type = 'other', description } = req.body

    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Title is required.' })
    }

    const attachments = []
    // دعم وسيط رفع الملفات الجديد أولاً، ثم القديم للتوافق
    if (req.medicalFile) {
      attachments.push({
        name: req.medicalFile.originalname,
        url:  req.medicalFile.url,
        type: req.medicalFile.mimetype,
        size: req.medicalFile.size,
      })
    } else if (req.file) {
      attachments.push({
        name: req.file.originalname,
        url:  `/uploads/${req.file.filename}`,
        type: req.file.mimetype,
        size: req.file.size,
      })
    }

    const record = await MedicalRecord.create({
      patient:     req.user._id,
      title:       title.trim(),
      type,
      description: description?.trim() || '',
      attachments,
      date:        new Date(),
    })

    await record.populate('doctor', 'name specialty')
    res.status(201).json({ status: 'success', record })
  } catch (err) {
    console.error('[createRecord]', err)
    res.status(400).json({ message: err.message })
  }
}

// DELETE /api/medical-records/:id
exports.deleteRecord = async (req, res) => {
  try {
    const record = await MedicalRecord.findOne({ _id: req.params.id, patient: req.user._id })
    if (!record) return res.status(404).json({ message: 'Record not found.' })

    // Delete file(s) from disk (secure path handling)
    for (const a of record.attachments) {
      const filePath = path.join(__dirname, '../../uploads', path.basename(a.url))
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath)
        } catch (e) {
          console.error('[deleteRecord] could not delete file:', filePath, e.message)
        }
      }
    }

    await record.deleteOne()
    res.json({ status: 'success', message: 'Record deleted.' })
  } catch (err) {
    console.error('[deleteRecord]', err)
    res.status(500).json({ message: 'Something went wrong.' })
  }
}

// GET /api/medical-records/patient/:id  — doctor or admin views patient records
exports.getPatientRecords = async (req, res) => {
  try {
    const records = await MedicalRecord.find({ patient: req.params.id })
      .populate('doctor', 'name specialty')
      .sort('-date')
      .lean()
    res.json({ status: 'success', records })
  } catch (err) {
    console.error('[getPatientRecords]', err)
    res.status(500).json({ message: 'Something went wrong.' })
  }
}