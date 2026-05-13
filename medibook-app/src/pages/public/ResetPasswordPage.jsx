import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useToast } from '../../components/ui/Toast'

export default function ResetPasswordPage() {
  const { token } = useParams()
  const navigate  = useNavigate()
  const toast     = useToast()
  const [newPassword, setNew]     = useState('')
  const [confirm,     setConfirm] = useState('')
  const [loading,     setLoading] = useState(false)
  const [done,        setDone]    = useState(false)

  const handleSubmit = async e => {
    e.preventDefault()
    if (newPassword !== confirm) { toast('Passwords do not match', 'error'); return }
    if (newPassword.length < 8)  { toast('Password must be at least 8 characters', 'error'); return }
    setLoading(true)
    try {
      const res  = await fetch(`/api/auth/reset-password/${token}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ newPassword }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      // Save token and redirect
      localStorage.setItem('mb_token', data.token)
      setDone(true)
      setTimeout(() => navigate('/patient/dashboard'), 2000)
    } catch (err) {
      toast(err.message || 'Invalid or expired link. Request a new one.', 'error')
    } finally { setLoading(false) }
  }

  return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#f8f9ff',padding:24}}>
      <div style={{width:'100%',maxWidth:420}}>
        <Link to="/" style={{display:'flex',alignItems:'center',gap:8,textDecoration:'none',justifyContent:'center',marginBottom:36}}>
          <div style={{width:34,height:34,background:'linear-gradient(135deg,#0ea5e9,#006591)',borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center'}}>
            <span style={{color:'#fff',fontWeight:800,fontSize:16}}>M</span>
          </div>
          <span style={{fontWeight:800,fontSize:17,color:'#0b1c30'}}>MediBook Pro</span>
        </Link>

        <div className="card" style={{padding:36}}>
          {!done ? (
            <>
              <div style={{width:56,height:56,borderRadius:'50%',background:'#e0f2fe',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 20px'}}>
                <span className="icon icon-filled" style={{fontSize:28,color:'#0ea5e9'}}>lock</span>
              </div>
              <h1 style={{fontSize:22,fontWeight:800,color:'#0b1c30',textAlign:'center',marginBottom:6,letterSpacing:'-0.02em'}}>Set new password</h1>
              <p style={{fontSize:14,color:'#64748b',textAlign:'center',marginBottom:28,lineHeight:1.6}}>
                Choose a strong password for your account.
              </p>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="label">New Password</label>
                  <input className="input" type="password" value={newPassword} onChange={e=>setNew(e.target.value)}
                    placeholder="Min 8 characters" minLength={8} required/>
                </div>
                <div className="form-group">
                  <label className="label">Confirm Password</label>
                  <input className="input" type="password" value={confirm} onChange={e=>setConfirm(e.target.value)}
                    placeholder="Repeat new password" required/>
                  {newPassword && confirm && newPassword !== confirm && (
                    <p style={{fontSize:12,color:'#dc2626',marginTop:5}}>Passwords don't match</p>
                  )}
                </div>
                <button type="submit" className="btn btn-primary" style={{width:'100%',height:46,fontSize:15}} disabled={loading}>
                  {loading ? <div className="spinner" style={{width:20,height:20,borderWidth:2}}/> : 'Reset Password'}
                </button>
              </form>
            </>
          ) : (
            <>
              <div style={{width:72,height:72,borderRadius:'50%',background:'#ecfdf5',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 20px'}}>
                <span className="icon icon-filled" style={{fontSize:36,color:'#059669'}}>check_circle</span>
              </div>
              <h1 style={{fontSize:22,fontWeight:800,color:'#0b1c30',textAlign:'center',marginBottom:8}}>Password updated!</h1>
              <p style={{fontSize:14,color:'#64748b',textAlign:'center'}}>Redirecting you to your dashboard...</p>
            </>
          )}
          <div style={{textAlign:'center',marginTop:20}}>
            <Link to="/login" style={{fontSize:13,color:'#0ea5e9',textDecoration:'none',fontWeight:600,display:'inline-flex',alignItems:'center',gap:4}}>
              <span className="icon" style={{fontSize:15}}>arrow_back</span> Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
