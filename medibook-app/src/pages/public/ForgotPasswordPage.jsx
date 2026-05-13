import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useToast } from '../../components/ui/Toast'

export default function ForgotPasswordPage() {
  const [email,   setEmail]   = useState('')
  const [sent,    setSent]    = useState(false)
  const [loading, setLoading] = useState(false)
  const toast = useToast()

  const handleSubmit = async e => {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    try {
      const res  = await fetch('/api/auth/forgot-password', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      setSent(true)
    } catch (err) {
      toast(err.message || 'Something went wrong. Try again.', 'error')
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
          {!sent ? (
            <>
              <div style={{width:56,height:56,borderRadius:'50%',background:'#e0f2fe',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 20px'}}>
                <span className="icon icon-filled" style={{fontSize:28,color:'#0ea5e9'}}>lock_reset</span>
              </div>
              <h1 style={{fontSize:22,fontWeight:800,color:'#0b1c30',textAlign:'center',marginBottom:6,letterSpacing:'-0.02em'}}>Forgot your password?</h1>
              <p style={{fontSize:14,color:'#64748b',textAlign:'center',marginBottom:28,lineHeight:1.6}}>
                Enter your email and we'll send you a link to reset your password.
              </p>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="label">Email Address</label>
                  <input className="input" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" required/>
                </div>
                <button type="submit" className="btn btn-primary" style={{width:'100%',height:46,fontSize:15}} disabled={loading}>
                  {loading ? <div className="spinner" style={{width:20,height:20,borderWidth:2}}/> : 'Send Reset Link'}
                </button>
              </form>
            </>
          ) : (
            <>
              <div style={{width:72,height:72,borderRadius:'50%',background:'#ecfdf5',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 20px'}}>
                <span className="icon icon-filled" style={{fontSize:36,color:'#059669'}}>mark_email_read</span>
              </div>
              <h1 style={{fontSize:22,fontWeight:800,color:'#0b1c30',textAlign:'center',marginBottom:8}}>Check your email</h1>
              <p style={{fontSize:14,color:'#64748b',textAlign:'center',lineHeight:1.7,marginBottom:8}}>
                If <strong>{email}</strong> is registered, you'll receive a reset link shortly.
              </p>
              <p style={{fontSize:12,color:'#94a3b8',textAlign:'center',marginBottom:24}}>
                Didn't receive it? Check your spam folder.
              </p>
              <button onClick={() => setSent(false)} className="btn btn-secondary" style={{width:'100%',marginBottom:12,fontSize:14}}>
                Try a different email
              </button>
            </>
          )}
          <div style={{textAlign:'center',marginTop:16}}>
            <Link to="/login" style={{fontSize:13,color:'#0ea5e9',textDecoration:'none',fontWeight:600,display:'inline-flex',alignItems:'center',gap:4}}>
              <span className="icon" style={{fontSize:15}}>arrow_back</span> Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
