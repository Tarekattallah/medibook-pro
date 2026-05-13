import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../components/ui/Toast'

export default function RegisterPage() {
  const [step, setStep]     = useState(1)
  const [role, setRole]     = useState('patient')
  const [form, setForm]     = useState({ name:'', email:'', password:'', phone:'', dateOfBirth:'' })
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()

  const set = k => e => setForm(f => ({...f, [k]: e.target.value}))

  const handleSubmit = async e => {
    e.preventDefault()
    if (step === 1) { setStep(2); return }
    setLoading(true)
    try {
      const user = await register({ ...form, role })
      toast('Account created successfully!')
      if (user.role === 'doctor') navigate('/doctor/onboarding')
      else navigate('/patient/dashboard')
    } catch (err) { toast(err.message, 'error') }
    finally { setLoading(false) }
  }

  return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#f8f9ff',padding:24}}>
      <div style={{width:'100%',maxWidth:520}}>
        {/* Logo */}
        <Link to="/" style={{display:'flex',alignItems:'center',gap:8,textDecoration:'none',justifyContent:'center',marginBottom:32}}>
          <div style={{width:34,height:34,background:'linear-gradient(135deg,#0ea5e9,#006591)',borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center'}}>
            <span style={{color:'#fff',fontWeight:800,fontSize:16}}>M</span>
          </div>
          <span style={{fontWeight:800,fontSize:17,color:'#0b1c30'}}>MediBook Pro</span>
        </Link>

        <div className="card" style={{padding:40}}>
          {/* Progress */}
          <div style={{display:'flex',gap:8,marginBottom:32}}>
            {[1,2].map(s => (
              <div key={s} style={{flex:1,height:4,borderRadius:99,background: s<=step ? '#0ea5e9' : '#e2e8f0',transition:'background .3s'}}/>
            ))}
          </div>

          <h2 style={{fontSize:24,fontWeight:800,color:'#0b1c30',marginBottom:4,letterSpacing:'-0.02em'}}>
            {step===1 ? 'Create your account' : 'Complete your profile'}
          </h2>
          <p style={{fontSize:14,color:'#64748b',marginBottom:28}}>
            {step===1 ? <>Already have one? <Link to="/login" style={{color:'#0ea5e9',fontWeight:600,textDecoration:'none'}}>Sign in</Link></> : 'Just a few more details'}
          </p>

          <form onSubmit={handleSubmit}>
            {step === 1 ? (
              <>
                {/* Role selector */}
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:24}}>
                  {[['patient','person','I am a Patient','Book appointments'],['doctor','stethoscope','I am a Doctor','Manage practice']].map(([r,icon,title,sub]) => (
                    <button key={r} type="button" onClick={() => setRole(r)}
                      style={{padding:'16px 14px',borderRadius:12,border:`2px solid ${role===r?'#0ea5e9':'#e2e8f0'}`,background:role===r?'#f0f9ff':'#fff',cursor:'pointer',textAlign:'left',transition:'all .15s'}}>
                      <span className="icon icon-filled" style={{fontSize:24,color:role===r?'#0ea5e9':'#94a3b8',display:'block',marginBottom:8}}>{icon}</span>
                      <div style={{fontSize:14,fontWeight:700,color:'#0b1c30'}}>{title}</div>
                      <div style={{fontSize:12,color:'#94a3b8',marginTop:2}}>{sub}</div>
                    </button>
                  ))}
                </div>
                <div className="form-group">
                  <label className="label">Full Name</label>
                  <input className="input" value={form.name} onChange={set('name')} placeholder="Ahmed Mohamed" required/>
                </div>
                <div className="form-group">
                  <label className="label">Email Address</label>
                  <input className="input" type="email" value={form.email} onChange={set('email')} placeholder="ahmed@example.com" required/>
                </div>
                <div className="form-group">
                  <label className="label">Password</label>
                  <input className="input" type="password" value={form.password} onChange={set('password')} placeholder="Min 8 characters" minLength={8} required/>
                </div>
              </>
            ) : (
              <>
                <div className="form-group">
                  <label className="label">Phone Number <span style={{color:'#94a3b8',fontWeight:400}}>(optional)</span></label>
                  <input className="input" value={form.phone} onChange={set('phone')} placeholder="+20 10 1234 5678"/>
                </div>
                <div className="form-group">
                  <label className="label">Date of Birth <span style={{color:'#94a3b8',fontWeight:400}}>(optional)</span></label>
                  <input className="input" type="date" value={form.dateOfBirth} onChange={set('dateOfBirth')}/>
                </div>
                {role === 'doctor' && (
                  <div style={{background:'#f0f9ff',border:'1.5px solid #bae6fd',borderRadius:10,padding:14,marginBottom:16,fontSize:13,color:'#0369a1'}}>
                    <span className="icon" style={{fontSize:16,verticalAlign:'middle',marginRight:6}}>info</span>
                    After registration, you'll complete your professional profile for verification.
                  </div>
                )}
              </>
            )}

            <div style={{display:'flex',gap:10,marginTop:8}}>
              {step === 2 && (
                <button type="button" onClick={() => setStep(1)} className="btn btn-secondary" style={{flex:1,height:46}}>← Back</button>
              )}
              <button type="submit" className="btn btn-primary" style={{flex:2,height:46,fontSize:15}} disabled={loading}>
                {loading ? <div className="spinner" style={{width:20,height:20,borderWidth:2}}/> : step===1 ? 'Continue →' : 'Create Account'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
