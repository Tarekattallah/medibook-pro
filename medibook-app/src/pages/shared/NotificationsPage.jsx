import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/layout/Navbar'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../components/ui/Toast'

const ICON_MAP = {
  appointment:  { icon:'calendar_month', bg:'#eff6ff', ic:'#2563eb' },
  reminder:     { icon:'notifications',  bg:'#fffbeb', ic:'#d97706' },
  review:       { icon:'star',           bg:'#fdf4ff', ic:'#9333ea' },
  system:       { icon:'info',           bg:'#f0fdf4', ic:'#16a34a' },
  cancellation: { icon:'cancel',         bg:'#fef2f2', ic:'#dc2626' },
}

export default function NotificationsPage() {
  const { apiFetch, setUnreadCount } = useAuth()
  const navigate = useNavigate()
  const toast    = useToast()
  const [notifs,   setNotifs]   = useState([])
  const [unread,   setUnread]   = useState(0)
  const [loading,  setLoading]  = useState(true)
  const [filter,   setFilter]   = useState('all')

  const load = async () => {
    setLoading(true)
    try {
      const d = await apiFetch('/notifications?limit=50')
      setNotifs(d.notifications || [])
      setUnread(d.unreadCount   || 0)
    } catch { /* fallback to empty */ }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const markRead = async id => {
    try {
      await apiFetch(`/notifications/${id}/read`, { method:'PATCH' })
      setNotifs(n => n.map(x => x._id===id ? {...x, read:true} : x))
      setUnread(u => { const next = Math.max(0, u - 1); setUnreadCount(next); return next })
    } catch {}
  }

  const markAllRead = async () => {
    try {
      await apiFetch('/notifications/mark-all-read', { method:'PATCH' })
      setNotifs(n => n.map(x => ({...x, read:true})))
      setUnread(0)
      toast('All notifications marked as read')
    } catch (err) { toast(err.message, 'error') }
  }

  const del = async id => {
    try {
      await apiFetch(`/notifications/${id}`, { method:'DELETE' })
      const n = notifs.find(x => x._id === id)
      if (n && !n.read) setUnread(u => Math.max(0, u - 1))
      setNotifs(prev => prev.filter(x => x._id !== id))
    } catch (err) { toast(err.message, 'error') }
  }

  const handleClick = async n => {
    if (!n.read) await markRead(n._id)
    navigate(n.link || '/')
  }

  const filtered = filter === 'unread' ? notifs.filter(n => !n.read) : notifs

  return (
    <div className="page">
      <Navbar/>
      <div style={{maxWidth:680,margin:'0 auto',padding:'32px 24px'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:24,flexWrap:'wrap',gap:12}}>
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <h1 style={{fontSize:26,fontWeight:800,color:'#0b1c30',letterSpacing:'-0.02em'}}>Notifications</h1>
            {unread > 0 && <span style={{background:'#0ea5e9',color:'#fff',borderRadius:99,padding:'2px 10px',fontSize:12,fontWeight:700}}>{unread} new</span>}
          </div>
          {unread > 0 && (
            <button onClick={markAllRead} className="btn btn-ghost" style={{fontSize:13}}>
              <span className="icon" style={{fontSize:16}}>done_all</span> Mark all read
            </button>
          )}
        </div>

        {/* Filter tabs */}
        <div style={{display:'flex',gap:4,background:'#f1f5f9',borderRadius:10,padding:4,marginBottom:20,width:'fit-content'}}>
          {['all','unread'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{padding:'7px 20px',borderRadius:7,fontSize:13,fontWeight:600,border:'none',cursor:'pointer',textTransform:'capitalize',background:filter===f?'#fff':'transparent',color:filter===f?'#0b1c30':'#64748b',boxShadow:filter===f?'0 1px 4px rgba(0,0,0,.08)':'none',transition:'all .15s'}}>
              {f}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="spinner" style={{margin:'60px auto'}}/>
        ) : filtered.length === 0 ? (
          <div style={{textAlign:'center',padding:'60px 24px'}}>
            <span className="icon" style={{fontSize:56,color:'#cbd5e1',display:'block',marginBottom:16}}>notifications_off</span>
            <h3 style={{fontSize:18,fontWeight:700,color:'#0b1c30',marginBottom:8}}>All caught up!</h3>
            <p style={{color:'#64748b',fontSize:14}}>No {filter==='unread'?'unread ':''}notifications.</p>
          </div>
        ) : (
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {filtered.map(n => {
              const cfg = ICON_MAP[n.type] || ICON_MAP.system
              const timeAgo = t => {
                const diff = (Date.now() - new Date(t)) / 1000
                if (diff < 60)   return 'Just now'
                if (diff < 3600) return `${Math.floor(diff/60)}m ago`
                if (diff < 86400) return `${Math.floor(diff/3600)}h ago`
                return `${Math.floor(diff/86400)}d ago`
              }
              return (
                <div key={n._id} onClick={() => handleClick(n)}
                  className="card fade-in"
                  style={{padding:16,display:'flex',gap:14,cursor:'pointer',borderLeft:`3px solid ${n.read?'transparent':'#0ea5e9'}`,transition:'all .15s'}}
                  onMouseEnter={e=>e.currentTarget.style.boxShadow='0 4px 16px rgba(15,23,42,.08)'}
                  onMouseLeave={e=>e.currentTarget.style.boxShadow='0 1px 3px rgba(0,0,0,.08)'}>
                  <div style={{width:42,height:42,borderRadius:12,background:cfg.bg,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                    <span className="icon icon-filled" style={{fontSize:22,color:cfg.ic}}>{cfg.icon}</span>
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:8}}>
                      <div style={{fontWeight:n.read?500:700,fontSize:14,color:'#0b1c30'}}>{n.title}</div>
                      <div style={{display:'flex',alignItems:'center',gap:6,flexShrink:0}}>
                        {!n.read && <span style={{width:7,height:7,borderRadius:'50%',background:'#0ea5e9',flexShrink:0}}/>}
                        <button onClick={e=>{e.stopPropagation();del(n._id)}}
                          style={{background:'none',border:'none',cursor:'pointer',color:'#cbd5e1',padding:2,lineHeight:1}}
                          onMouseEnter={e=>e.currentTarget.style.color='#dc2626'}
                          onMouseLeave={e=>e.currentTarget.style.color='#cbd5e1'}>
                          <span className="icon" style={{fontSize:16}}>close</span>
                        </button>
                      </div>
                    </div>
                    <p style={{fontSize:13,color:'#64748b',marginTop:3,lineHeight:1.5}}>{n.body}</p>
                    <div style={{fontSize:11,color:'#94a3b8',marginTop:6}}>{timeAgo(n.createdAt)}</div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
