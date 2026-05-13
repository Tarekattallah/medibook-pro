const express = require('express')
const router  = express.Router()
const ctrl    = require('../controllers/medicalRecordController')
const { protect, restrictTo } = require('../middleware/auth')
const upload  = require('../config/multer')

router.use(protect)

router.get('/',           restrictTo('patient'),               ctrl.getRecords)
router.post('/',          restrictTo('patient'), upload.single('file'), ctrl.createRecord)
router.delete('/:id',     restrictTo('patient'),               ctrl.deleteRecord)
router.get('/patient/:id',restrictTo('doctor','admin'),        ctrl.getPatientRecords)

module.exports = router
