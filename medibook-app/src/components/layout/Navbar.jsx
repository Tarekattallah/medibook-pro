import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function Navbar() {
  const { user, logout, unreadCount } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()
  const [menuOpen,   setMenuOpen]   = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const menuRef = useRef(null)

  // Close menu on outside click
  useEffect(() => {
    const handle = e => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false) }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  const handleLogout = () => { logout(); navigate('/'); setMenuOpen(false) }

  const dashLink = user?.role === 'admin'  ? '/admin'
    : user?.role === 'doctor' ? '/doctor/dashboard'
    : '/patient/dashboard'

  const isActive = path => location.pathname === path

  return (
    <>
      <header style={{position:'sticky',top:0,zIndex:100,background:'rgba(255,255,255,0.97)',backdropFilter:'blur(12px)',borderBottom:'1.5px solid #e2e8f0',boxShadow:'0 1px 8px rgba(15,23,42,0.06)'}}>
        <div style={{maxWidth:1280,margin:'0 auto',padding:'0 24px',height:60,display:'flex',alignItems:'center',justifyContent:'space-between',gap:16}}>

          {/* Logo */}
          <Link to="/" style={{display:'flex',alignItems:'center',gap:10,textDecoration:'none',flexShrink:0}}>
            <div style={{width:34,height:34,background:'linear-gradient(135deg,#0ea5e9,#006591)',borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center'}}>
              <span style={{color:'#fff',fontWeight:800,fontSize:16}}>M</span>
            </div>
            <span style={{fontWeight:800,fontSize:17,color:'#0b1c30',letterSpacing:'-0.03em'}}>
              MediBook <span style={{color:'#0ea5e9'}}>Pro</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav style={{display:'flex',alignItems:'center',gap:2,flex:1,justifyContent:'center'}}>
            {[['/', 'Home'], ['/search', 'Find Doctors']].map(([href, label]) => (
              <Link key={href} to={href}
                style={{padding:'6px 14px',borderRadius:8,fontSize:14,fontWeight:500,color:isActive(href)?'#0ea5e9':'#475569',background:isActive(href)?'#f0f9ff':'transparent',textDecoration:'none',transition:'all .15s',whiteSpace:'nowrap'}}>
                {label}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div style={{display:'flex',alignItems:'center',gap:8,flexShrink:0}}>
            {user ? (
              <>
                {/* Notifications bell */}
                <Link to="/notifications" style={{position:'relative',width:38,height:38,borderRadius:10,border:'1.5px solid #e2e8f0',background:'#fff',display:'flex',alignItems:'center',justifyContent:'center',textDecoration:'none',transition:'all .15s'}}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor='#0ea5e9';e.currentTarget.style.background='#f0f9ff'}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor='#e2e8f0';e.currentTarget.style.background='#fff'}}>
                  <span className="icon" style={{fontSize:20,color:'#475569'}}>notifications</span>
                  {unreadCount > 0 && (
                    <span style={{position:'absolute',top:6,right:6,width:8,height:8,borderRadius:'50%',background:'#0ea5e9',border:'2px solid #fff'}}/>
                  )}
                </Link>

                {/* User menu */}
                <div ref={menuRef} style={{position:'relative'}}>
                  <button onClick={() => setMenuOpen(!menuOpen)}
                    style={{display:'flex',alignItems:'center',gap:8,padding:'6px 10px',borderRadius:10,border:'1.5px solid #e2e8f0',background:'#fff',cursor:'pointer',transition:'all .15s'}}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor='#0ea5e9'}}
                    onMouseLeave={e=>{if(!menuOpen)e.currentTarget.style.borderColor='#e2e8f0'}}>
                    <div style={{width:28,height:28,borderRadius:'50%',background:'linear-gradient(135deg,#bae6fd,#0ea5e9)',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:800,fontSize:12,flexShrink:0}}>
                      {user.name?.[0] || 'U'}
                    </div>
                    <span style={{fontSize:13,fontWeight:600,color:'#0b1c30',maxWidth:120,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                      {user.name}
                    </span>
                    <span className="icon" style={{fontSize:16,color:'#94a3b8',transition:'transform .2s',transform:menuOpen?'rotate(180deg)':'rotate(0)'}}>expand_more</span>
                  </button>

                  {menuOpen && (
                    <div style={{position:'absolute',right:0,top:'calc(100% + 8px)',background:'#fff',border:'1.5px solid #e2e8f0',borderRadius:12,boxShadow:'0 8px 32px rgba(15,23,42,0.12)',minWidth:220,zIndex:200,overflow:'hidden'}}>
                      {/* Header */}
                      <div style={{padding:'14px 16px',borderBottom:'1px solid #f1f5f9'}}>
                        <div style={{fontSize:13,fontWeight:700,color:'#0b1c30'}}>{user.name}</div>
                        <div style={{fontSize:12,color:'#94a3b8',marginTop:2}}>{user.email}</div>
                        <div style={{fontSize:11,color:'#0ea5e9',marginTop:3,textTransform:'capitalize',fontWeight:600}}>{user.role}</div>
                      </div>

                      {/* Links */}
                      {[
                        [dashLink,                    'dashboard',      'Dashboard'],
                        ['/notifications',            'notifications',  'Notifications', unreadCount > 0 ? unreadCount : null],
                        ['/settings',                 'manage_accounts','Account Settings'],
                        ...(user.role==='patient' ? [
                          ['/patient/appointments',   'calendar_month', 'My Appointments'],
                          ['/patient/records',        'folder_open',    'Medical Records'],
                        ] : []),
                        ...(user.role==='doctor' ? [
                          ['/doctor/schedule',        'schedule',       'My Schedule'],
                          ['/doctor/onboarding',      'edit',           'Edit Profile'],
                        ] : []),
                        ...(user.role==='admin' ? [
                          ['/admin/users',            'group',          'Users'],
                          ['/admin/appointments',     'calendar_month', 'Appointments'],
                          ['/admin/analytics',        'bar_chart',      'Analytics'],
                        ] : []),
                      ].map(([href, icon, label, badge]) => (
                        <Link key={href+label} to={href} onClick={() => setMenuOpen(false)}
                          style={{display:'flex',alignItems:'center',gap:10,padding:'10px 16px',fontSize:13,fontWeight:500,color:'#374151',textDecoration:'none',transition:'background .1s'}}
                          onMouseEnter={e=>e.currentTarget.style.background='#f8fafc'}
                          onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                          <span className="icon" style={{fontSize:18,color:'#94a3b8'}}>{icon}</span>
                          <span style={{flex:1}}>{label}</span>
                          {badge && <span style={{background:'#0ea5e9',color:'#fff',borderRadius:99,padding:'1px 7px',fontSize:11,fontWeight:700}}>{badge}</span>}
                        </Link>
                      ))}

                      {/* Sign out */}
                      <div style={{borderTop:'1px solid #f1f5f9'}}>
                        <button onClick={handleLogout}
                          style={{display:'flex',alignItems:'center',gap:10,padding:'10px 16px',fontSize:13,fontWeight:500,color:'#dc2626',background:'none',border:'none',cursor:'pointer',width:'100%',transition:'background .1s'}}
                          onMouseEnter={e=>e.currentTarget.style.background='#fef2f2'}
                          onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                          <span className="icon" style={{fontSize:18}}>logout</span>Sign out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link to="/login"    className="btn btn-ghost"    style={{fontSize:14}}>Sign In</Link>
                <Link to="/register" className="btn btn-primary"  style={{fontSize:14}}>Get Started</Link>
              </>
            )}

            {/* Mobile menu button */}
            <button onClick={() => setMobileOpen(!mobileOpen)}
              style={{display:'none',width:36,height:36,borderRadius:8,border:'1.5px solid #e2e8f0',background:'#fff',alignItems:'center',justifyContent:'center',cursor:'pointer',fontSize:20,color:'#475569'}}
              className="mobile-menu-btn">
              <span className="icon">{mobileOpen?'close':'menu'}</span>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div style={{borderTop:'1px solid #f1f5f9',padding:'12px 24px',background:'#fff'}}>
            {[['/', 'Home'], ['/search', 'Find Doctors']].map(([href, label]) => (
              <Link key={href} to={href} onClick={() => setMobileOpen(false)}
                style={{display:'block',padding:'12px 0',fontSize:15,fontWeight:500,color:'#374151',textDecoration:'none',borderBottom:'1px solid #f8fafc'}}>
                {label}
              </Link>
            ))}
            {!user && <>
              <Link to="/login" onClick={() => setMobileOpen(false)} style={{display:'block',padding:'12px 0',fontSize:15,fontWeight:500,color:'#0ea5e9',textDecoration:'none'}}>Sign In</Link>
              <Link to="/register" onClick={() => setMobileOpen(false)} style={{display:'block',padding:'12px 0',fontSize:15,fontWeight:600,color:'#0ea5e9',textDecoration:'none'}}>Get Started</Link>
            </>}
            {user && <>
              <Link to={dashLink} onClick={() => setMobileOpen(false)} style={{display:'block',padding:'12px 0',fontSize:15,fontWeight:500,color:'#374151',textDecoration:'none',borderBottom:'1px solid #f8fafc'}}>Dashboard</Link>
              <button onClick={handleLogout} style={{display:'block',padding:'12px 0',fontSize:15,fontWeight:500,color:'#dc2626',background:'none',border:'none',cursor:'pointer',width:'100%',textAlign:'left'}}>Sign out</button>
            </>}
          </div>
        )}
      </header>

      <style>{`.mobile-menu-btn { display: none !important; } @media(max-width:640px) { .mobile-menu-btn { display: flex !important; } nav { display: none !important; } }`}</style>
    </>
  )
}
