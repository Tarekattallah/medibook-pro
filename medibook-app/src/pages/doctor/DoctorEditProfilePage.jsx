import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/layout/Navbar'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../components/ui/Toast'
import s from './DoctorEditProfilePage.module.css' // نفس ملف الـ CSS الموجود عندك

// ── Constants ─────────────────────────────────────────────────────
const MAX_FILE_SIZE  = 5 * 1024 * 1024   // 5MB
const ALLOWED_TYPES  = ['image/jpeg', 'image/png', 'image/webp']
const ALL_DAYS       = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']
const DEFAULT_SLOTS  = ['09:00','10:00','11:00','12:00','14:00','15:00','16:00','17:00']

// ── Helpers ───────────────────────────────────────────────────────
const buildAvatarSrc = avatar => {
  if (!avatar) return null
  return avatar.startsWith('http')
    ? avatar
    : `${import.meta.env.VITE_API_URL ?? ''}${avatar}`
}

// ── Sub-components ────────────────────────────────────────────────

/* Avatar uploader */
function AvatarUploader({ current, onUpload, uploading }) {
  const [preview, setPreview] = useState(buildAvatarSrc(current))
  const [err,     setErr]     = useState('')
  const inputRef              = useRef(null)

  const handleFile = e => {
    setErr('')
    const file = e.target.files?.[0]
    if (!file) return

    if (!ALLOWED_TYPES.includes(file.type)) {
      setErr('Only JPEG, PNG, or WebP images are allowed.')
      e.target.value = ''
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      setErr('Image must be smaller than 5MB.')
      e.target.value = ''
      return
    }

    // Preview
    const reader = new FileReader()
    reader.onload = ev => setPreview(ev.target.result)
    reader.readAsDataURL(file)

    onUpload(file)
    e.target.value = ''  // reset input
  }

  const initials = (current && current !== '') ? 'DR' : 'DR' // fallback

  return (
    <div className={s.avatarSection}>
      <div className={s.avatarPreviewWrap}>
        {preview
          ? <img src={preview} alt="Avatar" className={s.avatarPreview} />
          : <div className={s.avatarInitials}>{initials}</div>
        }
        {uploading && (
          <div className={s.avatarOverlay}>
            <div className="spinner" style={{ width: 28, height: 28, borderColor: '#fff', borderTopColor: 'transparent' }} />
          </div>
        )}
      </div>
      <div className={s.avatarActions}>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          <span className="icon" style={{ fontSize: 16 }}>upload</span>
          {uploading ? 'Uploading...' : 'Change Photo'}
        </button>
        <p className={s.avatarHint}>JPEG, PNG or WebP · Max 5MB · Will be resized to 300×300</p>
        {err && <p className={s.fieldError}>{err}</p>}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFile}
        style={{ display: 'none' }}
      />
    </div>
  )
}

/* Tag input */
function TagInput({ label, values, onChange, max, placeholder }) {
  const [input, setInput] = useState('')
  const [err,   setErr]   = useState('')

  const add = () => {
    const val = input.trim().slice(0, 100)
    if (!val) return
    if (values.includes(val)) { setErr('Already added.'); return }
    if (values.length >= max) { setErr(`Max ${max} items.`); return }
    setErr('')
    onChange([...values, val])
    setInput('')
  }

  const remove = tag => onChange(values.filter(v => v !== tag))

  const onKey = e => {
    if (e.key === 'Enter') { e.preventDefault(); add() }
  }

  return (
    <div className={s.fieldGroup}>
      <label className={s.fieldLabel}>{label}</label>
      <div className={s.tagRow}>
        {values.map(v => (
          <span key={v} className={s.tag}>
            {v}
            <button type="button" onClick={() => remove(v)} className={s.tagRemove}>×</button>
          </span>
        ))}
      </div>
      <div className={s.tagInputRow}>
        <input
          value={input}
          onChange={e => { setErr(''); setInput(e.target.value.slice(0, 100)) }}
          onKeyDown={onKey}
          placeholder={placeholder}
          className={s.input}
          maxLength={100}
        />
        <button type="button" onClick={add} className="btn btn-secondary" style={{ padding: '8px 16px' }}>
          Add
        </button>
      </div>
      {err && <p className={s.fieldError}>{err}</p>}
      <p className={s.fieldHint}>{values.length}/{max} · Press Enter or click Add</p>
    </div>
  )
}

