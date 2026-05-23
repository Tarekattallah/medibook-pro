import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/layout/Navbar'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../components/ui/Toast'

const SPECS = ['Cardiology','Neurology','Dermatology','Orthopedics','Pediatrics','Psychiatry','Ophthalmology','Dentistry','Gynecology','General Practice']

export default function DoctorOnboardingPage() {
  const { apiFetch } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  
  // إضافة الحقول الجديدة مع الحقول الحالية
  const [form, setForm] = useState({
    specialty: '',
    licenseNumber: '',
    yearsExperience: '',
    price: '',
    location: '',
    bio: '',
    languages: '',
    specializations: [],      // جديد
    conditions: [],           // جديد
    education: []             // جديد
  })

  const [tagInputs, setTagInputs] = useState({
    specializations: '',
    conditions: ''
  })

  const [loading, setLoading] = useState(false)

  const set = k => e => setForm(f => ({...f, [k]: e.target.value}))

  // ── Tag management helpers ────────────────────────────
  const addTag = (field) => {
    const val = tagInputs[field].trim()
    if (!val) return
    if (form[field].includes(val)) {
      toast('Already added.', 'warn')
      return
    }
    if (field === 'specializations' && form[field].length >= 20) {
      toast('Max 20 specializations.', 'warn')
      return
    }
    if (field === 'conditions' && form[field].length >= 30) {
      toast('Max 30 conditions.', 'warn')
      return
    }
    setForm(f => ({ ...f, [field]: [...f[field], val] }))
    setTagInputs(prev => ({ ...prev, [field]: '' }))
  }

  const removeTag = (field, tag) => {
    setForm(f => ({ ...f, [field]: f[field].filter(t => t !== tag) }))
  }

  const handleTagKey = (field, e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag(field)
    }
  }

  // ── Education management ──────────────────────────────
  const addEducation = () => {
    if (form.education.length >= 10) {
      toast('Max 10 education items.', 'warn')
      return
    }
    setForm(f => ({ ...f, education: [...f.education, { degree: '', institution: '', year: '' }] }))
  }

  const updateEdu = (index, field, value) => {
    const updated = [...form.education]
    updated[index] = { ...updated[index], [field]: value }
    setForm(f => ({ ...f, education: updated }))
  }

  const removeEdu = (index) => {
    setForm(f => ({ ...f, education: f.education.filter((_, i) => i !== index) }))
  }

  // ── Submit ─────────────────────────────────────────────
  const handleSubmit = async e => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = {
        ...form,
        yearsExperience: Number(form.yearsExperience),
        price: Number(form.price),
        languages: form.languages.split(',').map(l => l.trim()).filter(Boolean),
        specializations: form.specializations,    // مضمنة
        conditions: form.conditions,              // مضمنة
        education: form.education                 // مضمنة
      }
      await apiFetch('/auth/update-profile', {
        method: 'PATCH',
        body: JSON.stringify(payload)
      })
      toast('Profile submitted for review!')
      navigate('/doctor/dashboard')
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page">
      <Navbar/>
      <div style={{maxWidth:600,margin:'40px auto',padding:'0 24px'}}>
        <div style={{textAlign:'center',marginBottom:32}}>
          <div style={{width:56,height:56,borderRadius:'50%',background:'#e0f2fe',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px'}}>
            <span className="icon icon-filled" style={{fontSize:28,color:'#0ea5e9'}}>stethoscope</span>
          </div>
          <h1 style={{fontSize:24,fontWeight:800,color:'#0b1c30',marginBottom:6}}>Complete Your Doctor Profile</h1>
          <p style={{fontSize:14,color:'#64748b'}}>Submit your professional information for verification</p>
        </div>

        <div className="card" style={{padding:32}}>
          <form onSubmit={handleSubmit}>
            {/* القسم الأساسي لم يتغير */}
            <div className="form-group">
              <label className="label">Medical Specialty *</label>
              <select value={form.specialty} onChange={set('specialty')} className="input" required style={{cursor:'pointer'}}>
                <option value="">Select specialty</option>
                {SPECS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
              <div className="form-group">
                <label className="label">License Number *</label>
                <input className="input" value={form.licenseNumber} onChange={set('licenseNumber')} placeholder="MED-XXXXX" required/>
              </div>
              <div className="form-group">
                <label className="label">Years of Experience *</label>
                <input className="input" type="number" min={0} max={60} value={form.yearsExperience} onChange={set('yearsExperience')} placeholder="e.g. 10" required/>
              </div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
              <div className="form-group">
                <label className="label">Consultation Fee (EGP) *</label>
                <input className="input" type="number" min={0} value={form.price} onChange={set('price')} placeholder="e.g. 350" required/>
              </div>
              <div className="form-group">
                <label className="label">Location / Clinic *</label>
                <input className="input" value={form.location} onChange={set('location')} placeholder="Cairo, Nasr City" required/>
              </div>
            </div>
            <div className="form-group">
              <label className="label">Languages (comma separated)</label>
              <input className="input" value={form.languages} onChange={set('languages')} placeholder="Arabic, English"/>
            </div>

            {/* ── Specializations (جديد) ── */}
            <div className="form-group">
              <label className="label">Specializations</label>
              <div style={{display:'flex', flexWrap:'wrap', gap:8, marginBottom:8}}>
                {form.specializations.map(tag => (
                  <span key={tag} style={{background:'#e0f2fe',color:'#0284c7',fontSize:13,fontWeight:600,padding:'4px 10px',borderRadius:99,display:'inline-flex',alignItems:'center',gap:6}}>
                    {tag}
                    <button type="button" onClick={() => removeTag('specializations', tag)} style={{background:'none',border:'none',cursor:'pointer',color:'#0284c7',fontSize:16,lineHeight:1}}>×</button>
                  </span>
                ))}
              </div>
              <div style={{display:'flex', gap:8}}>
                <input
                  className="input"
                  value={tagInputs.specializations}
                  onChange={e => setTagInputs(prev => ({ ...prev, specializations: e.target.value }))}
                  onKeyDown={e => handleTagKey('specializations', e)}
                  placeholder="e.g. Heart Failure"
                />
                <button type="button" className="btn btn-secondary" onClick={() => addTag('specializations')} style={{padding:'0 16px', whiteSpace:'nowrap'}}>Add</button>
              </div>
            </div>

            {/* ── Conditions (جديد) ── */}
            <div className="form-group">
              <label className="label">Conditions Treated</label>
              <div style={{display:'flex', flexWrap:'wrap', gap:8, marginBottom:8}}>
                {form.conditions.map(tag => (
                  <span key={tag} style={{background:'#e0f2fe',color:'#0284c7',fontSize:13,fontWeight:600,padding:'4px 10px',borderRadius:99,display:'inline-flex',alignItems:'center',gap:6}}>
                    {tag}
                    <button type="button" onClick={() => removeTag('conditions', tag)} style={{background:'none',border:'none',cursor:'pointer',color:'#0284c7',fontSize:16,lineHeight:1}}>×</button>
                  </span>
                ))}
              </div>
              <div style={{display:'flex', gap:8}}>
                <input
                  className="input"
                  value={tagInputs.conditions}
                  onChange={e => setTagInputs(prev => ({ ...prev, conditions: e.target.value }))}
                  onKeyDown={e => handleTagKey('conditions', e)}
                  placeholder="e.g. Hypertension"
                />
                <button type="button" className="btn btn-secondary" onClick={() => addTag('conditions')} style={{padding:'0 16px', whiteSpace:'nowrap'}}>Add</button>
              </div>
            </div>

            <div className="form-group">
              <label className="label">Professional Bio *</label>
              <textarea value={form.bio} onChange={set('bio')} placeholder="Describe your experience, expertise, and approach to patient care..." required
                style={{width:'100%',height:110,padding:'10px 14px',border:'1.5px solid #e2e8f0',borderRadius:8,fontSize:14,fontFamily:'Inter,sans-serif',resize:'vertical',outline:'none'}}/>
            </div>

            {/* ── Education (جديد) ── */}
            <div className="form-group">
              <label className="label">Education & Training</label>
              {form.education.map((edu, idx) => (
                <div key={idx} style={{border:'1.5px solid #e2e8f0',borderRadius:12,padding:16,marginBottom:12}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
                    <span style={{fontSize:13,fontWeight:700,color:'#64748b'}}>Education #{idx+1}</span>
                    <button type="button" onClick={() => removeEdu(idx)} style={{background:'none',border:'none',color:'#ef4444',cursor:'pointer',padding:4}}><span className="icon">delete</span></button>
                  </div>
                  <div style={{display:'flex',flexDirection:'column',gap:12}}>
                    <input className="input" placeholder="Degree (e.g. MD)" value={edu.degree} onChange={e => updateEdu(idx, 'degree', e.target.value)} />
                    <input className="input" placeholder="Institution (e.g. Cairo University)" value={edu.institution} onChange={e => updateEdu(idx, 'institution', e.target.value)} />
                    <input className="input" placeholder="Year (e.g. 2018 or 2016-2018)" value={edu.year} onChange={e => updateEdu(idx, 'year', e.target.value)} />
                  </div>
                </div>
              ))}
              <button type="button" className="btn btn-secondary" onClick={addEducation} style={{width:'100%',marginTop:8}}>
                <span className="icon" style={{fontSize:16,marginRight:6}}>add</span> Add Education
              </button>
            </div>

            <button type="submit" className="btn btn-primary" style={{width:'100%',height:46,fontSize:15}} disabled={loading}>
              {loading ? <div className="spinner" style={{width:20,height:20,borderWidth:2}}/> : 'Submit for Verification'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}