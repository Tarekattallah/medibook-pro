import { useState, useEffect } from 'react'
import Navbar from '../../components/layout/Navbar'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../components/ui/Toast'

export default function DoctorDashboard() {
  const { user, apiFetch } = useAuth()
  const toast = useToast()
  const [apts, setApts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]
    apiFetch(`/appointments/doctor?date=${today}`).then(d => setApts(d.appointments||[])).catch(()=>{}).finally(()=>setLoading(false))
  }, [])

  const complete = async (id) => {
    try {
      await apiFetch(`/appointments/${id}/complete`, { method:'PATCH', body: JSON.stringify({}) })
      toast('Appointment marked as completed')
      setApts(prev => prev.map(a => a._id===id ? {...a, status:'completed'} : a))
    } catch (err) { toast(err.message, 'error') }
  }

  const today = new Date().toLocaleDateString('en',{weekday:'long',year:'numeric',month:'long',day:'numeric'})

  return (
    <div className="page">
      <Navbar/>
      <div style={{maxWidth:1000,margin:'0 auto',padding:'32px 24px'}}>
        <div style={{marginBottom:32}}>
          <h1 style={{fontSize:26,fontWeight:800,color:'#0b1c30'}}>Doctor Dashboard</h1>
          <p style={{fontSize:14,color:'#64748b',marginTop:4}}>{today}</p>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16,marginBottom:32}}>
          {[['Today\'s Patients',apts.filter(a=>a.status!=='cancelled').length,'people','#eff6ff','#2563eb'],['Confirmed',apts.filter(a=>a.status==='confirmed').length,'check_circle','#ecfdf5','#059669'],['Pending',apts.filter(a=>a.status==='pending').length,'pending','#fffbeb','#d97706'],['Completed',apts.filter(a=>a.status==='completed').length,'task_alt','#f5f3ff','#7c3aed']].map(([label,val,icon,bg,ic])=>(
            <div key={label} className="card" style={{padding:20}}>
              <div style={{width:40,height:40,borderRadius:10,background:bg,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:12}}>
                <span className="icon icon-filled" style={{fontSize:22,color:ic}}>{icon}</span>
              </div>
              <div style={{fontSize:26,fontWeight:800,color:'#0b1c30'}}>{val}</div>
              <div style={{fontSize:13,color:'#64748b',marginTop:2}}>{label}</div>
            </div>
          ))}
        </div>

        <div className="card" style={{padding:24}}>
          <h2 style={{fontSize:18,fontWeight:700,color:'#0b1c30',marginBottom:20}}>Today's Schedule</h2>
          {loading ? <div className="spinner" style={{margin:'40px auto'}}/> :
           apts.length === 0 ? (
            <div style={{textAlign:'center',padding:'40px 0',color:'#94a3b8'}}>
              <span className="icon" style={{fontSize:48,display:'block',marginBottom:12}}>calendar_today</span>
              <p>No appointments today</p>
            </div>
          ) : apts.map(a => (
            <div key={a._id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'16px 0',borderBottom:'1px solid #f1f5f9',gap:12,flexWrap:'wrap'}}>
              <div style={{display:'flex',alignItems:'center',gap:12}}>
                <div style={{width:38,height:38,borderRadius:'50%',background:'#f0f9ff',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:14,color:'#0ea5e9',flexShrink:0}}>
                  {a.patient?.name?.[0] || 'P'}
                </div>
                <div>
                  <div style={{fontWeight:700,fontSize:14,color:'#0b1c30'}}>{a.patient?.name}</div>
                  <div style={{fontSize:12,color:'#64748b',marginTop:2,display:'flex',gap:10}}>
                    <span>{a.timeSlot}</span>
                    <span>·</span>
                    <span style={{textTransform:'capitalize'}}>{a.type}</span>
                    {a.patient?.phone && <><span>·</span><span>{a.patient.phone}</span></>}
                  </div>
                </div>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <span className={`badge badge-${a.status}`}>{a.status}</span>
                {a.type === 'video' && a.status === 'confirmed' && (
                  <button className="btn btn-primary" style={{fontSize:12,padding:'6px 12px'}}>
                    <span className="icon" style={{fontSize:14}}>videocam</span> Join
                  </button>
                )}
                {a.status === 'confirmed' && (
                  <button onClick={() => complete(a._id)} className="btn btn-secondary" style={{fontSize:12,padding:'6px 12px'}}>Complete</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
