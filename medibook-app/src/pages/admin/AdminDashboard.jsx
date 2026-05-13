import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import AdminSidebar from '../../components/layout/AdminSidebar'
import { useAuth } from '../../context/AuthContext'

export default function AdminDashboard() {
  const { apiFetch } = useAuth()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiFetch('/admin/stats').then(d => setStats(d.stats)).catch(()=>{}).finally(()=>setLoading(false))
  }, [])

  const CARDS = stats ? [
    {label:'Total Users',     value: stats.totalUsers,        icon:'group',          bg:'#eff6ff', ic:'#2563eb'},
    {label:'Active Doctors',  value: stats.totalDoctors,      icon:'stethoscope',    bg:'#ecfdf5', ic:'#059669'},
    {label:'Appts Today',     value: stats.appointmentsToday, icon:'calendar_month', bg:'#fffbeb', ic:'#d97706'},
    {label:'Pending Doctors', value: stats.pendingDoctors,    icon:'pending_actions',bg:'#fef2f2', ic:'#dc2626'},
  ] : []

  return (
    <div className="admin-layout">
      <AdminSidebar/>
      <div className="admin-content">
        <div style={{padding:32}}>
          <h1 style={{fontSize:24,fontWeight:800,color:'#f8fafc',marginBottom:4}}>Dashboard Overview</h1>
          <p style={{fontSize:13,color:'rgba(255,255,255,.4)',marginBottom:32}}>
            {new Date().toLocaleDateString('en',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}
          </p>

          {/* Stats */}
          {loading ? <div className="spinner" style={{margin:'60px auto'}}/> : (
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16,marginBottom:32}}>
              {CARDS.map(c => (
                <div key={c.label} style={{background:'#18181b',border:'1px solid rgba(255,255,255,.08)',borderRadius:12,padding:20}}>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
                    <span style={{fontSize:12,fontWeight:700,color:'rgba(255,255,255,.4)',textTransform:'uppercase',letterSpacing:'0.07em'}}>{c.label}</span>
                    <div style={{width:36,height:36,borderRadius:8,background:c.bg,display:'flex',alignItems:'center',justifyContent:'center'}}>
                      <span className="icon icon-filled" style={{fontSize:20,color:c.ic}}>{c.icon}</span>
                    </div>
                  </div>
                  <div style={{fontSize:32,fontWeight:800,color:'#f8fafc'}}>{c.value?.toLocaleString()}</div>
                </div>
              ))}
            </div>
          )}

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:24}}>
            {/* Quick Actions */}
            <div style={{background:'#18181b',border:'1px solid rgba(255,255,255,.08)',borderRadius:12,padding:24}}>
              <h2 style={{fontSize:16,fontWeight:700,color:'#f8fafc',marginBottom:20}}>Quick Actions</h2>
              {[
                ['/admin/users?role=doctor&isVerified=false','pending_actions','Review Pending Doctors',stats?.pendingDoctors > 0 ? stats.pendingDoctors : null],
                ['/admin/users','group','Manage All Users',null],
                ['/admin/analytics','bar_chart','View Analytics',null],
              ].map(([href,icon,label,badge])=>(
                <Link key={label} to={href} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 0',borderBottom:'1px solid rgba(255,255,255,.06)',textDecoration:'none',transition:'opacity .15s'}}
                  onMouseEnter={e=>e.currentTarget.style.opacity='.7'} onMouseLeave={e=>e.currentTarget.style.opacity='1'}>
                  <div style={{display:'flex',alignItems:'center',gap:12}}>
                    <span className="icon" style={{fontSize:20,color:'rgba(255,255,255,.4)'}}>{icon}</span>
                    <span style={{fontSize:14,fontWeight:500,color:'#e2e8f0'}}>{label}</span>
                  </div>
                  {badge && <span style={{background:'#dc2626',color:'#fff',borderRadius:99,padding:'2px 8px',fontSize:12,fontWeight:700}}>{badge}</span>}
                </Link>
              ))}
            </div>

            {/* System Info */}
            <div style={{background:'#18181b',border:'1px solid rgba(255,255,255,.08)',borderRadius:12,padding:24}}>
              <h2 style={{fontSize:16,fontWeight:700,color:'#f8fafc',marginBottom:20}}>System Info</h2>
              {stats && [
                ['Total Patients', stats.totalPatients],
                ['Total Doctors', stats.totalDoctors],
                ['Appts This Month', stats.appointmentsMonth],
                ['Cancellation Rate', stats.cancellationRate],
                ['Total Appointments', stats.totalAppointments],
              ].map(([label,val])=>(
                <div key={label} style={{display:'flex',justifyContent:'space-between',padding:'10px 0',borderBottom:'1px solid rgba(255,255,255,.06)'}}>
                  <span style={{fontSize:13,color:'rgba(255,255,255,.4)'}}>{label}</span>
                  <span style={{fontSize:13,fontWeight:700,color:'#f8fafc'}}>{val?.toLocaleString?.() ?? val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