/* Education item */
function EducationItem({ item, index, onChange, onRemove }) {
  return (
    <div className={s.eduItem}>
      <div className={s.eduItemHeader}>
        <span className="icon" style={{ color: '#006591' }}>school</span>
        <span className={s.eduItemTitle}>Education #{index + 1}</span>
        <button type="button" onClick={onRemove} className={s.removeBtn}>
          <span className="icon">delete</span>
        </button>
      </div>
      <div className={s.eduFields}>
        <div className={s.fieldGroup}>
          <label className={s.fieldLabel}>Degree *</label>
          <input
            value={item.degree}
            onChange={e => onChange({ ...item, degree: e.target.value.slice(0, 200) })}
            placeholder="e.g. Fellowship in Cardiology"
            className={s.input}
            maxLength={200}
          />
        </div>
        <div className={s.fieldGroup}>
          <label className={s.fieldLabel}>Institution *</label>
          <input
            value={item.institution}
            onChange={e => onChange({ ...item, institution: e.target.value.slice(0, 200) })}
            placeholder="e.g. Cairo University"
            className={s.input}
            maxLength={200}
          />
        </div>
        <div className={s.fieldGroup}>
          <label className={s.fieldLabel}>Year</label>
          <input
            value={item.year}
            onChange={e => onChange({ ...item, year: e.target.value.slice(0, 9) })}
            placeholder="e.g. 2018 or 2016-2018"
            className={s.input}
            maxLength={9}
          />
        </div>
      </div>
    </div>
  )
}

