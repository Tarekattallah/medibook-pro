import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../../components/layout/Navbar'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../components/ui/Toast'
import s from './AppointmentsPage.module.css'

const TABS = [
  { key: 'confirmed', label: 'Upcoming' },
  { key: 'completed', label: 'Past' },
  { key: 'cancelled', label: 'Cancelled' },
]

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

/* ── Reschedule Modal ──────────────────────────────────────────── */
function RescheduleModal({ appointment, onClose, onSaved }) {
  const { apiFetch } = useAuth()
  const toast = useToast()
  const [selDay, setSelDay] = useState(0)
  const [selSlot, setSelSlot] = useState('')
  const [slots, setSlots] = useState([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const date = new Date(); date.setDate(date.getDate() + selDay)
    const iso = date.toISOString().split('T')[0]
    apiFetch(`/doctors/${appointment.doctor?._id}/availability?date=${iso}`)
      .then(d => setSlots(d.slots || [])).catch(() => setSlots([]))
    setSelSlot('')
  }, [selDay])

  const save = async () => {
    if (!selSlot) { toast('Please select a time slot', 'error'); return }
    setSaving(true)
    const date = new Date(); date.setDate(date.getDate() + selDay)
    try {
      await apiFetch(`/appointments/${appointment._id}/reschedule`, {
        method: 'PATCH',
        body: JSON.stringify({ date: date.toISOString().split('T')[0], timeSlot: selSlot })
      })
      toast('Appointment rescheduled!')
      onSaved()
    } catch (err) { toast(err.message, 'error') }
    finally { setSaving(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24 }}>
      <div className="card fade-in" style={{ width: '100%', maxWidth: 420, padding: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0b1c30' }}>Reschedule Appointment</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
            <span className="icon" style={{ fontSize: 22 }}>close</span>
          </button>
        </div>
        <div style={{ background: '#f8fafc', borderRadius: 10, padding: 12, marginBottom: 20, fontSize: 13 }}>
          <div style={{ color: '#64748b', marginBottom: 4 }}>Current appointment:</div>
          <div style={{ fontWeight: 700, color: '#0b1c30' }}>{appointment.doctor?.name} — {new Date(appointment.date).toLocaleDateString('en', { month: 'short', day: 'numeric' })} at {appointment.timeSlot}</div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>New Date</div>
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
            {DAYS.map((d, i) => {
              const date = new Date(); date.setDate(date.getDate() + i + 1)
              return (
                <button key={d} onClick={() => setSelDay(i)}
                  style={{ flexShrink: 0, padding: '8px 10px', borderRadius: 8, border: `1.5px solid ${selDay === i ? '#0ea5e9' : '#e2e8f0'}`, background: selDay === i ? '#f0f9ff' : '#fff', cursor: 'pointer', textAlign: 'center', minWidth: 48 }}>
                  <div style={{ fontSize: 10, color: selDay === i ? '#0ea5e9' : '#94a3b8', fontWeight: 700 }}>{d}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: selDay === i ? '#0ea5e9' : '#374151' }}>{date.getDate()}</div>
                </button>
              )
            })}
          </div>
        </div>
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>New Time</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6 }}>
            {slots.length === 0 && <p style={{ gridColumn: '1/-1', fontSize: 13, color: '#94a3b8', textAlign: 'center', padding: '10px 0' }}>No slots</p>}
            {slots.map(s => (
              <button key={s.time} disabled={!s.available} onClick={() => setSelSlot(s.time)}
                style={{ padding: '7px 4px', borderRadius: 7, border: `1.5px solid ${selSlot === s.time ? '#0ea5e9' : s.available ? '#e2e8f0' : '#f1f5f9'}`, background: selSlot === s.time ? '#0ea5e9' : s.available ? '#fff' : '#f8fafc', color: selSlot === s.time ? '#fff' : s.available ? '#374151' : '#cbd5e1', fontSize: 11, fontFamily: 'JetBrains Mono,monospace', fontWeight: 600, cursor: s.available ? 'pointer' : 'not-allowed' }}>
                {s.time}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
          <button onClick={save} disabled={!selSlot || saving} className="btn btn-primary" style={{ flex: 2 }}>
            {saving ? <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : 'Confirm Reschedule'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── مكون الصورة الرمزية ──────────────────────────────────────── */
function DoctorAvatar({ doctor }) {
  const [imgErr, setImgErr] = useState(false)

  const src = doctor?.avatar
    ? (doctor.avatar.startsWith('http') ? doctor.avatar : `${import.meta.env.VITE_API_URL ?? ''}${doctor.avatar}`)
    : null

  const initials = doctor?.name
    ? doctor.name.split(' ').filter((_, i) => i > 0).map(w => w[0]).slice(0, 2).join('') || 'DR'
    : 'DR'

  if (src && !imgErr) {
    return (
      <div className={s.doctorAvatar}>
        <img src={src} alt={doctor.name} onError={() => setImgErr(true)} />
      </div>
    )
  }
  return <div className={s.avatarInitials}>{initials}</div>
}

/* ── الصفحة الرئيسية ──────────────────────────────────────────── */
export default function AppointmentsPage() {
  const { apiFetch } = useAuth()
  const toast = useToast()
  const [allApts, setAllApts] = useState([])
  const [tab, setTab] = useState('confirmed')
  const [loading, setLoading] = useState(true)
  const [rescheduleApt, setRescheduleApt] = useState(null)
  const [emergencyLoading, setEmergencyLoading] = useState(false)  // ← جديد

  const loadAll = useCallback(() => {
    setLoading(true)
    apiFetch('/appointments/my?limit=100')
      .then(d => setAllApts(d.appointments || []))
      .catch(() => setAllApts([]))
      .finally(() => setLoading(false))
  }, [apiFetch])

  useEffect(() => { loadAll() }, [loadAll])

  const reloadAfterAction = () => {
    if (rescheduleApt) setRescheduleApt(null)
    loadAll()
  }

  const cancel = async id => {
    if (!window.confirm('Cancel this appointment?')) return
    try {
      await apiFetch(`/appointments/${id}/cancel`, {
        method: 'PATCH',
        body: JSON.stringify({ reason: 'Cancelled by patient' })
      })
      toast('Appointment cancelled')
      reloadAfterAction()
    } catch (err) { toast(err.message, 'error') }
  }

  // ← جديد: إرسال طلب استشارة فورية أو دعم
  const handleEmergencyRequest = async (type) => {
    setEmergencyLoading(true)
    try {
      await apiFetch('/emergency/request', {
        method: 'POST',
        body: JSON.stringify({ type })
      })
      toast(
        `Your ${type === 'teleconsult' ? 'teleconsult' : 'support'} request has been sent. We'll contact you soon.`,
        'success'
      )
    } catch (err) {
      toast(err.message || 'Failed to send request. Try again.', 'error')
    } finally {
      setEmergencyLoading(false)
    }
  }

  const filteredApts = allApts.filter(a => a.status === tab)
  const countByStatus = (status) => allApts.filter(a => a.status === status).length

  return (
    <div className="page">
      <Navbar />
      {rescheduleApt && <RescheduleModal appointment={rescheduleApt} onClose={() => setRescheduleApt(null)} onSaved={reloadAfterAction} />}

      <div className={s.pageWrap}>
        <div className={s.headerRow}>
          <h1 className={s.pageTitle}>My Appointments</h1>
          <Link to="/search" className="btn btn-primary" style={{ fontSize: 14 }}>
            <span className="icon" style={{ fontSize: 17 }}>add</span> Book New
          </Link>
          <Link to="/patient/emergency-requests" className="btn btn-secondary" style={{ fontSize: 14 }}>
            <span className="icon" style={{ fontSize: 17 }}>history</span> My Requests
          </Link>
        </div>

        <div className={s.tabsBar}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`${s.tabBtn} ${tab === t.key ? s.tabActive : ''}`}>
              {t.label}
              <span className={s.tabBadge}>{countByStatus(t.key)}</span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className={s.spinnerWrap}><div className="spinner" /></div>
        ) : filteredApts.length === 0 ? (
          <div className={s.emptyState}>
            <span className={`icon ${s.emptyIcon}`}>calendar_today</span>
            <h3 className={s.emptyTitle}>No {TABS.find(t => t.key === tab)?.label.toLowerCase()} appointments</h3>
            <Link to="/search" className="btn btn-primary" style={{ marginTop: 8, fontSize: 14 }}>Book an Appointment</Link>
          </div>
        ) : (
          filteredApts.map(a => (
            <div key={a._id} className={s.appointmentCard}>
              <div className={s.cardLeft}>
                <DoctorAvatar doctor={a.doctor} />
                <div>
                  <div className={s.doctorName}>
                    {a.doctor?.name}
                    <span className={`${s.statusBadge} ${s[`status${a.status.charAt(0).toUpperCase() + a.status.slice(1)}`]}`}>
                      {a.status}
                    </span>
                  </div>
                  <div className={s.specialty}>{a.doctor?.specialty}</div>
                  <div className={s.metaRow}>
                    <span className={s.metaItem}>
                      <span className="icon" style={{ fontSize: 15 }}>calendar_month</span>
                      {new Date(a.date).toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    <span className={s.metaItem}>
                      <span className="icon" style={{ fontSize: 15 }}>schedule</span>
                      {a.timeSlot}
                    </span>
                    <span className={s.metaItem}>
                      <span className="icon" style={{ fontSize: 15 }}>{a.type === 'video' ? 'videocam' : 'local_hospital'}</span>
                      {a.type}
                    </span>
                  </div>
                </div>
              </div>

              <div className={s.cardRight}>
                {a.status === 'confirmed' && (
                  <>
                    <button onClick={() => setRescheduleApt(a)} className="btn btn-secondary" style={{ fontSize: 12, padding: '6px 12px' }}>
                      <span className="icon" style={{ fontSize: 15 }}>edit_calendar</span> Reschedule
                    </button>
                    <button onClick={() => cancel(a._id)} className="btn btn-danger" style={{ fontSize: 12, padding: '6px 12px' }}>Cancel</button>
                  </>
                )}
                {a.status === 'pending' && (
                  <button onClick={() => cancel(a._id)} className="btn btn-danger" style={{ fontSize: 12, padding: '6px 12px' }}>Cancel</button>
                )}
                {a.status === 'cancelled' && (
                  <Link to={`/doctor/${a.doctor?._id}`} className="btn btn-secondary" style={{ fontSize: 12, padding: '6px 12px', textDecoration: 'none' }}>Rebook</Link>
                )}
                {a.status === 'completed' && (
                  <Link to={`/doctor/${a.doctor?._id}`} className="btn btn-secondary" style={{ fontSize: 12, padding: '6px 12px', textDecoration: 'none' }}>
                    <span className="icon" style={{ fontSize: 15 }}>star</span> Review
                  </Link>
                )}
              </div>
            </div>
          ))
        )}

        {/* قائمة التحضير */}
        <div className={s.checklistSection}>
          <div className={s.checklistHeader}>
            <span className="icon" style={{ color: '#0ea5e9', fontSize: 22 }}>checklist</span>
            Preparation Checklist
          </div>
          <div className={s.checklistGrid}>
            <div className={s.checklistItem}>
              <span className="icon" style={{ color: '#0ea5e9', fontSize: 20 }}>id_card</span>
              Bring ID &amp; Insurance Card
            </div>
            <div className={s.checklistItem}>
              <span className="icon" style={{ color: '#0ea5e9', fontSize: 20 }}>schedule</span>
              Arrive 15 mins early
            </div>
            <div className={s.checklistItem}>
              <span className="icon" style={{ color: '#0ea5e9', fontSize: 20 }}>pill</span>
              Bring medication list
            </div>
          </div>
        </div>

        {/* إجراءات سريعة – الأزرار مربوطة الآن بالخادم */}
        <div className={s.quickActions}>
          <div className={s.teleconsultCard}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div className={s.teleconsultIcon}>
                <span className="icon" style={{ fontSize: 28 }}>emergency</span>
              </div>
              <div>
                <h4 style={{ fontWeight: 600, color: '#0b1c30', marginBottom: 4 }}>Need immediate care?</h4>
                <p style={{ fontSize: 13, color: '#64748b' }}>Connect with our 24/7 on-call specialists in minutes.</p>
              </div>
            </div>
            <button
              className="btn btn-primary"
              style={{ whiteSpace: 'nowrap' }}
              onClick={() => handleEmergencyRequest('teleconsult')}
              disabled={emergencyLoading}
            >
              {emergencyLoading ? <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : 'Start Teleconsult'}
            </button>
          </div>
          <div className={s.quickSupportCard}>
            <div>
              <h4 style={{ fontWeight: 600, color: '#0b1c30', marginBottom: 4 }}>Quick Support</h4>
              <p style={{ fontSize: 13, color: '#64748b', marginBottom: 8 }}>Talk to our 24/7 care team.</p>
              <button
                className="btn btn-secondary"
                style={{ fontSize: 12, padding: '6px 12px' }}
                onClick={() => handleEmergencyRequest('support_chat')}
                disabled={emergencyLoading}
              >
                {emergencyLoading ? 'Sending...' : 'Chat Now'}
              </button>
            </div>
          </div>
        </div>

        {/* معلومات الصحة */}
        <div className={s.healthInsights}>
          <h4 className={s.healthHeader}>Health Insights</h4>
          <div className={s.healthRow}>
            <div>
              <p className={s.healthLabel}>Blood Pressure</p>
              <p className={s.healthValue}>120/80</p>
            </div>
            <div className={s.healthBars}>
              <div className={s.bar} style={{ background: '#e0f2fe', height: '60%' }} />
              <div className={s.bar} style={{ background: '#bae6fd', height: '80%' }} />
              <div className={s.bar} style={{ background: '#0ea5e9', height: '100%' }} />
            </div>
          </div>
          <div className={s.healthRow}>
            <div>
              <p className={s.healthLabel}>Heart Rate</p>
              <p className={s.healthValue}>72 bpm</p>
            </div>
            <div className={s.healthBars}>
              <div className={s.bar} style={{ background: '#a7f3d0', height: '80%' }} />
              <div className={s.bar} style={{ background: '#6ee7b7', height: '100%' }} />
              <div className={s.bar} style={{ background: '#34d399', height: '60%' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}