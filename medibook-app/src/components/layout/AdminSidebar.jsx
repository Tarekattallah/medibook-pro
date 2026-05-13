import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const NAV = [
  { href:'/admin',              icon:'dashboard',      label:'Overview' },
  { href:'/admin/users',        icon:'group',          label:'Users' },
  { href:'/admin/appointments', icon:'calendar_month', label:'Appointments' },
  { href:'/admin/analytics',    icon:'bar_chart',      label:'Analytics' },
]

export default function AdminSidebar() {
  const { pathname } = useLocation()
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <div style={{width:32,height:32,background:'linear-gradient(135deg,#0ea5e9,#006591)',borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center'}}>
            <span style={{color:'#fff',fontWeight:800,fontSize:14}}>M</span>
          </div>
          <div>
            <div style={{color:'#f8fafc',fontWeight:700,fontSize:14}}>MediBook Pro</div>
            <div style={{color:'rgba(255,255,255,.4)',fontSize:11}}>Admin Panel</div>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div style={{marginBottom:8,padding:'0 4px',fontSize:10,fontWeight:700,color:'rgba(255,255,255,.25)',letterSpacing:'0.1em',textTransform:'uppercase'}}>Main</div>
        {NAV.map(({ href, icon, label }) => (
          <Link key={href} to={href} className={`sidebar-link ${pathname===href ? 'active' : ''}`}>
            <span className="icon">{icon}</span>{label}
          </Link>
        ))}
      </nav>

      <div style={{padding:'16px 10px',borderTop:'1px solid rgba(255,255,255,.08)'}}>
        <div style={{display:'flex',alignItems:'center',gap:10,padding:'8px 12px'}}>
          <div style={{width:32,height:32,borderRadius:'50%',background:'rgba(14,165,233,.2)',display:'flex',alignItems:'center',justifyContent:'center',color:'#38bdf8',fontWeight:700,fontSize:13}}>
            {user?.name?.[0] || 'A'}
          </div>
          <div style={{flex:1,overflow:'hidden'}}>
            <div style={{color:'#f8fafc',fontSize:13,fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{user?.name}</div>
            <div style={{color:'rgba(255,255,255,.4)',fontSize:11}}>Administrator</div>
          </div>
        </div>
        <button onClick={() => { logout(); navigate('/') }} className="sidebar-link" style={{marginTop:4,color:'#f87171',width:'100%'}}>
          <span className="icon">logout</span>Sign out
        </button>
      </div>
    </aside>
  )
}
