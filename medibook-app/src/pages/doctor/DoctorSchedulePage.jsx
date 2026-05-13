import { useState, useEffect } from 'react'
import Navbar from '../../components/layout/Navbar'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../components/ui/Toast'

const ALL_SLOTS = ['08:00','08:30','09:00','09:30','10:00','10:30','11:00','11:30','12:00','13:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30','17:00','17:30','18:00']
const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']

export default function DoctorSchedulePage() {
  const { user, apiFetch } = useAuth()
  const toast = useToast()
  const [saving, setSaving] = useState(false)

  // availability: { Mon: ['09:00','10:00',...], Tue: [...], ... }
  const [avail, setAvail] = useState(() => {
    const init = {}
    DAYS.forEach(d => { init[d] = [] })
    return init
  })

  const [apts, setApts] = useState([])
  const [selDay, setSelDay] = useState(() => {
    const idx = new Date().getDay()
    return DAYS[idx === 0 ? 6 : idx - 1]
  })

  // Load doctor's current availability from profile
  useEffect(() => {
    if (user?.availability?.length) {
      const map = {}
      DAYS.forEach(d => { map[d] = [] })
      user.availability.forEach(({ day, slots }) => { if (map[day] !== undefined) map[day] = slots || [] })
      setAvail(map)
    }
  }, [user])

  // Load appointments for selected day
  useEffect(() => {
    const today = new Date()
    const dayIdx = DAYS.indexOf(selDay)
    const diff   = dayIdx - (today.getDay() === 0 ? 6 : today.getDay() - 1)
    const date   = new Date(today)
    date.setDate(date.getDate() + diff)
    const iso = date.toISOString().split('T')[0]
    apiFetch(`/appointments/doctor?date=${iso}`)
      .then(d => setApts(d.appointments || []))
      .catch(() => setApts([]))
  }, [selDay])

  const toggleSlot = (day, slot) => {
    setAvail(prev => {
      const slots = prev[day].includes(slot)
        ? prev[day].filter(s => s !== slot)
        : [...prev[day], slot].sort()
      return { ...prev, [day]: slots }
    })
  }

  const toggleDay = (day) => {
    setAvail(prev => {
      const hasAll = ALL_SLOTS.every(s => prev[day].includes(s))
      return { ...prev, [day]: hasAll ? [] : [...ALL_SLOTS] }
    })
  }

  const saveSchedule = async () => {
    setSaving(true)
    try {
      const availability = DAYS.map(day => ({ day, slots: avail[day] }))
      await apiFetch('/auth/update-profile', { method:'PATCH', body: JSON.stringify({ availability }) })
      toast('Schedule saved!')
    } catch (err) { toast(err.message, 'error') }
    finally { setSaving(false) }
  }

  const bookedSlots = apts.map(a => a.timeSlot)

  return (
    <div className="page">
      <Navbar/>
      <div style={{maxWidth:1000,margin:'0 auto',padding:'32px 24px'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:28,flexWrap:'wrap',gap:12}}>
          <div>
            <h1 style={{fontSize:26,fontWeight:800,color:'#0b1c30',letterSpacing:'-0.02em'}}>My Schedule</h1>
            <p style={{fontSize:13,color:'#64748b',marginTop:4}}>Set your available time slots for each day</p>
          </div>
          <button onClick={saveSchedule} disabled={saving} className="btn btn-primary" style={{minWidth:130}}>
            {saving ? <div className="spinner" style={{width:18,height:18,borderWidth:2}}/> : <><span className="icon" style={{fontSize:17}}>save</span>Save Schedule</>}
          </button>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'260px 1fr',gap:24,alignItems:'flex-start'}}>
          {/* Day selector */}
          <div className="card" style={{padding:16}}>
            <div style={{fontSize:12,fontWeight:700,color:'#64748b',textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:12}}>Days</div>
            {DAYS.map(day => {
              const count = avail[day].length
              const active = selDay === day
              return (
                <div key={day} onClick={() => setSelDay(day)}
                  style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 12px',borderRadius:8,cursor:'pointer',background:active?'#f0f9ff':'transparent',border:`1.5px solid ${active?'#0ea5e9':'transparent'}`,marginBottom:4,transition:'all .15s'}}>
                  <span style={{fontSize:14,fontWeight:active?700:500,color:active?'#0ea5e9':'#374151'}}>{day}</span>
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    {count > 0
                      ? <span style={{fontSize:11,fontWeight:700,background:'#ecfdf5',color:'#059669',padding:'2px 8px',borderRadius:99}}>{count} slots</span>
                      : <span style={{fontSize:11,color:'#cbd5e1'}}>Off</span>
                    }
                    <button onClick={e => { e.stopPropagation(); toggleDay(day) }}
                      style={{width:22,height:22,borderRadius:'50%',border:'1.5px solid #e2e8f0',background:'#fff',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',fontSize:12,color:'#94a3b8'}}
                      title={avail[day].length === ALL_SLOTS.length ? 'Clear all' : 'Select all'}>
                      {avail[day].length === ALL_SLOTS.length ? '✕' : '✓'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Slot grid */}
          <div>
            <div className="card" style={{padding:24,marginBottom:20}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
                <h2 style={{fontSize:16,fontWeight:700,color:'#0b1c30'}}>{selDay} — Available Slots</h2>
                <div style={{display:'flex',gap:12,fontSize:12,color:'#64748b'}}>
                  <span style={{display:'flex',alignItems:'center',gap:4}}><span style={{width:10,height:10,borderRadius:2,background:'#0ea5e9',display:'inline-block'}}/> Available</span>
                  <span style={{display:'flex',alignItems:'center',gap:4}}><span style={{width:10,height:10,borderRadius:2,background:'#e2e8f0',display:'inline-block'}}/> Off</span>
                  <span style={{display:'flex',alignItems:'center',gap:4}}><span style={{width:10,height:10,borderRadius:2,background:'#fef3c7',display:'inline-block'}}/> Booked</span>
                </div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:8}}>
                {ALL_SLOTS.map(slot => {
                  const on     = avail[selDay].includes(slot)
                  const booked = bookedSlots.includes(slot)
                  return (
                    <button key={slot} onClick={() => !booked && toggleSlot(selDay, slot)} disabled={booked}
                      style={{padding:'9px 4px',borderRadius:8,border:`1.5px solid ${booked?'#fde68a':on?'#0ea5e9':'#e2e8f0'}`,background:booked?'#fef3c7':on?'#eff6ff':'#fff',color:booked?'#92400e':on?'#0ea5e9':'#94a3b8',fontSize:12,fontFamily:'JetBrains Mono,monospace',fontWeight:600,cursor:booked?'not-allowed':'pointer',transition:'all .15s',position:'relative'}}>
                      {slot}
                      {booked && <span style={{position:'absolute',top:-6,right:-4,fontSize:9,background:'#f59e0b',color:'#fff',borderRadius:99,padding:'1px 5px',fontFamily:'Inter,sans-serif'}}>Booked</span>}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Today's appointments */}
            {apts.length > 0 && (
              <div className="card" style={{padding:24}}>
                <h2 style={{fontSize:16,fontWeight:700,color:'#0b1c30',marginBottom:16}}>{selDay} — Appointments ({apts.length})</h2>
                {apts.map(a => (
                  <div key={a._id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 0',borderBottom:'1px solid #f1f5f9',flexWrap:'wrap',gap:8}}>
                    <div style={{display:'flex',alignItems:'center',gap:12}}>
                      <div style={{width:36,height:36,borderRadius:'50%',background:'#f0f9ff',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:14,color:'#0ea5e9'}}>
                        {a.patient?.name?.[0] || 'P'}
                      </div>
                      <div>
                        <div style={{fontSize:14,fontWeight:700,color:'#0b1c30'}}>{a.patient?.name}</div>
                        <div style={{fontSize:12,color:'#64748b'}}>{a.timeSlot} · {a.type}</div>
                      </div>
                    </div>
                    <span className={`badge badge-${a.status}`}>{a.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
