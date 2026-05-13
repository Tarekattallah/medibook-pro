import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../../components/layout/Navbar'
import { useAuth } from '../../context/AuthContext'

export default function PatientDashboard() {
  const { user, apiFetch } = useAuth()
  const [apts,    setApts]    = useState([])
  const [stats,   setStats]   = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      apiFetch('/appointments/my?limit=20'),
    ]).then(([aptsData]) => {
      const all = aptsData.appointments || []
      setApts(all)
      // Compute stats from appointments
      const uniqueDoctors = [...new Set(all.map(a => a.doctor?._id).filter(Boolean))]
      setStats({
        total:     all.length,
        upcoming:  all.filter(a => ['confirmed','pending'].includes(a.status)).length,
        completed: all.filter(a => a.status === 'completed').length,
        cancelled: all.filter(a => a.status === 'cancelled').length,
        doctors:   uniqueDoctors.length,
      })
    }).catch(()=>{}).finally(()=>setLoading(false))
  }, [])

  const upcoming = apts.filter(a => ['confirmed','pending'].includes(a.status)).slice(0, 3)
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="page">
      <Navbar/>
      <div style={{maxWidth:1100,margin:'0 auto',padding:'32px 24px'}}>

        {/* Header */}
        <div style={{marginBottom:32}}>
          <h1 style={{fontSize:28,fontWeight:800,color:'#0b1c30',letterSpacing:'-0.02em'}}>
            {greeting}, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p style={{fontSize:14,color:'#64748b',marginTop:4}}>
            {loading ? '...' : upcoming.length > 0 ? `You have ${upcoming.length} upcoming appointment${upcoming.length>1?'s':''}` : 'No upcoming appointments — book one today!'}
          </p>
        </div>

        {/* Stats row */}
        {!loading && stats && (
          <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:14,marginBottom:32}}>
            {[
              {label:'Total Visits',   value:stats.total,     icon:'calendar_month', bg:'#eff6ff', ic:'#2563eb'},
              {label:'Upcoming',       value:stats.upcoming,  icon:'event_available',bg:'#ecfdf5', ic:'#059669'},
              {label:'Completed',      value:stats.completed, icon:'task_alt',       bg:'#f5f3ff', ic:'#7c3aed'},
              {label:'Cancelled',      value:stats.cancelled, icon:'cancel',         bg:'#fef2f2', ic:'#dc2626'},
              {label:'Doctors Visited',value:stats.doctors,   icon:'stethoscope',    bg:'#fff7ed', ic:'#ea580c'},
            ].map(s => (
              <div key={s.label} className="card" style={{padding:16,textAlign:'center'}}>
                <div style={{width:40,height:40,borderRadius:10,background:s.bg,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 10px'}}>
                  <span className="icon icon-filled" style={{fontSize:22,color:s.ic}}>{s.icon}</span>
                </div>
                <div style={{fontSize:24,fontWeight:800,color:'#0b1c30'}}>{s.value}</div>
                <div style={{fontSize:11,color:'#94a3b8',marginTop:3,fontWeight:500}}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Quick Actions */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14,marginBottom:32}}>
          {[
            ['/search',              'search',        'Find a Doctor',      '#eff6ff','#2563eb'],
            ['/patient/appointments','calendar_month','My Appointments',    '#ecfdf5','#059669'],
            ['/patient/records',     'folder_open',   'Medical Records',    '#fff7ed','#ea580c'],
            ['/notifications',       'notifications', 'Notifications',      '#fdf4ff','#9333ea'],
          ].map(([href,icon,title,bg,ic]) => (
            <Link key={title} to={href} style={{textDecoration:'none'}} className="card">
              <div style={{padding:18,textAlign:'center'}}>
                <div style={{width:44,height:44,borderRadius:12,background:bg,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 12px'}}>
                  <span className="icon icon-filled" style={{fontSize:22,color:ic}}>{icon}</span>
                </div>
                <div style={{fontWeight:700,fontSize:13,color:'#0b1c30'}}>{title}</div>
              </div>
            </Link>
          ))}
        </div>

        <div style={{display:'grid',gridTemplateColumns:'1.6fr 1fr',gap:24,alignItems:'flex-start'}}>
          {/* Upcoming appointments */}
          <div>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
              <h2 style={{fontSize:18,fontWeight:700,color:'#0b1c30'}}>Upcoming Appointments</h2>
              <Link to="/patient/appointments" style={{fontSize:13,color:'#0ea5e9',textDecoration:'none',fontWeight:600}}>View all →</Link>
            </div>

            {loading ? <div className="spinner" style={{margin:'40px auto'}}/> :
             upcoming.length === 0 ? (
              <div className="card" style={{padding:40,textAlign:'center'}}>
                <span className="icon" style={{fontSize:48,color:'#cbd5e1',display:'block',marginBottom:12}}>calendar_today</span>
                <p style={{color:'#64748b',fontSize:14,marginBottom:16}}>No upcoming appointments</p>
                <Link to="/search" className="btn btn-primary" style={{fontSize:13}}>Book Now</Link>
              </div>
            ) : upcoming.map(a => (
              <div key={a._id} className="card" style={{padding:16,marginBottom:12,display:'flex',alignItems:'center',gap:14,transition:'all .2s'}}>
                <div style={{width:46,height:46,borderRadius:'50%',background:'linear-gradient(135deg,#bae6fd,#0ea5e9)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,color:'#fff',fontSize:16,flexShrink:0}}>
                  {a.doctor?.name?.[4]||'D'}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:700,fontSize:14,color:'#0b1c30',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{a.doctor?.name}</div>
                  <div style={{fontSize:13,color:'#0ea5e9',fontWeight:600}}>{a.doctor?.specialty}</div>
                  <div style={{fontSize:12,color:'#64748b',marginTop:2,display:'flex',gap:8,flexWrap:'wrap'}}>
                    <span>{new Date(a.date).toLocaleDateString('en',{weekday:'short',month:'short',day:'numeric'})}</span>
                    <span>· {a.timeSlot}</span>
                    <span>· {a.type}</span>
                  </div>
                </div>
                <span className={`badge badge-${a.status}`} style={{flexShrink:0}}>{a.status}</span>
              </div>
            ))}
          </div>

          {/* Right: Tips + CTA */}
          <div>
            <h2 style={{fontSize:18,fontWeight:700,color:'#0b1c30',marginBottom:16}}>Health Tips</h2>
            {['💧 Drink 8 glasses of water daily','🏃 30 min of exercise, 5 days a week','😴 Aim for 7–9 hours of sleep','🥗 Eat more fruits and vegetables','🏥 Annual checkups catch issues early'].map(tip => (
              <div key={tip} className="card" style={{padding:12,marginBottom:8}}>
                <p style={{fontSize:13,color:'#475569',lineHeight:1.5}}>{tip}</p>
              </div>
            ))}
            <div style={{background:'linear-gradient(135deg,#0ea5e9,#006591)',borderRadius:12,padding:20,marginTop:16}}>
              <h3 style={{fontSize:15,fontWeight:700,color:'#fff',marginBottom:6}}>Ready for a checkup?</h3>
              <p style={{fontSize:13,color:'rgba(255,255,255,.8)',marginBottom:14,lineHeight:1.5}}>Find a verified specialist and book today</p>
              <Link to="/search" style={{display:'inline-flex',alignItems:'center',gap:6,background:'#fff',color:'#0ea5e9',fontWeight:700,fontSize:13,padding:'8px 16px',borderRadius:8,textDecoration:'none'}}>
                <span className="icon" style={{fontSize:16}}>search</span> Find a Doctor
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
