import { useState, useEffect } from 'react'
import AdminSidebar from '../../components/layout/AdminSidebar'
import { useAuth } from '../../context/AuthContext'

export default function AdminAnalyticsPage() {
  const { apiFetch } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiFetch('/admin/analytics').then(d => setData(d.analytics)).catch(()=>{}).finally(()=>setLoading(false))
  }, [])

  const months = data?.monthlyAppointments || []
  const maxVal  = Math.max(...months.map(m => m.count), 1)

  return (
    <div className="admin-layout">
      <AdminSidebar/>
      <div className="admin-content">
        <div style={{padding:32}}>
          <h1 style={{fontSize:24,fontWeight:800,color:'#f8fafc',marginBottom:4}}>Analytics</h1>
          <p style={{fontSize:13,color:'rgba(255,255,255,.4)',marginBottom:32}}>Platform performance overview</p>

          {loading ? <div className="spinner" style={{margin:'80px auto'}}/> : (
            <>
              {/* Monthly Chart */}
              <div style={{background:'#18181b',border:'1px solid rgba(255,255,255,.08)',borderRadius:12,padding:28,marginBottom:24}}>
                <h2 style={{fontSize:16,fontWeight:700,color:'#f8fafc',marginBottom:24}}>Monthly Appointments</h2>
                <div style={{display:'flex',alignItems:'flex-end',gap:12,height:180}}>
                  {months.map(m => (
                    <div key={m.month+m.year} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:6}}>
                      <span style={{fontSize:11,color:'rgba(255,255,255,.4)',fontWeight:600}}>{m.count}</span>
                      <div style={{width:'100%',borderRadius:'6px 6px 0 0',background:'linear-gradient(180deg,#0ea5e9,#006591)',transition:'height .5s',height:`${Math.max((m.count/maxVal)*140,4)}px`}}/>
                      <span style={{fontSize:11,color:'rgba(255,255,255,.4)'}}>{m.month}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:24}}>
                {/* Top Specialties */}
                <div style={{background:'#18181b',border:'1px solid rgba(255,255,255,.08)',borderRadius:12,padding:24}}>
                  <h2 style={{fontSize:16,fontWeight:700,color:'#f8fafc',marginBottom:20}}>Top Specialties</h2>
                  {(data?.topSpecialties||[]).map((s,i) => (
                    <div key={s._id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 0',borderBottom:'1px solid rgba(255,255,255,.06)'}}>
                      <div style={{display:'flex',alignItems:'center',gap:12}}>
                        <span style={{width:24,height:24,borderRadius:'50%',background:'rgba(14,165,233,.15)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:800,color:'#38bdf8'}}>{i+1}</span>
                        <span style={{fontSize:14,color:'#e2e8f0',fontWeight:500}}>{s._id || 'Unknown'}</span>
                      </div>
                      <span style={{fontSize:13,fontWeight:700,color:'#38bdf8'}}>{s.count} doctors</span>
                    </div>
                  ))}
                </div>

                {/* New Users */}
                <div style={{background:'#18181b',border:'1px solid rgba(255,255,255,.08)',borderRadius:12,padding:24}}>
                  <h2 style={{fontSize:16,fontWeight:700,color:'#f8fafc',marginBottom:20}}>New Users (Last 3 Months)</h2>
                  {(data?.newUsers||[]).map(u => (
                    <div key={u.month} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 0',borderBottom:'1px solid rgba(255,255,255,.06)'}}>
                      <span style={{fontSize:14,color:'#e2e8f0'}}>{u.month}</span>
                      <div style={{display:'flex',alignItems:'center',gap:10}}>
                        <div style={{width:80,height:6,background:'rgba(255,255,255,.08)',borderRadius:99,overflow:'hidden'}}>
                          <div style={{height:'100%',background:'#0ea5e9',borderRadius:99,width:`${Math.min((u.count/50)*100,100)}%`}}/>
                        </div>
                        <span style={{fontSize:13,fontWeight:700,color:'#38bdf8',minWidth:30,textAlign:'right'}}>{u.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
