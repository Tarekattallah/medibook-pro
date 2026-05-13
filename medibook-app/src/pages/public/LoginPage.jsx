import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../components/ui/Toast'

export default function LoginPage() {
  const [email, setEmail]   = useState('')
  const [pass,  setPass]    = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const toast     = useToast()
  const navigate  = useNavigate()

  const handleSubmit = async e => {
    e.preventDefault()
    if (!email || !pass) { toast('Please enter email and password', 'error'); return }
    setLoading(true)
    try {
      const user = await login(email, pass)
      toast(`Welcome back, ${user.name}!`)
      if (user.role === 'admin')  navigate('/admin')
      else if (user.role === 'doctor') navigate('/doctor/dashboard')
      else navigate('/patient/dashboard')
    } catch (err) {
      toast(err.message || 'Login failed', 'error')
    } finally { setLoading(false) }
  }

  const demoLogin = async (role) => {
    const map = { patient:'patient@demo.com', doctor:'doctor@demo.com', admin:'admin@demo.com' }
    setEmail(map[role]); setPass('password')
    setLoading(true)
    try {
      const user = await login(map[role], 'password')
      if (user.role === 'admin')  navigate('/admin')
      else if (user.role === 'doctor') navigate('/doctor/dashboard')
      else navigate('/patient/dashboard')
    } catch (err) { toast(err.message, 'error') }
    finally { setLoading(false) }
  }

  return (
    <div style={{minHeight:'100vh',display:'flex',background:'#f8f9ff'}}>
      {/* Left panel */}
      <div style={{flex:1,background:'linear-gradient(160deg,#0ea5e9 0%,#006591 100%)',display:'flex',flexDirection:'column',justifyContent:'center',padding:'60px 64px',minWidth:0}} className="hide-mobile">
        <Link to="/" style={{display:'flex',alignItems:'center',gap:10,textDecoration:'none',marginBottom:64}}>
          <div style={{width:36,height:36,background:'rgba(255,255,255,.2)',borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center'}}>
            <span style={{color:'#fff',fontWeight:800,fontSize:17}}>M</span>
          </div>
          <span style={{color:'#fff',fontWeight:800,fontSize:18}}>MediBook Pro</span>
        </Link>
        <h1 style={{fontSize:42,fontWeight:800,color:'#fff',lineHeight:1.15,marginBottom:20,letterSpacing:'-0.02em'}}>
          Your health,<br/>our priority.
        </h1>
        <p style={{color:'rgba(255,255,255,.75)',fontSize:16,lineHeight:1.7,marginBottom:48}}>
          Book appointments with verified doctors in minutes. Manage your health records, appointments, and more.
        </p>
        {[['verified','Verified doctors only'],['bolt','Instant booking'],['event_available','Free cancellation']].map(([icon,text]) => (
          <div key={text} style={{display:'flex',alignItems:'center',gap:14,marginBottom:16}}>
            <div style={{width:36,height:36,borderRadius:'50%',background:'rgba(255,255,255,.15)',display:'flex',alignItems:'center',justifyContent:'center'}}>
              <span className="icon icon-filled" style={{fontSize:18,color:'#fff'}}>{icon}</span>
            </div>
            <span style={{color:'rgba(255,255,255,.9)',fontSize:15,fontWeight:500}}>{text}</span>
          </div>
        ))}
      </div>

      {/* Right panel */}
      <div style={{width:480,display:'flex',alignItems:'center',justifyContent:'center',padding:40,background:'#fff',boxShadow:'-8px 0 32px rgba(15,23,42,0.06)'}}>
        <div style={{width:'100%',maxWidth:380}}>
          <Link to="/" style={{display:'flex',alignItems:'center',gap:8,textDecoration:'none',marginBottom:40}}>
            <div style={{width:30,height:30,background:'linear-gradient(135deg,#0ea5e9,#006591)',borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center'}}>
              <span style={{color:'#fff',fontWeight:800,fontSize:13}}>M</span>
            </div>
            <span style={{fontWeight:800,fontSize:15,color:'#0b1c30'}}>MediBook Pro</span>
          </Link>

          <h2 style={{fontSize:26,fontWeight:800,color:'#0b1c30',marginBottom:6,letterSpacing:'-0.02em'}}>Sign in</h2>
          <p style={{fontSize:14,color:'#64748b',marginBottom:32}}>
            Don't have an account? <Link to="/register" style={{color:'#0ea5e9',fontWeight:600,textDecoration:'none'}}>Sign up free</Link>
          </p>

          {/* Demo buttons */}
          <div style={{background:'#f8fafc',border:'1.5px solid #e2e8f0',borderRadius:10,padding:14,marginBottom:24}}>
            <p style={{fontSize:12,fontWeight:700,color:'#64748b',marginBottom:10,textTransform:'uppercase',letterSpacing:'0.06em'}}>Quick Demo Login</p>
            <div style={{display:'flex',gap:8}}>
              {['patient','doctor','admin'].map(r => (
                <button key={r} onClick={() => demoLogin(r)} className="btn btn-secondary" style={{flex:1,fontSize:12,padding:'7px 8px',textTransform:'capitalize',borderRadius:8}}>
                  {r}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="label">Email Address</label>
              <input className="input" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" required/>
            </div>
            <div className="form-group">
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
                <label className="label" style={{marginBottom:0}}>Password</label>
                <Link to="/forgot-password" style={{fontSize:13,color:'#0ea5e9',textDecoration:'none',fontWeight:500}}>Forgot password?</Link>
              </div>
              <input className="input" type="password" value={pass} onChange={e=>setPass(e.target.value)} placeholder="••••••••" required/>
            </div>
            <button type="submit" className="btn btn-primary" style={{width:'100%',height:46,fontSize:15,marginTop:4}} disabled={loading}>
              {loading ? <div className="spinner" style={{width:20,height:20,borderWidth:2}}/> : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
