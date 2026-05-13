import { useState, useEffect } from 'react'
import AdminSidebar from '../../components/layout/AdminSidebar'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../components/ui/Toast'

const ROLE_STYLE = {
  patient: {bg:'#eff6ff', ic:'#2563eb'},
  doctor:  {bg:'#ecfdf5', ic:'#059669'},
  admin:   {bg:'#fdf4ff', ic:'#9333ea'},
}

export default function AdminUsersPage() {
  const { apiFetch } = useAuth()
  const toast = useToast()
  const [users,      setUsers]      = useState([])
  const [total,      setTotal]      = useState(0)
  const [loading,    setLoading]    = useState(true)
  const [search,     setSearch]     = useState('')
  const [roleFilter, setRole]       = useState('')
  const [deleteModal, setDeleteModal] = useState(null) // user to delete

  const load = () => {
    setLoading(true)
    const qs = new URLSearchParams()
    if (search)     qs.set('search', search)
    if (roleFilter) qs.set('role',   roleFilter)
    apiFetch(`/admin/users?${qs}`)
      .then(d => { setUsers(d.users||[]); setTotal(d.total||0) })
      .catch(()=>{})
      .finally(()=>setLoading(false))
  }

  useEffect(() => { load() }, [roleFilter])

  const toggleActive = async id => {
    try {
      const d = await apiFetch(`/admin/users/${id}/toggle-active`, { method:'PATCH' })
      toast(`User ${d.user.isActive ? 'activated' : 'deactivated'}`)
      setUsers(prev => prev.map(u => u._id===id ? d.user : u))
    } catch (err) { toast(err.message, 'error') }
  }

  const verifyDoctor = async id => {
    try {
      await apiFetch(`/doctors/${id}/verify`, { method:'PATCH' })
      toast('Doctor verified!')
      setUsers(prev => prev.map(u => u._id===id ? {...u, isVerified:true} : u))
    } catch (err) { toast(err.message, 'error') }
  }

  const deleteUser = async id => {
    try {
      await apiFetch(`/admin/users/${id}`, { method:'DELETE' })
      toast('User deleted')
      setUsers(prev => prev.filter(u => u._id !== id))
      setTotal(t => t - 1)
      setDeleteModal(null)
    } catch (err) { toast(err.message, 'error') }
  }

  return (
    <div className="admin-layout">
      <AdminSidebar/>
      <div className="admin-content">
        {/* Delete confirm modal */}
        {deleteModal && (
          <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.6)',backdropFilter:'blur(4px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000,padding:24}}>
            <div style={{background:'#18181b',border:'1px solid rgba(255,255,255,.1)',borderRadius:16,padding:28,maxWidth:400,width:'100%'}}>
              <div style={{width:52,height:52,borderRadius:'50%',background:'rgba(239,68,68,.15)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px'}}>
                <span className="icon icon-filled" style={{fontSize:28,color:'#ef4444'}}>delete_forever</span>
              </div>
              <h2 style={{color:'#f8fafc',fontWeight:800,fontSize:18,textAlign:'center',marginBottom:8}}>Delete User?</h2>
              <p style={{color:'rgba(255,255,255,.5)',fontSize:14,textAlign:'center',marginBottom:6}}>
                Are you sure you want to permanently delete
              </p>
              <p style={{color:'#f8fafc',fontWeight:700,fontSize:15,textAlign:'center',marginBottom:24}}>{deleteModal.name}</p>
              <p style={{color:'#f87171',fontSize:13,textAlign:'center',marginBottom:20}}>
                ⚠ This will delete all their appointments and data. This cannot be undone.
              </p>
              <div style={{display:'flex',gap:10}}>
                <button onClick={() => setDeleteModal(null)} style={{flex:1,padding:'10px',borderRadius:8,border:'1px solid rgba(255,255,255,.1)',background:'transparent',color:'rgba(255,255,255,.7)',fontSize:14,fontWeight:600,cursor:'pointer'}}>
                  Cancel
                </button>
                <button onClick={() => deleteUser(deleteModal._id)} style={{flex:1,padding:'10px',borderRadius:8,border:'none',background:'#dc2626',color:'#fff',fontSize:14,fontWeight:700,cursor:'pointer'}}>
                  Delete Permanently
                </button>
              </div>
            </div>
          </div>
        )}

        <div style={{padding:32}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:28,flexWrap:'wrap',gap:12}}>
            <div>
              <h1 style={{fontSize:24,fontWeight:800,color:'#f8fafc'}}>User Management</h1>
              <p style={{fontSize:13,color:'rgba(255,255,255,.4)',marginTop:4}}>{total} total users</p>
            </div>
          </div>

          {/* Filters */}
          <div style={{display:'flex',gap:12,marginBottom:24,flexWrap:'wrap'}}>
            <div style={{display:'flex',alignItems:'center',gap:8,background:'#18181b',border:'1px solid rgba(255,255,255,.1)',borderRadius:10,padding:'0 14px',flex:1,minWidth:240}}>
              <span className="icon" style={{color:'rgba(255,255,255,.3)',fontSize:18}}>search</span>
              <input value={search} onChange={e=>setSearch(e.target.value)} onKeyDown={e=>e.key==='Enter'&&load()} placeholder="Search by name or email..."
                style={{border:'none',outline:'none',background:'transparent',color:'#f8fafc',fontSize:14,flex:1,padding:'10px 0'}}/>
              <button onClick={load} style={{background:'#0ea5e9',border:'none',borderRadius:7,padding:'5px 14px',color:'#fff',fontSize:12,fontWeight:700,cursor:'pointer'}}>Go</button>
            </div>
            <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
              {['','patient','doctor','admin'].map(r => (
                <button key={r} onClick={() => setRole(r)}
                  style={{padding:'8px 16px',borderRadius:8,border:`1px solid ${roleFilter===r?'#0ea5e9':'rgba(255,255,255,.1)'}`,background:roleFilter===r?'rgba(14,165,233,.15)':'#18181b',color:roleFilter===r?'#38bdf8':'rgba(255,255,255,.5)',fontSize:13,fontWeight:600,cursor:'pointer',textTransform:'capitalize'}}>
                  {r || 'All'}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div style={{background:'#18181b',border:'1px solid rgba(255,255,255,.08)',borderRadius:12,overflow:'hidden'}}>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead>
                <tr style={{borderBottom:'1px solid rgba(255,255,255,.08)'}}>
                  {['User','Role','Status','Joined','Actions'].map(h => (
                    <th key={h} style={{padding:'14px 18px',textAlign:'left',fontSize:11,fontWeight:700,color:'rgba(255,255,255,.3)',textTransform:'uppercase',letterSpacing:'0.08em'}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} style={{textAlign:'center',padding:60}}><div className="spinner" style={{margin:'0 auto'}}/></td></tr>
                ) : users.length === 0 ? (
                  <tr><td colSpan={5} style={{textAlign:'center',padding:60,color:'rgba(255,255,255,.3)',fontSize:14}}>No users found</td></tr>
                ) : users.map(u => {
                  const rs = ROLE_STYLE[u.role] || {bg:'#27272a',ic:'#71717a'}
                  return (
                    <tr key={u._id} style={{borderBottom:'1px solid rgba(255,255,255,.04)',transition:'background .1s'}}
                      onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,.02)'}
                      onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                      <td style={{padding:'14px 18px'}}>
                        <div style={{display:'flex',alignItems:'center',gap:12}}>
                          <div style={{width:36,height:36,borderRadius:'50%',background:'rgba(14,165,233,.15)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:14,color:'#38bdf8',flexShrink:0}}>
                            {u.name?.[0]||'?'}
                          </div>
                          <div>
                            <div style={{fontSize:13,fontWeight:600,color:'#f8fafc'}}>{u.name}</div>
                            <div style={{fontSize:12,color:'rgba(255,255,255,.35)'}}>{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{padding:'14px 18px'}}>
                        <span style={{display:'inline-flex',alignItems:'center',padding:'3px 10px',borderRadius:99,fontSize:12,fontWeight:600,background:rs.bg,color:rs.ic,textTransform:'capitalize'}}>
                          {u.role}
                        </span>
                      </td>
                      <td style={{padding:'14px 18px'}}>
                        <div style={{fontSize:12,fontWeight:600,color:u.isActive?'#34d399':'#f87171'}}>{u.isActive?'Active':'Inactive'}</div>
                        {u.role==='doctor' && <div style={{fontSize:11,color:u.isVerified?'#38bdf8':'#fb923c',marginTop:2}}>{u.isVerified?'✓ Verified':'⚠ Unverified'}</div>}
                      </td>
                      <td style={{padding:'14px 18px',fontSize:12,color:'rgba(255,255,255,.35)'}}>
                        {new Date(u.createdAt).toLocaleDateString('en',{month:'short',day:'numeric',year:'numeric'})}
                      </td>
                      <td style={{padding:'14px 18px'}}>
                        <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                          <button onClick={() => toggleActive(u._id)}
                            style={{padding:'5px 10px',borderRadius:6,border:`1px solid ${u.isActive?'rgba(248,113,113,.3)':'rgba(52,211,153,.3)'}`,background:'transparent',color:u.isActive?'#f87171':'#34d399',fontSize:12,fontWeight:600,cursor:'pointer'}}>
                            {u.isActive?'Deactivate':'Activate'}
                          </button>
                          {u.role==='doctor' && !u.isVerified && (
                            <button onClick={() => verifyDoctor(u._id)}
                              style={{padding:'5px 10px',borderRadius:6,border:'1px solid rgba(56,189,248,.3)',background:'transparent',color:'#38bdf8',fontSize:12,fontWeight:600,cursor:'pointer'}}>
                              Verify
                            </button>
                          )}
                          <button onClick={() => setDeleteModal(u)}
                            style={{padding:'5px 10px',borderRadius:6,border:'1px solid rgba(239,68,68,.3)',background:'transparent',color:'#f87171',fontSize:12,fontWeight:600,cursor:'pointer'}}>
                            <span className="icon" style={{fontSize:14}}>delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
