import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/layout/Navbar'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../components/ui/Toast'
import s from './ProfileSettingsPage.module.css'

const TABS = [
  { id: 'profile',  icon: 'person',    label: 'Personal Info' },
  { id: 'security', icon: 'lock',      label: 'Password' },
  { id: 'danger',   icon: 'warning',   label: 'Danger Zone' },
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

  // حالة إظهار كلمات المرور
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew,     setShowNew]     = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

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
      <Navbar />
      <div className={s.pageWrap}>
        {/* Header */}
        <div className={s.pageHeader}>
          <div className={s.breadcrumb}>
            <span>Account</span>
            <span className="icon" style={{ fontSize: 14 }}>chevron_right</span>
            <span style={{ color: '#0ea5e9' }}>Settings</span>
          </div>
          <h1 className={s.pageTitle}>Account Settings</h1>
          <p className={s.pageSub}>Manage your professional profile and clinical preferences.</p>
        </div>

        <div className={s.layout}>
          {/* Sidebar */}
          <div className={s.sidebar}>
            <div className={s.sidebarHeader}>
              <div className={s.avatar}>{initials}</div>
              <div className={s.sidebarName}>{user?.name}</div>
              <div className={s.sidebarRole}>{user?.role}</div>
              <div className={s.sidebarEmail}>{user?.email}</div>
            </div>
            <nav className={s.sidebarNav}>
              {TABS.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`${s.tabBtn} ${tab === t.id ? s.tabBtnActive : ''}`}
                >
                  <span className={`icon ${s.tabIcon}`}>{t.icon}</span>
                  {t.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className={s.contentCard}>
            {/* Personal Info */}
            {tab === 'profile' && (
              <form onSubmit={saveProfile}>
                <h2 className={s.sectionTitle}>Personal Information</h2>
                <p className={s.sectionDesc}>Update your identity and professional details.</p>
                <div className={s.formGrid}>
                  <div className={`${s.formGroup} ${s.formGroupFull}`}>
                    <label className={s.label}>Full Name</label>
                    <input className={s.input} value={profile.name} onChange={setP('name')} required />
                  </div>
                  <div className={`${s.formGroup} ${s.formGroupFull}`}>
                    <label className={s.label}>Email Address <span style={{ color: '#94a3b8', fontWeight: 400, fontSize: 12 }}>(cannot be changed)</span></label>
                    <input className={`${s.input} ${s.inputDisabled}`} value={user?.email} disabled />
                  </div>
                  <div className={s.formGroup}>
                    <label className={s.label}>Phone Number</label>
                    <input className={s.input} value={profile.phone} onChange={setP('phone')} placeholder="+20 10 1234 5678" />
                  </div>
                  <div className={s.formGroup}>
                    <label className={s.label}>Date of Birth</label>
                    <input className={s.input} type="date" value={profile.dateOfBirth} onChange={setP('dateOfBirth')} />
                  </div>
                  {user?.role === 'patient' && (
                    <div className={s.formGroup}>
                      <label className={s.label}>Blood Type</label>
                      <select className={s.input} value={profile.bloodType} onChange={setP('bloodType')} style={{ cursor: 'pointer' }}>
                        <option value="">Select</option>
                        {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(b => <option key={b}>{b}</option>)}
                      </select>
                    </div>
                  )}
                </div>
                <div className={s.saveBar}>
                  <button type="submit" className={s.saveBtn} disabled={saving}>
                    {saving ? <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : 'Save Changes'}
                  </button>
                </div>
              </form>
            )}

            {/* Password */}
            {tab === 'security' && (
              <form onSubmit={changePassword}>
                <h2 className={s.sectionTitle}>Change Password</h2>
                <p className={s.sectionDesc}>After changing your password, you'll be logged out.</p>
                <div className={s.formGrid}>
                  <div className={`${s.formGroup} ${s.formGroupFull}`}>
                    <label className={s.label}>Current Password</label>
                    <div className={s.passwordWrapper}>
                      <input
                        className={s.input}
                        type={showCurrent ? 'text' : 'password'}
                        value={passwords.currentPassword}
                        onChange={setPw('currentPassword')}
                        placeholder="••••••••"
                        required
                      />
                      <button type="button" className={s.togglePassword} onClick={() => setShowCurrent(!showCurrent)}>
                        <span className="icon" style={{ fontSize: 20 }}>{showCurrent ? 'visibility_off' : 'visibility'}</span>
                      </button>
                    </div>
                  </div>
                  <div className={`${s.formGroup} ${s.formGroupFull}`}>
                    <label className={s.label}>New Password</label>
                    <div className={s.passwordWrapper}>
                      <input
                        className={s.input}
                        type={showNew ? 'text' : 'password'}
                        value={passwords.newPassword}
                        onChange={setPw('newPassword')}
                        placeholder="Min 8 characters"
                        minLength={8}
                        required
                      />
                      <button type="button" className={s.togglePassword} onClick={() => setShowNew(!showNew)}>
                        <span className="icon" style={{ fontSize: 20 }}>{showNew ? 'visibility_off' : 'visibility'}</span>
                      </button>
                    </div>
                  </div>
                  <div className={`${s.formGroup} ${s.formGroupFull}`}>
                    <label className={s.label}>Confirm New Password</label>
                    <div className={s.passwordWrapper}>
                      <input
                        className={s.input}
                        type={showConfirm ? 'text' : 'password'}
                        value={passwords.confirmPassword}
                        onChange={setPw('confirmPassword')}
                        placeholder="Repeat new password"
                        required
                      />
                      <button type="button" className={s.togglePassword} onClick={() => setShowConfirm(!showConfirm)}>
                        <span className="icon" style={{ fontSize: 20 }}>{showConfirm ? 'visibility_off' : 'visibility'}</span>
                      </button>
                    </div>
                    {passwords.newPassword && passwords.confirmPassword && passwords.newPassword !== passwords.confirmPassword && (
                      <p className={s.errorText}>Passwords don't match</p>
                    )}
                  </div>
                </div>
                <div className={s.saveBar}>
                  <button type="submit" className={s.saveBtn} disabled={saving}>
                    {saving ? <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : 'Change Password'}
                  </button>
                </div>
              </form>
            )}

            {/* Danger Zone */}
            {tab === 'danger' && (
              <div>
                <h2 className={s.sectionTitle}>Danger Zone</h2>
                <p className={s.sectionDesc}>These actions are permanent and cannot be undone.</p>
                <div className={s.dangerSection}>
                  <div className={s.dangerCard}>
                    <div>
                      <div className={s.dangerTitle}>Delete Account</div>
                      <div className={s.dangerDesc}>Permanently delete your account and all your data.</div>
                    </div>
                    <button onClick={deleteAccount} className={`${s.dangerBtn} ${s.dangerBtnDelete}`}>
                      Delete Account
                    </button>
                  </div>
                  <div className={s.dangerCard} style={{ borderColor: '#fed7aa' }}>
                    <div>
                      <div className={s.dangerTitle}>Sign Out</div>
                      <div className={s.dangerDesc}>Sign out of your account on this device.</div>
                    </div>
                    <button onClick={() => { logout(); navigate('/') }} className={`${s.dangerBtn} ${s.dangerBtnSignout}`}>
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