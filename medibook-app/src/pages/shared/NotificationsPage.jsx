import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../../components/layout/Navbar'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../components/ui/Toast'
import s from './NotificationsPage.module.css'

/* ── أيقونة ونمط حسب النوع (مطابقة للخريطة القديمة) ────────── */
const TYPE_META = {
  appointment:  { icon: 'calendar_month', bg: '#eff6ff', color: '#2563eb', className: s.typeAppointment },
  reminder:     { icon: 'notifications',  bg: '#fffbeb', color: '#d97706', className: s.typeReminder },
  review:       { icon: 'star',           bg: '#fdf4ff', color: '#9333ea', className: s.typeReview },
  system:       { icon: 'info',           bg: '#f0fdf4', color: '#16a34a', className: s.typeSystem },
  cancellation: { icon: 'cancel',         bg: '#fef2f2', color: '#dc2626', className: s.typeCancellation },
  emergency:    { icon: 'warning',        bg: '#fee2e2', color: '#dc2626', className: s.typeEmergency },
}

const FILTERS = ['all', 'unread']

export default function NotificationsPage() {
  const { apiFetch, setUnreadCount } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()

  const [notifs, setNotifs] = useState([])
  const [unread, setUnread] = useState(0)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  /* ── جلب الإشعارات ──────────────────────────────────────────── */
  const load = async () => {
    setLoading(true)
    try {
      const d = await apiFetch('/notifications?limit=50')
      setNotifs(d.notifications || [])
      setUnread(d.unreadCount || 0)
    } catch { /* fallback */ }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  /* ── تعليم إشعار كمقروء ────────────────────────────────────── */
  const markRead = async (id) => {
    try {
      await apiFetch(`/notifications/${id}/read`, { method: 'PATCH' })
      setNotifs(n => n.map(x => x._id === id ? { ...x, read: true } : x))
      setUnread(u => { const next = Math.max(0, u - 1); setUnreadCount(next); return next })
    } catch { /* ignore */ }
  }

  /* ── تعليم الكل كمقروء ──────────────────────────────────────── */
  const markAllRead = async () => {
    try {
      await apiFetch('/notifications/mark-all-read', { method: 'PATCH' })
      setNotifs(n => n.map(x => ({ ...x, read: true })))
      setUnread(0)
      setUnreadCount(0)
      toast('All notifications marked as read')
    } catch (err) { toast(err.message, 'error') }
  }

  /* ── حذف إشعار ──────────────────────────────────────────────── */
  const del = async (id) => {
    try {
      await apiFetch(`/notifications/${id}`, { method: 'DELETE' })
      const n = notifs.find(x => x._id === id)
      if (n && !n.read) setUnread(u => Math.max(0, u - 1))
      setNotifs(prev => prev.filter(x => x._id !== id))
    } catch (err) { toast(err.message, 'error') }
  }

  /* ── الضغط على الإشعار (التنقل + تعليم كمقروء) ────────────── */
  const handleClick = async (n) => {
    if (!n.read) await markRead(n._id)
    navigate(n.link || '/')
  }

  /* ── فلترة الإشعارات ────────────────────────────────────────── */
  let filtered = filter === 'unread' ? notifs.filter(n => !n.read) : notifs
  if (searchQuery.trim()) {
    const q = searchQuery.trim().toLowerCase()
    filtered = filtered.filter(n =>
      n.title?.toLowerCase().includes(q) || n.body?.toLowerCase().includes(q)
    )
  }

  /* ── وقت نسبي ────────────────────────────────────────────────── */
  const timeAgo = (t) => {
    const diff = (Date.now() - new Date(t)) / 1000
    if (diff < 60) return 'Just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return `${Math.floor(diff / 86400)}d ago`
  }

  /* ── إشعارات الأولوية (طوارئ غير مقروءة) ──────────────────── */
  const priorityNotifs = notifs.filter(n => n.type === 'emergency' && !n.read).slice(0, 1)

  return (
    <div className="page">
      <Navbar />

      <div className={s.pageWrap}>
        {/* ── Header ── */}
        <div className={s.headerSection}>
          <div className={s.titleRow}>
            <h1 className={s.pageTitle}>Notification Center</h1>
            {unread > 0 && <span className={s.unreadBadge}>{unread} new</span>}
          </div>
          <div className={s.headerActions}>
            <div className={s.searchWrapper}>
              <span className={`icon ${s.searchIcon}`}>search</span>
              <input
                className={s.searchInput}
                type="text"
                placeholder="Search notifications..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <button className={s.actionBtn} onClick={markAllRead} disabled={unread === 0}>
              <span className="icon" style={{ fontSize: 18 }}>done_all</span> Mark Read
            </button>
            <button className={`${s.actionBtn} ${s.dangerBtn}`} onClick={() => {
              if (window.confirm('Delete all notifications?')) {
                notifs.forEach(n => del(n._id))
              }
            }} disabled={notifs.length === 0}>
              <span className="icon" style={{ fontSize: 18 }}>delete_sweep</span> Clear All
            </button>
          </div>
        </div>

        {/* ── Main Layout ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, alignItems: 'flex-start' }}>
          {/* ── Left Column ── */}
          <div>
            {/* Filters */}
            <div className={s.filtersBar}>
              {FILTERS.map(f => (
                <button
                  key={f}
                  className={`${s.filterTab} ${filter === f ? s.filterTabActive : ''}`}
                  onClick={() => setFilter(f)}
                >
                  {f === 'all' ? 'All' : 'Unread'}
                </button>
              ))}
            </div>

            {/* Priority Section */}
            {priorityNotifs.length > 0 && (
              <div className={s.prioritySection}>
                <div className={s.priorityLabel}>
                  <span className="icon" style={{ color: '#dc2626' }}>priority_high</span>
                  Priority Notifications
                </div>
                {priorityNotifs.map(n => (
                  <div key={n._id} className={s.priorityCard}>
                    <div className={s.priorityIcon}>
                      <span className="icon" style={{ fontSize: 20 }}>warning</span>
                    </div>
                    <div className={s.priorityContent}>
                      <div className={s.priorityTitle}>{n.title}</div>
                      <div className={s.priorityDesc}>{n.body}</div>
                      <div className={s.priorityActions}>
                        <button
                          className="btn btn-primary"
                          style={{ fontSize: 12, padding: '6px 14px' }}
                          onClick={() => handleClick(n)}
                        >
                          Review
                        </button>
                        <span className={s.priorityTime}>{timeAgo(n.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Notification List */}
            {loading ? (
              <div className={s.spinnerWrap}><div className="spinner" /></div>
            ) : filtered.length === 0 ? (
              <div className={s.emptyState}>
                <span className={`icon ${s.emptyIcon}`}>notifications_off</span>
                <h3 className={s.emptyTitle}>All caught up!</h3>
                <p className={s.emptyText}>No {filter === 'unread' ? 'unread ' : ''}notifications.</p>
              </div>
            ) : (
              <div>
                {filtered.map(n => {
                  const meta = TYPE_META[n.type] || TYPE_META.system
                  return (
                    <div
                      key={n._id}
                      className={s.notificationCard}
                      onClick={() => handleClick(n)}
                      style={{ borderLeft: n.read ? '3px solid transparent' : '3px solid #0ea5e9' }}
                    >
                      {!n.read && <div className={s.unreadDot} />}
                      <div className={s.notifIcon} style={{ background: meta.bg, color: meta.color }}>
                        <span className="icon icon-filled">{meta.icon}</span>
                      </div>
                      <div className={s.notifContent}>
                        <div className={s.notifHeader}>
                          <span className={s.notifTitle}>{n.title}</span>
                          <span className={`${s.notifType} ${meta.className}`}>
                            {n.type?.replace('_', ' ')}
                          </span>
                        </div>
                        <p className={s.notifBody}>{n.body}</p>
                        <div className={s.notifActions}>
                          <span className={s.notifTime}>{timeAgo(n.createdAt)}</span>
                          {!n.read && (
                            <button
                              className={s.markReadBtn}
                              onClick={(e) => { e.stopPropagation(); markRead(n._id) }}
                            >
                              Mark Read
                            </button>
                          )}
                          <button
                            className={s.deleteBtn}
                            onClick={(e) => { e.stopPropagation(); del(n._id) }}
                          >
                            <span className="icon" style={{ fontSize: 18 }}>close</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* ── Right Sidebar ── */}
          <aside className={s.sidebar}>
            {/* Delivery Settings */}
            <div className={s.sidebarCard}>
              <div className={s.sidebarCardHeader}>Delivery Settings</div>
              <div className={s.sidebarCardBody}>
                {[
                  { label: 'Email Notifications', sub: 'Daily digest & urgent alerts', checked: true },
                  { label: 'SMS Alerts', sub: 'Urgent appointment changes', checked: false },
                  { label: 'Push Notifications', sub: 'In-app and desktop alerts', checked: true },
                ].map((item, idx) => (
                  <div key={idx} className={s.toggleRow}>
                    <div>
                      <div className={s.toggleLabel}>{item.label}</div>
                      <div className={s.toggleSub}>{item.sub}</div>
                    </div>
                    <label className={s.switch}>
                      <input type="checkbox" defaultChecked={item.checked} />
                      <span className={s.slider}></span>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Security Tip */}
            <div className={s.securityCard}>
              <div className={s.securityTitle}>
                <span className="icon" style={{ fontSize: 18 }}>shield_person</span>
                Security Tip
              </div>
              <h4 className={s.securityHeading}>Keep your medical data safe.</h4>
              <p className={s.securityText}>Always ensure you're using a private connection when accessing your health records.</p>
              <Link to="/settings" className={s.securityLink}>
                Review Security Settings
                <span className="icon" style={{ fontSize: 14 }}>arrow_forward</span>
              </Link>
            </div>

            {/* Help Links */}
            <div className={s.helpLinks}>
              <Link to="/faq" className={s.helpLink}>
                <span className="icon" style={{ fontSize: 16 }}>help</span>
                FAQ & Support
              </Link>
              <Link to="/privacy" className={s.helpLink}>
                <span className="icon" style={{ fontSize: 16 }}>description</span>
                Privacy Policy
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}