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
  const [form, setForm] = useState({ specialty:'', licenseNumber:'', yearsExperience:'', price:'', location:'', bio:'', languages:'' })
  const [loading, setLoading] = useState(false)
  const set = k => e => setForm(f => ({...f, [k]: e.target.value}))

  const handleSubmit = async e => {
    e.preventDefault()
    setLoading(true)
    try {
      await apiFetch('/auth/update-profile', {
        method: 'PATCH',
        body: JSON.stringify({ ...form, yearsExperience: Number(form.yearsExperience), price: Number(form.price), languages: form.languages.split(',').map(l=>l.trim()) })
      })
      toast('Profile submitted for review!')
      navigate('/doctor/dashboard')
    } catch (err) { toast(err.message, 'error') }
    finally { setLoading(false) }
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
            <div className="form-group">
              <label className="label">Professional Bio *</label>
              <textarea value={form.bio} onChange={set('bio')} placeholder="Describe your experience, expertise, and approach to patient care..." required
                style={{width:'100%',height:110,padding:'10px 14px',border:'1.5px solid #e2e8f0',borderRadius:8,fontSize:14,fontFamily:'Inter,sans-serif',resize:'vertical',outline:'none'}}/>
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
