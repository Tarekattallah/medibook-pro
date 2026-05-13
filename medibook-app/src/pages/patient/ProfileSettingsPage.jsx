import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/layout/Navbar'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../components/ui/Toast'

const TABS = [
  { id:'profile',  icon:'person',    label:'Personal Info' },
  { id:'security', icon:'lock',      label:'Password' },
  { id:'danger',   icon:'warning',   label:'Danger Zone' },
]

export default function ProfileSettingsPage() {
  const { user, apiFetch, logout, updateUser } = useAuth()
  const toast    = useToast()
  const navigate = useNavigate()
  const [tab, setTab] = useState('profile')
  const [saving, setSaving] = useState(false)

  const [profile, setProfile] = useState({
    name:        user?.name        || '',
    phone:       user?.phone       || '',
    dateOfBirth: user?.dateOfBirth ? user.dateOfBirth.slice(0,10) : '',
    bloodType:   user?.bloodType   || '',
  })

  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword:     '',
    confirmPassword: '',
  })

  const setP  = k => e => setProfile(f  => ({...f, [k]: e.target.value}))
  const setPw = k => e => setPasswords(f => ({...f, [k]: e.target.value}))

  const saveProfile = async e => {
    e.preventDefault()
    setSaving(true)
    try {
      const data = await apiFetch('/auth/update-profile', { method:'PATCH', body: JSON.stringify(profile) })
      updateUser(data.user)
      toast('Profile updated successfully!')
    } catch (err) { toast(err.message, 'error') }
    finally { setSaving(false) }
  }

  const changePassword = async e => {
    e.preventDefault()
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast('Passwords do not match', 'error'); return
    }
    if (passwords.newPassword.length < 8) {
      toast('Password must be at least 8 characters', 'error'); return
    }
    setSaving(true)
    try {
      await apiFetch('/auth/change-password', {
        method: 'PATCH',
        body: JSON.stringify({ currentPassword: passwords.currentPassword, newPassword: passwords.newPassword })
      })
      toast('Password changed! Please log in again.')
      setTimeout(() => { logout(); navigate('/login') }, 1500)
    } catch (err) { toast(err.message, 'error') }
    finally { setSaving(false) }
  }

  const deleteAccount = async () => {
    if (!window.confirm('Are you sure? This action cannot be undone.')) return
    toast('Account deletion requested — contact support.', 'warn')
  }

  const initials = user?.name?.split(' ').map(w=>w[0]).slice(0,2).join('') || 'U'

  return (
    <div className="page">
      <Navbar/>
      <div style={{maxWidth:860,margin:'0 auto',padding:'32px 24px'}}>
        <h1 style={{fontSize:26,fontWeight:800,color:'#0b1c30',marginBottom:28,letterSpacing:'-0.02em'}}>
          Account Settings
        </h1>

        <div style={{display:'grid',gridTemplateColumns:'220px 1fr',gap:24,alignItems:'flex-start'}}>
          {/* Sidebar tabs */}
          <div style={{background:'#fff',border:'1.5px solid #e2e8f0',borderRadius:12,overflow:'hidden'}}>
            {/* Avatar */}
            <div style={{padding:24,textAlign:'center',borderBottom:'1px solid #f1f5f9'}}>
              <div style={{width:72,height:72,borderRadius:'50%',background:'linear-gradient(135deg,#bae6fd,#0ea5e9)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:26,fontWeight:800,color:'#fff',margin:'0 auto 12px'}}>
                {initials}
              </div>
              <div style={{fontWeight:700,fontSize:14,color:'#0b1c30'}}>{user?.name}</div>
              <div style={{fontSize:12,color:'#94a3b8',marginTop:3,textTransform:'capitalize'}}>{user?.role}</div>
              <div style={{fontSize:12,color:'#64748b',marginTop:2}}>{user?.email}</div>
            </div>

            {/* Nav */}
            <nav style={{padding:8}}>
              {TABS.map(t => (
                <button key={t.id} onClick={() => setTab(t.id)}
                  style={{display:'flex',alignItems:'center',gap:10,width:'100%',padding:'10px 14px',borderRadius:8,border:'none',background:tab===t.id?'#f0f9ff':'transparent',color:tab===t.id?'#0ea5e9':'#475569',fontSize:13,fontWeight:tab===t.id?700:500,cursor:'pointer',transition:'all .15s',textAlign:'left'}}>
                  <span className="icon" style={{fontSize:18}}>{t.icon}</span>
                  {t.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="card" style={{padding:32}}>

            {/* Personal Info */}
            {tab === 'profile' && (
              <form onSubmit={saveProfile}>
                <h2 style={{fontSize:18,fontWeight:700,color:'#0b1c30',marginBottom:24}}>Personal Information</h2>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
                  <div className="form-group" style={{gridColumn:'1/-1'}}>
                    <label className="label">Full Name</label>
                    <input className="input" value={profile.name} onChange={setP('name')} required/>
                  </div>
                  <div className="form-group" style={{gridColumn:'1/-1'}}>
                    <label className="label">Email Address <span style={{color:'#94a3b8',fontWeight:400,fontSize:12}}>(cannot be changed)</span></label>
                    <input className="input" value={user?.email} disabled style={{background:'#f8fafc',color:'#94a3b8',cursor:'not-allowed'}}/>
                  </div>
                  <div className="form-group">
                    <label className="label">Phone Number</label>
                    <input className="input" value={profile.phone} onChange={setP('phone')} placeholder="+20 10 1234 5678"/>
                  </div>
                  <div className="form-group">
                    <label className="label">Date of Birth</label>
                    <input className="input" type="date" value={profile.dateOfBirth} onChange={setP('dateOfBirth')}/>
                  </div>
                  {user?.role === 'patient' && (
                    <div className="form-group">
                      <label className="label">Blood Type</label>
                      <select className="input" value={profile.bloodType} onChange={setP('bloodType')} style={{cursor:'pointer'}}>
                        <option value="">Select</option>
                        {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(b => <option key={b}>{b}</option>)}
                      </select>
                    </div>
                  )}
                </div>
                <div style={{display:'flex',justifyContent:'flex-end',marginTop:8}}>
                  <button type="submit" className="btn btn-primary" style={{minWidth:130}} disabled={saving}>
                    {saving ? <div className="spinner" style={{width:18,height:18,borderWidth:2}}/> : 'Save Changes'}
                  </button>
                </div>
              </form>
            )}

            {/* Password */}
            {tab === 'security' && (
              <form onSubmit={changePassword}>
                <h2 style={{fontSize:18,fontWeight:700,color:'#0b1c30',marginBottom:6}}>Change Password</h2>
                <p style={{fontSize:13,color:'#64748b',marginBottom:24}}>After changing your password, you'll be logged out.</p>
                <div className="form-group">
                  <label className="label">Current Password</label>
                  <input className="input" type="password" value={passwords.currentPassword} onChange={setPw('currentPassword')} placeholder="••••••••" required/>
                </div>
                <div className="form-group">
                  <label className="label">New Password</label>
                  <input className="input" type="password" value={passwords.newPassword} onChange={setPw('newPassword')} placeholder="Min 8 characters" minLength={8} required/>
                </div>
                <div className="form-group">
                  <label className="label">Confirm New Password</label>
                  <input className="input" type="password" value={passwords.confirmPassword} onChange={setPw('confirmPassword')} placeholder="Repeat new password" required/>
                  {passwords.newPassword && passwords.confirmPassword && passwords.newPassword !== passwords.confirmPassword && (
                    <p style={{fontSize:12,color:'#dc2626',marginTop:6}}>Passwords don't match</p>
                  )}
                </div>
                <div style={{display:'flex',justifyContent:'flex-end',marginTop:8}}>
                  <button type="submit" className="btn btn-primary" style={{minWidth:160}} disabled={saving}>
                    {saving ? <div className="spinner" style={{width:18,height:18,borderWidth:2}}/> : 'Change Password'}
                  </button>
                </div>
              </form>
            )}

            {/* Danger Zone */}
            {tab === 'danger' && (
              <div>
                <h2 style={{fontSize:18,fontWeight:700,color:'#0b1c30',marginBottom:6}}>Danger Zone</h2>
                <p style={{fontSize:13,color:'#64748b',marginBottom:24}}>These actions are permanent and cannot be undone.</p>
                <div style={{border:'1.5px solid #fecaca',borderRadius:12,padding:20}}>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:16,flexWrap:'wrap'}}>
                    <div>
                      <div style={{fontWeight:700,fontSize:14,color:'#0b1c30'}}>Delete Account</div>
                      <div style={{fontSize:13,color:'#64748b',marginTop:3}}>
                        Permanently delete your account and all your data.
                      </div>
                    </div>
                    <button onClick={deleteAccount} className="btn btn-danger" style={{flexShrink:0,fontSize:13}}>
                      Delete Account
                    </button>
                  </div>
                </div>
                <div style={{border:'1.5px solid #fed7aa',borderRadius:12,padding:20,marginTop:12}}>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:16,flexWrap:'wrap'}}>
                    <div>
                      <div style={{fontWeight:700,fontSize:14,color:'#0b1c30'}}>Sign Out</div>
                      <div style={{fontSize:13,color:'#64748b',marginTop:3}}>
                        Sign out of your account on this device.
                      </div>
                    </div>
                    <button onClick={() => { logout(); navigate('/') }} className="btn btn-secondary" style={{flexShrink:0,fontSize:13}}>
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
