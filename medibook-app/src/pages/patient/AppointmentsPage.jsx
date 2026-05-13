import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../../components/layout/Navbar'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../components/ui/Toast'

const TABS   = ['all','confirmed','pending','cancelled','completed']
const DAYS   = ['Mon','Tue','Wed','Thu','Fri','Sat']
const SLOTS  = ['09:00','09:30','10:00','10:30','11:00','11:30','12:00','14:00','14:30','15:00','15:30','16:00','16:30','17:00']

function RescheduleModal({ appointment, onClose, onSaved }) {
  const { apiFetch } = useAuth()
  const toast = useToast()
  const [selDay,  setSelDay]  = useState(0)
  const [selSlot, setSelSlot] = useState('')
  const [slots,   setSlots]   = useState([])
  const [saving,  setSaving]  = useState(false)

  useEffect(() => {
    const date = new Date(); date.setDate(date.getDate() + selDay)
    const iso  = date.toISOString().split('T')[0]
    apiFetch(`/doctors/${appointment.doctor?._id}/availability?date=${iso}`)
      .then(d => setSlots(d.slots||[])).catch(() => setSlots([]))
    setSelSlot('')
  }, [selDay])

  const save = async () => {
    if (!selSlot) { toast('Please select a time slot', 'error'); return }
    setSaving(true)
    const date = new Date(); date.setDate(date.getDate() + selDay)
    try {
      await apiFetch(`/appointments/${appointment._id}/reschedule`, {
        method: 'PATCH',
        body: JSON.stringify({ date: date.toISOString().split('T')[0], timeSlot: selSlot })
      })
      toast('Appointment rescheduled!')
      onSaved()
    } catch (err) { toast(err.message, 'error') }
    finally { setSaving(false) }
  }

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(15,23,42,.5)',backdropFilter:'blur(4px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000,padding:24}}>
      <div className="card fade-in" style={{width:'100%',maxWidth:420,padding:28}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20}}>
          <h2 style={{fontSize:18,fontWeight:800,color:'#0b1c30'}}>Reschedule Appointment</h2>
          <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',color:'#94a3b8'}}>
            <span className="icon" style={{fontSize:22}}>close</span>
          </button>
        </div>

        {/* Current */}
        <div style={{background:'#f8fafc',borderRadius:10,padding:12,marginBottom:20,fontSize:13}}>
          <div style={{color:'#64748b',marginBottom:4}}>Current appointment:</div>
          <div style={{fontWeight:700,color:'#0b1c30'}}>{appointment.doctor?.name} — {new Date(appointment.date).toLocaleDateString('en',{month:'short',day:'numeric'})} at {appointment.timeSlot}</div>
        </div>

        {/* Day */}
        <div style={{marginBottom:16}}>
          <div style={{fontSize:12,fontWeight:700,color:'#64748b',textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:10}}>New Date</div>
          <div style={{display:'flex',gap:6,overflowX:'auto',paddingBottom:4}}>
            {DAYS.map((d,i) => {
              const date=new Date(); date.setDate(date.getDate()+i+1)
              return (
                <button key={d} onClick={() => setSelDay(i)}
                  style={{flexShrink:0,padding:'8px 10px',borderRadius:8,border:`1.5px solid ${selDay===i?'#0ea5e9':'#e2e8f0'}`,background:selDay===i?'#f0f9ff':'#fff',cursor:'pointer',textAlign:'center',minWidth:48}}>
                  <div style={{fontSize:10,color:selDay===i?'#0ea5e9':'#94a3b8',fontWeight:700}}>{d}</div>
                  <div style={{fontSize:13,fontWeight:700,color:selDay===i?'#0ea5e9':'#374151'}}>{date.getDate()}</div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Slots */}
        <div style={{marginBottom:20}}>
          <div style={{fontSize:12,fontWeight:700,color:'#64748b',textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:10}}>New Time</div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:6}}>
            {slots.length === 0 && <p style={{gridColumn:'1/-1',fontSize:13,color:'#94a3b8',textAlign:'center',padding:'10px 0'}}>No slots</p>}
            {slots.map(s => (
              <button key={s.time} disabled={!s.available} onClick={() => setSelSlot(s.time)}
                style={{padding:'7px 4px',borderRadius:7,border:`1.5px solid ${selSlot===s.time?'#0ea5e9':s.available?'#e2e8f0':'#f1f5f9'}`,background:selSlot===s.time?'#0ea5e9':s.available?'#fff':'#f8fafc',color:selSlot===s.time?'#fff':s.available?'#374151':'#cbd5e1',fontSize:11,fontFamily:'JetBrains Mono,monospace',fontWeight:600,cursor:s.available?'pointer':'not-allowed'}}>
                {s.time}
              </button>
            ))}
          </div>
        </div>

        <div style={{display:'flex',gap:10}}>
          <button onClick={onClose} className="btn btn-secondary" style={{flex:1}}>Cancel</button>
          <button onClick={save} disabled={!selSlot||saving} className="btn btn-primary" style={{flex:2}}>
            {saving ? <div className="spinner" style={{width:18,height:18,borderWidth:2}}/> : 'Confirm Reschedule'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AppointmentsPage() {
  const { apiFetch } = useAuth()
  const toast = useToast()
  const [apts,    setApts]    = useState([])
  const [tab,     setTab]     = useState('all')
  const [loading, setLoading] = useState(true)
  const [rescheduleApt, setRescheduleApt] = useState(null)

  const load = () => {
    setLoading(true)
    const qs = tab !== 'all' ? `?status=${tab}` : ''
    apiFetch(`/appointments/my${qs}`).then(d => setApts(d.appointments||[])).catch(()=>{}).finally(()=>setLoading(false))
  }

  useEffect(() => { load() }, [tab])

  const cancel = async id => {
    if (!window.confirm('Cancel this appointment?')) return
    try {
      await apiFetch(`/appointments/${id}/cancel`, { method:'PATCH', body: JSON.stringify({ reason:'Cancelled by patient' }) })
      toast('Appointment cancelled')
      load()
    } catch (err) { toast(err.message, 'error') }
  }

  return (
    <div className="page">
      <Navbar/>
      {rescheduleApt && <RescheduleModal appointment={rescheduleApt} onClose={() => setRescheduleApt(null)} onSaved={() => { setRescheduleApt(null); load() }}/>}

      <div style={{maxWidth:860,margin:'0 auto',padding:'32px 24px'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:28,flexWrap:'wrap',gap:12}}>
          <h1 style={{fontSize:26,fontWeight:800,color:'#0b1c30',letterSpacing:'-0.02em'}}>My Appointments</h1>
          <Link to="/search" className="btn btn-primary" style={{fontSize:14}}>
            <span className="icon" style={{fontSize:17}}>add</span> Book New
          </Link>
        </div>

        {/* Tabs */}
        <div style={{display:'flex',gap:4,background:'#f1f5f9',borderRadius:10,padding:4,marginBottom:24,width:'fit-content',flexWrap:'wrap'}}>
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{padding:'7px 16px',borderRadius:7,fontSize:13,fontWeight:600,border:'none',cursor:'pointer',textTransform:'capitalize',background:tab===t?'#fff':'transparent',color:tab===t?'#0b1c30':'#64748b',boxShadow:tab===t?'0 1px 4px rgba(0,0,0,.08)':'none',transition:'all .15s'}}>
              {t}
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? <div className="spinner" style={{margin:'60px auto'}}/> :
         apts.length === 0 ? (
          <div style={{textAlign:'center',padding:'60px 24px'}}>
            <span className="icon" style={{fontSize:56,color:'#cbd5e1',display:'block',marginBottom:16}}>calendar_today</span>
            <h3 style={{fontSize:18,fontWeight:700,color:'#0b1c30',marginBottom:8}}>No {tab!=='all'?tab+' ':''} appointments</h3>
            <Link to="/search" className="btn btn-primary" style={{marginTop:8,fontSize:14}}>Book an Appointment</Link>
          </div>
        ) : apts.map(a => (
          <div key={a._id} className="card" style={{padding:20,marginBottom:14}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,flexWrap:'wrap'}}>
              <div style={{display:'flex',alignItems:'center',gap:14}}>
                <div style={{width:52,height:52,borderRadius:'50%',background:'linear-gradient(135deg,#bae6fd,#0ea5e9)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:18,color:'#fff',flexShrink:0}}>
                  {a.doctor?.name?.[4]||'D'}
                </div>
                <div>
                  <div style={{fontWeight:700,fontSize:15,color:'#0b1c30'}}>{a.doctor?.name}</div>
                  <div style={{fontSize:13,color:'#0ea5e9',fontWeight:600}}>{a.doctor?.specialty}</div>
                  <div style={{fontSize:12,color:'#64748b',marginTop:3,display:'flex',gap:10,flexWrap:'wrap'}}>
                    <span style={{display:'flex',alignItems:'center',gap:3}}>
                      <span className="icon" style={{fontSize:14}}>calendar_month</span>
                      {new Date(a.date).toLocaleDateString('en',{weekday:'short',month:'short',day:'numeric',year:'numeric'})}
                    </span>
                    <span style={{display:'flex',alignItems:'center',gap:3}}>
                      <span className="icon" style={{fontSize:14}}>schedule</span>{a.timeSlot}
                    </span>
                    <span style={{display:'flex',alignItems:'center',gap:3}}>
                      <span className="icon" style={{fontSize:14}}>{a.type==='video'?'videocam':'local_hospital'}</span>
                      {a.type}
                    </span>
                  </div>
                </div>
              </div>

              <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
                <span className={`badge badge-${a.status}`}>{a.status}</span>
                {a.status === 'confirmed' && <>
                  <button onClick={() => setRescheduleApt(a)} className="btn btn-secondary" style={{fontSize:12,padding:'6px 12px'}}>
                    <span className="icon" style={{fontSize:15}}>edit_calendar</span> Reschedule
                  </button>
                  <button onClick={() => cancel(a._id)} className="btn btn-danger" style={{fontSize:12,padding:'6px 12px'}}>
                    Cancel
                  </button>
                </>}
                {a.status === 'pending' && (
                  <button onClick={() => cancel(a._id)} className="btn btn-danger" style={{fontSize:12,padding:'6px 12px'}}>Cancel</button>
                )}
                {a.status === 'cancelled' && (
                  <Link to={`/doctor/${a.doctor?._id}`} className="btn btn-secondary" style={{fontSize:12,padding:'6px 12px',textDecoration:'none'}}>Rebook</Link>
                )}
                {a.status === 'completed' && (
                  <Link to={`/doctor/${a.doctor?._id}`} className="btn btn-secondary" style={{fontSize:12,padding:'6px 12px',textDecoration:'none'}}>
                    <span className="icon" style={{fontSize:15}}>star</span> Review
                  </Link>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
