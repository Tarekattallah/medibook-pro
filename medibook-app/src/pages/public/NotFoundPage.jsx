import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function NotFoundPage() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const home = user?.role === 'admin' ? '/admin'
    : user?.role === 'doctor' ? '/doctor/dashboard'
    : '/'

  return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#f8f9ff',padding:24}}>
      <div style={{textAlign:'center',maxWidth:480}}>
        {/* Big 404 */}
        <div style={{fontSize:120,fontWeight:800,lineHeight:1,background:'linear-gradient(135deg,#0ea5e9,#006591)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',marginBottom:8,letterSpacing:'-0.05em'}}>
          404
        </div>
        <h1 style={{fontSize:26,fontWeight:800,color:'#0b1c30',marginBottom:10,letterSpacing:'-0.02em'}}>
          Page not found
        </h1>
        <p style={{fontSize:15,color:'#64748b',lineHeight:1.7,marginBottom:36}}>
          The page you're looking for doesn't exist or has been moved.
        </p>

        {/* Quick links */}
        <div style={{display:'flex',gap:10,justifyContent:'center',flexWrap:'wrap',marginBottom:40}}>
          <button onClick={() => navigate(home)} className="btn btn-primary" style={{fontSize:14,padding:'10px 24px'}}>
            <span className="icon" style={{fontSize:17}}>home</span>
            Go Home
          </button>
          <button onClick={() => navigate(-1)} className="btn btn-secondary" style={{fontSize:14,padding:'10px 24px'}}>
            <span className="icon" style={{fontSize:17}}>arrow_back</span>
            Go Back
          </button>
          <button onClick={() => navigate('/search')} className="btn btn-secondary" style={{fontSize:14,padding:'10px 24px'}}>
            <span className="icon" style={{fontSize:17}}>search</span>
            Find Doctors
          </button>
        </div>

        <p style={{fontSize:13,color:'#94a3b8'}}>
          Still lost? <a href="mailto:support@medibook.com" style={{color:'#0ea5e9',textDecoration:'none',fontWeight:600}}>Contact support</a>
        </p>
      </div>
    </div>
  )
}
