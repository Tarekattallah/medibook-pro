import { useState, useEffect } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../components/ui/Toast'
import Navbar from '../../components/layout/Navbar'

export default function BookingPage() {
  const { id } = useParams()
  const [sp] = useSearchParams()
  const { apiFetch } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [doctor, setDoctor] = useState(null)
  const [notes, setNotes]   = useState('')
  const [loading, setLoading] = useState(false)

  const slot = sp.get('slot'), date = sp.get('date'), type = sp.get('type') || 'in-person'

  useEffect(() => {
    apiFetch(`/doctors/${id}`).then(d => setDoctor(d.doctor)).catch(() => navigate('/search'))
  }, [id])

  const confirm = async () => {
    if (!slot || !date) { toast('Missing booking details', 'error'); return }
    setLoading(true)
    try {
      await apiFetch('/appointments', { method:'POST', body: JSON.stringify({ doctorId:id, date, timeSlot:slot, type, notes, price:doctor?.price }) })
      toast('Appointment booked successfully!')
      navigate('/booking-success')
    } catch (err) { toast(err.message, 'error') }
    finally { setLoading(false) }
  }

  if (!doctor) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh'}}><div className="spinner"/></div>

  const initials = doctor.name?.split(' ').filter((_,i)=>i>0).map(w=>w[0]).slice(0,2).join('') || 'DR'
  const formattedDate = date ? new Date(date).toLocaleDateString('en',{weekday:'long',year:'numeric',month:'long',day:'numeric'}) : ''

  return (
    <div className="page">
      <Navbar/>
      <div style={{maxWidth:560,margin:'40px auto',padding:'0 24px'}}>
        <button onClick={() => navigate(-1)} style={{display:'flex',alignItems:'center',gap:6,background:'none',border:'none',cursor:'pointer',color:'#64748b',fontSize:14,fontWeight:500,marginBottom:24}}>
          <span className="icon">arrow_back</span>Back
        </button>

        <h1 style={{fontSize:26,fontWeight:800,color:'#0b1c30',marginBottom:6}}>Confirm Appointment</h1>
        <p style={{fontSize:14,color:'#64748b',marginBottom:28}}>Review your booking details before confirming</p>

        {/* Doctor Card */}
        <div className="card" style={{padding:20,marginBottom:20}}>
          <div style={{display:'flex',gap:14,alignItems:'center',paddingBottom:16,marginBottom:16,borderBottom:'1px solid #f1f5f9'}}>
            <div style={{width:56,height:56,borderRadius:'50%',background:'linear-gradient(135deg,#bae6fd,#0ea5e9)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,fontWeight:800,color:'#fff',flexShrink:0}}>
              {initials}
            </div>
            <div>
              <div style={{fontWeight:700,fontSize:16,color:'#0b1c30'}}>{doctor.name}</div>
              <div style={{fontSize:14,color:'#0ea5e9',fontWeight:600}}>{doctor.specialty}</div>
            </div>
          </div>
          {[['calendar_month','Date',formattedDate],['schedule','Time',slot],['local_hospital','Type',type==='video'?'Video Call':'In-Person'],['location_on','Location',doctor.location],['payments','Fee',`EGP ${doctor.price}`]].map(([icon,label,val]) => (
            <div key={label} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 0',borderBottom:'1px solid #f8fafc'}}>
              <div style={{display:'flex',alignItems:'center',gap:8,fontSize:14,color:'#64748b'}}>
                <span className="icon" style={{fontSize:17}}>{icon}</span>{label}
              </div>
              <span style={{fontSize:14,fontWeight:600,color:'#0b1c30'}}>{val}</span>
            </div>
          ))}
        </div>

        {/* Notes */}
        <div className="card" style={{padding:20,marginBottom:20}}>
          <label className="label">Notes for the doctor <span style={{color:'#94a3b8',fontWeight:400}}>(optional)</span></label>
          <textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Describe your symptoms or reason for visit..."
            style={{width:'100%',height:90,padding:'10px 14px',border:'1.5px solid #e2e8f0',borderRadius:8,fontSize:14,fontFamily:'Inter,sans-serif',resize:'vertical',outline:'none'}}/>
        </div>

        <div style={{display:'flex',gap:10}}>
          <button onClick={() => navigate(-1)} className="btn btn-secondary" style={{flex:1,height:46}}>Cancel</button>
          <button onClick={confirm} className="btn btn-primary" style={{flex:2,height:46,fontSize:15}} disabled={loading}>
            {loading ? <div className="spinner" style={{width:20,height:20,borderWidth:2}}/> : 'Confirm Booking'}
          </button>
        </div>
        <p style={{fontSize:12,color:'#94a3b8',textAlign:'center',marginTop:12}}>Free cancellation up to 24 hours before the appointment</p>
      </div>
    </div>
  )
}