/* Availability row */
function AvailabilityRow({ day, slots, onChange, onRemove }) {
  const toggle = slot => {
    const next = slots.includes(slot)
      ? slots.filter(s => s !== slot)
      : [...slots, slot].sort()
    onChange(next)
  }

  return (
    <div className={s.availRow}>
      <div className={s.availDayHeader}>
        <span className={s.availDayName}>{day}</span>
        <button type="button" onClick={onRemove} className={s.removeBtn}>
          <span className="icon">delete</span>
        </button>
      </div>
      <div className={s.availSlots}>
        {DEFAULT_SLOTS.map(slot => (
          <button
            key={slot}
            type="button"
            onClick={() => toggle(slot)}
            className={`${s.slotBtn} ${slots.includes(slot) ? s.slotActive : ''}`}
          >
            {slot}
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────
export default function DoctorEditProfilePage() {
  const { user, apiFetch, apiFetchForm, updateUser } = useAuth()
  const navigate = useNavigate()
  const toast    = useToast()

  const [form, setForm] = useState({
    name:            '',
    phone:           '',
    specialty:       '',
    bio:             '',
    location:        '',
    yearsExperience: '',
    price:           '',
    languages:       [],
    specializations: [],
    conditions:      [],
    education:       [],
    availability:    [],
  })

  const [loading,   setLoading]   = useState(true)
  const [saving,    setSaving]    = useState(false)
  const [uploading, setUploading] = useState(false)
  const [errors,    setErrors]    = useState({})

  // Load doctor data
  useEffect(() => {
    if (!user?._id) return
    apiFetch(`/doctors/${user._id}`)
      .then(d => {
        const doc = d.doctor
        setForm({
          name:            doc.name            ?? '',
          phone:           doc.phone           ?? '',
          specialty:       doc.specialty       ?? '',
          bio:             doc.bio             ?? '',
          location:        doc.location        ?? '',
          yearsExperience: doc.yearsExperience ?? '',
          price:           doc.price           ?? '',
          languages:       doc.languages       ?? [],
          specializations: doc.specializations ?? [],
          conditions:      doc.conditions      ?? [],
          education:       doc.education       ?? [],
          availability:    doc.availability    ?? [],
        })
      })
      .catch(() => toast('Failed to load profile.', 'error'))
      .finally(() => setLoading(false))
  }, [user?._id])

  const setField = (key, val) => {
    setForm(prev => ({ ...prev, [key]: val }))
    setErrors(prev => ({ ...prev, [key]: '' }))
  }

  const validate = () => {
    const errs = {}
    if (!form.name.trim())           errs.name      = 'Name is required.'
    if (form.name.length > 100)      errs.name      = 'Max 100 characters.'
    if (form.bio.length > 2000)      errs.bio       = 'Max 2000 characters.'
    if (form.location.length > 200)  errs.location  = 'Max 200 characters.'
    if (form.specialty.length > 100) errs.specialty = 'Max 100 characters.'
    if (form.yearsExperience !== '' && (isNaN(form.yearsExperience) || form.yearsExperience < 0 || form.yearsExperience > 70))
      errs.yearsExperience = 'Must be between 0 and 70.'
    if (form.price !== '' && (isNaN(form.price) || form.price < 0 || form.price > 99999))
      errs.price = 'Must be between 0 and 99,999.'
    for (let i = 0; i < form.education.length; i++) {
      const ed = form.education[i]
      if (!ed.degree.trim() || !ed.institution.trim())
        errs[`edu_${i}`] = 'Degree and institution are required.'
    }
    return errs
  }

  const handleAvatarUpload = async file => {
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('avatar', file)
      const data = await apiFetchForm(`/doctors/${user._id}/avatar`, fd)
      updateUser({ avatar: data.avatar })
      toast('Photo updated!')
    } catch (err) {
      toast(err.message || 'Upload failed.', 'error')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async e => {
    e.preventDefault()

    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      toast('Please fix the errors below.', 'error')
      return
    }

    setSaving(true)
    try {
      const payload = {
        name:            form.name.trim(),
        phone:           form.phone.trim(),
        specialty:       form.specialty.trim(),
        bio:             form.bio.trim(),
        location:        form.location.trim(),
        yearsExperience: form.yearsExperience !== '' ? Number(form.yearsExperience) : undefined,
        price:           form.price           !== '' ? Number(form.price)           : undefined,
        languages:       form.languages,
        specializations: form.specializations,
        conditions:      form.conditions,
        education:       form.education,
        availability:    form.availability,
      }

      Object.keys(payload).forEach(k => payload[k] === undefined && delete payload[k])

      const data = await apiFetch(`/doctors/${user._id}`, {
        method: 'PATCH',
        body:   JSON.stringify(payload),
      })

      updateUser(data.doctor)
      toast('Profile saved successfully!')
      navigate('/doctor/dashboard')
    } catch (err) {
      toast(err.message || 'Failed to save.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const addDay = () => {
    const used = form.availability.map(a => a.day)
    const next = ALL_DAYS.find(d => !used.includes(d))
    if (!next) { toast('All days already added.', 'warn'); return }
    setField('availability', [...form.availability, { day: next, slots: [] }])
  }

  const updateAvailDay = (i, slots) => {
    const updated = [...form.availability]
    updated[i] = { ...updated[i], slots }
    setField('availability', updated)
  }

  const removeAvailDay = i => {
    setField('availability', form.availability.filter((_, idx) => idx !== i))
  }

  const addEducation = () => {
    if (form.education.length >= 10) { toast('Max 10 education items.', 'warn'); return }
    setField('education', [...form.education, { degree: '', institution: '', year: '' }])
  }

  const updateEdu = (i, val) => {
    const updated = [...form.education]
    updated[i] = val
    setField('education', updated)
  }

  const removeEdu = i => {
    setField('education', form.education.filter((_, idx) => idx !== i))
    setErrors(prev => { const e = { ...prev }; delete e[`edu_${i}`]; return e })
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <div className="spinner" />
    </div>
  )

  return (
    <div className="page">
      <Navbar />

      <div className={s.pageWrap}>
        <div className={s.pageHeader}>
          <button
            type="button"
            className={s.backBtn}
            onClick={() => navigate('/doctor/dashboard')}
          >
            <span className="icon">arrow_back</span>
            Back to Dashboard
          </button>
          <div>
            <h1 className={s.pageTitle}>Edit Profile</h1>
            <p className={s.pageSub}>Update your professional information</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className={s.layout}>

            {/* Left Column */}
            <div className={s.leftCol}>

              {/* Avatar */}
              <div className={`card ${s.section}`}>
                <h2 className={s.sectionTitle}>
                  <span className="icon">photo_camera</span>
                  Profile Photo
                </h2>
                <AvatarUploader
                  current={user?.avatar}
                  onUpload={handleAvatarUpload}
                  uploading={uploading}
                />
              </div>

              {/* Basic Info */}
              <div className={`card ${s.section}`}>
                <h2 className={s.sectionTitle}>
                  <span className="icon">person</span>
                  Basic Information
                </h2>

                <div className={s.formGrid}>
                  <div className={s.fieldGroup}>
                    <label className={s.fieldLabel}>Full Name *</label>
                    <input
                      value={form.name}
                      onChange={e => setField('name', e.target.value.slice(0, 100))}
                      placeholder="Dr. Ahmed Mohamed"
                      className={`${s.input} ${errors.name ? s.inputError : ''}`}
                      maxLength={100}
                    />
                    {errors.name && <p className={s.fieldError}>{errors.name}</p>}
                  </div>

                  <div className={s.fieldGroup}>
                    <label className={s.fieldLabel}>Phone</label>
                    <input
                      value={form.phone}
                      onChange={e => setField('phone', e.target.value.slice(0, 20))}
                      placeholder="+20 10 0000 0000"
                      className={s.input}
                      maxLength={20}
                      type="tel"
                    />
                  </div>

                  <div className={s.fieldGroup}>
                    <label className={s.fieldLabel}>Specialty</label>
                    <input
                      value={form.specialty}
                      onChange={e => setField('specialty', e.target.value.slice(0, 100))}
                      placeholder="e.g. Cardiology"
                      className={`${s.input} ${errors.specialty ? s.inputError : ''}`}
                      maxLength={100}
                    />
                    {errors.specialty && <p className={s.fieldError}>{errors.specialty}</p>}
                  </div>

                  <div className={s.fieldGroup}>
                    <label className={s.fieldLabel}>Location / Clinic</label>
                    <input
                      value={form.location}
                      onChange={e => setField('location', e.target.value.slice(0, 200))}
                      placeholder="e.g. Cairo Heart Institute"
                      className={`${s.input} ${errors.location ? s.inputError : ''}`}
                      maxLength={200}
                    />
                    {errors.location && <p className={s.fieldError}>{errors.location}</p>}
                  </div>

                  <div className={s.fieldGroup}>
                    <label className={s.fieldLabel}>Years of Experience</label>
                    <input
                      value={form.yearsExperience}
                      onChange={e => setField('yearsExperience', e.target.value)}
                      placeholder="e.g. 10"
                      className={`${s.input} ${errors.yearsExperience ? s.inputError : ''}`}
                      type="number"
                      min={0}
                      max={70}
                    />
                    {errors.yearsExperience && <p className={s.fieldError}>{errors.yearsExperience}</p>}
                  </div>

                  <div className={s.fieldGroup}>
                    <label className={s.fieldLabel}>Consultation Fee (EGP)</label>
                    <input
                      value={form.price}
                      onChange={e => setField('price', e.target.value)}
                      placeholder="e.g. 300"
                      className={`${s.input} ${errors.price ? s.inputError : ''}`}
                      type="number"
                      min={0}
                      max={99999}
                    />
                    {errors.price && <p className={s.fieldError}>{errors.price}</p>}
                  </div>
                </div>

                <div className={s.fieldGroup} style={{ marginTop: 16 }}>
                  <label className={s.fieldLabel}>
                    Professional Bio
                    <span className={s.charCount}>{form.bio.length}/2000</span>
                  </label>
                  <textarea
                    value={form.bio}
                    onChange={e => setField('bio', e.target.value.slice(0, 2000))}
                    placeholder="Write a brief professional bio..."
                    className={`${s.textarea} ${errors.bio ? s.inputError : ''}`}
                    rows={5}
                    maxLength={2000}
                  />
                  {errors.bio && <p className={s.fieldError}>{errors.bio}</p>}
                </div>
              </div>

              {/* Languages */}
              <div className={`card ${s.section}`}>
                <h2 className={s.sectionTitle}>
                  <span className="icon">language</span>
                  Languages
                </h2>
                <TagInput
                  label=""
                  values={form.languages}
                  onChange={v => setField('languages', v)}
                  max={10}
                  placeholder="e.g. Arabic"
                />
              </div>

              {/* Specializations */}
              <div className={`card ${s.section}`}>
                <h2 className={s.sectionTitle}>
                  <span className="icon">medical_services</span>
                  Specializations
                </h2>
                <TagInput
                  label=""
                  values={form.specializations}
                  onChange={v => setField('specializations', v)}
                  max={20}
                  placeholder="e.g. Heart Failure"
                />
              </div>

              {/* Conditions */}
              <div className={`card ${s.section}`}>
                <h2 className={s.sectionTitle}>
                  <span className="icon">healing</span>
                  Conditions Treated
                </h2>
                <TagInput
                  label=""
                  values={form.conditions}
                  onChange={v => setField('conditions', v)}
                  max={30}
                  placeholder="e.g. Hypertension"
                />
              </div>
            </div>

            {/* Right Column */}
            <div className={s.rightCol}>

              {/* Education */}
              <div className={`card ${s.section}`}>
                <div className={s.sectionHeader}>
                  <h2 className={s.sectionTitle}>
                    <span className="icon">school</span>
                    Education &amp; Training
                  </h2>
                  <button
                    type="button"
                    onClick={addEducation}
                    className="btn btn-secondary"
                    style={{ fontSize: 13, padding: '7px 14px' }}
                    disabled={form.education.length >= 10}
                  >
                    <span className="icon" style={{ fontSize: 16 }}>add</span>
                    Add
                  </button>
                </div>

                {form.education.length === 0 && (
                  <p className={s.emptyText}>No education added yet.</p>
                )}
                {form.education.map((ed, i) => (
                  <div key={i}>
                    <EducationItem
                      item={ed}
                      index={i}
                      onChange={val => updateEdu(i, val)}
                      onRemove={() => removeEdu(i)}
                    />
                    {errors[`edu_${i}`] && (
                      <p className={s.fieldError}>{errors[`edu_${i}`]}</p>
                    )}
                  </div>
                ))}
              </div>

              {/* Availability */}
              <div className={`card ${s.section}`}>
                <div className={s.sectionHeader}>
                  <h2 className={s.sectionTitle}>
                    <span className="icon">calendar_month</span>
                    Availability
                  </h2>
                  <button
                    type="button"
                    onClick={addDay}
                    className="btn btn-secondary"
                    style={{ fontSize: 13, padding: '7px 14px' }}
                    disabled={form.availability.length >= 7}
                  >
                    <span className="icon" style={{ fontSize: 16 }}>add</span>
                    Add Day
                  </button>
                </div>

                {form.availability.length === 0 && (
                  <p className={s.emptyText}>No availability set. Add working days.</p>
                )}
                {form.availability.map((av, i) => (
                  <AvailabilityRow
                    key={av.day}
                    day={av.day}
                    slots={av.slots}
                    onChange={slots => updateAvailDay(i, slots)}
                    onRemove={() => removeAvailDay(i)}
                  />
                ))}
              </div>

              {/* Save & Cancel */}
              <div className={s.saveWrap}>
                <button
                  type="submit"
                  className={`btn btn-primary ${s.saveBtn}`}
                  disabled={saving || uploading}
                >
                  {saving
                    ? <><div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Saving...</>
                    : <><span className="icon">save</span> Save Profile</>
                  }
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => navigate('/doctor/dashboard')}
                  disabled={saving}
                  style={{ width: '100%' }}
                >
                  Cancel
                </button>
              </div>

            </div>
          </div>
        </form>
      </div>
    </div>
  )
}