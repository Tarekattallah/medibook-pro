import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import AdminSidebar from '../../components/layout/AdminSidebar'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../components/ui/Toast'

const TABS = ['all','confirmed','pending','cancelled','completed']

export default function AdminAppointmentsPage() {
  const { apiFetch } = useAuth()
  const toast = useToast()
  const [apts, setApts]   = useState([])
  const [total, setTotal] = useState(0)
  const [tab, setTab]     = useState('all')
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const load = () => {
    setLoading(true)
    const qs = new URLSearchParams()
    if (tab !== 'all') qs.set('status', tab)
    apiFetch(`/appointments/admin/all?${qs}`)
      .then(d => { setApts(d.appointments||[]); setTotal(d.total||0) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [tab])

  const cancel = async (id) => {
    if (!confirm('Cancel this appointment?')) return
    try {
      await apiFetch(`/appointments/${id}/cancel`, { method:'PATCH', body: JSON.stringify({ reason:'Cancelled by admin' }) })
      toast('Appointment cancelled')
      load()
    } catch (err) { toast(err.message, 'error') }
  }

  const filtered = search
    ? apts.filter(a =>
        a.doctor?.name?.toLowerCase().includes(search.toLowerCase()) ||
        a.patient?.name?.toLowerCase().includes(search.toLowerCase())
      )
    : apts

  return (
    <div className="admin-layout">
      <AdminSidebar/>
      <div className="admin-content">
        <div style={{padding:32}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:28,flexWrap:'wrap',gap:12}}>
            <div>
              <h1 style={{fontSize:24,fontWeight:800,color:'#f8fafc'}}>All Appointments</h1>
              <p style={{fontSize:13,color:'rgba(255,255,255,.4)',marginTop:4}}>{total} total</p>
            </div>
          </div>

          {/* Tabs */}
          <div style={{display:'flex',gap:4,marginBottom:20,flexWrap:'wrap'}}>
            {TABS.map(t => (
              <button key={t} onClick={() => setTab(t)}
                style={{padding:'7px 16px',borderRadius:8,border:`1px solid ${tab===t?'#0ea5e9':'rgba(255,255,255,.1)'}`,background:tab===t?'rgba(14,165,233,.15)':'#18181b',color:tab===t?'#38bdf8':'rgba(255,255,255,.5)',fontSize:13,fontWeight:600,cursor:'pointer',textTransform:'capitalize'}}>
                {t}
              </button>
            ))}
          </div>

          {/* Search */}
          <div style={{display:'flex',alignItems:'center',gap:8,background:'#18181b',border:'1px solid rgba(255,255,255,.1)',borderRadius:10,padding:'0 14px',marginBottom:20,maxWidth:400}}>
            <span className="icon" style={{color:'rgba(255,255,255,.3)',fontSize:18}}>search</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search doctor or patient..."
              style={{border:'none',outline:'none',background:'transparent',color:'#f8fafc',fontSize:14,flex:1,padding:'10px 0'}}/>
          </div>

          {/* Table */}
          <div style={{background:'#18181b',border:'1px solid rgba(255,255,255,.08)',borderRadius:12,overflow:'hidden'}}>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead>
                <tr style={{borderBottom:'1px solid rgba(255,255,255,.08)'}}>
                  {['Patient','Doctor','Date & Time','Type','Status','Action'].map(h => (
                    <th key={h} style={{padding:'14px 18px',textAlign:'left',fontSize:11,fontWeight:700,color:'rgba(255,255,255,.3)',textTransform:'uppercase',letterSpacing:'0.07em'}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} style={{textAlign:'center',padding:60}}><div className="spinner" style={{margin:'0 auto'}}/></td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={6} style={{textAlign:'center',padding:60,color:'rgba(255,255,255,.3)',fontSize:14}}>No appointments found</td></tr>
                ) : filtered.map(a => (
                  <tr key={a._id} style={{borderBottom:'1px solid rgba(255,255,255,.04)',transition:'background .1s'}}
                    onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,.02)'}
                    onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                    <td style={{padding:'14px 18px'}}>
                      <div style={{fontSize:13,fontWeight:600,color:'#f8fafc'}}>{a.patient?.name || '—'}</div>
                      <div style={{fontSize:11,color:'rgba(255,255,255,.3)'}}>{a.patient?.email}</div>
                    </td>
                    <td style={{padding:'14px 18px'}}>
                      <div style={{fontSize:13,fontWeight:600,color:'#f8fafc'}}>{a.doctor?.name || '—'}</div>
                      <div style={{fontSize:11,color:'rgba(255,255,255,.3)'}}>{a.doctor?.specialty}</div>
                    </td>
                    <td style={{padding:'14px 18px'}}>
                      <div style={{fontSize:13,color:'#e2e8f0'}}>{new Date(a.date).toLocaleDateString('en',{month:'short',day:'numeric',year:'numeric'})}</div>
                      <div style={{fontSize:12,color:'rgba(255,255,255,.35)',fontFamily:'JetBrains Mono,monospace'}}>{a.timeSlot}</div>
                    </td>
                    <td style={{padding:'14px 18px',fontSize:12,color:'rgba(255,255,255,.5)',textTransform:'capitalize'}}>{a.type}</td>
                    <td style={{padding:'14px 18px'}}>
                      <span className={`badge badge-${a.status}`}>{a.status}</span>
                    </td>
                    <td style={{padding:'14px 18px'}}>
                      {['confirmed','pending'].includes(a.status) && (
                        <button onClick={() => cancel(a._id)}
                          style={{padding:'5px 12px',borderRadius:6,border:'1px solid rgba(248,113,113,.3)',background:'transparent',color:'#f87171',fontSize:12,fontWeight:600,cursor:'pointer'}}>
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
