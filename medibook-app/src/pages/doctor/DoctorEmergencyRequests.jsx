import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../../components/layout/Navbar'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../components/ui/Toast'
import s from './DoctorEmergencyRequests.module.css'

/* ── Helper: أيقونة ولون حسب النوع ──────────────────────────── */
const getRequestMeta = (type) => {
  if (type === 'teleconsult') return { icon: 'videocam', bg: '#e0f2fe', color: '#0369a1' }
  return { icon: 'forum', bg: '#f3e8ff', color: '#7c3aed' }
}

export default function DoctorEmergencyRequests() {
  const { apiFetch, user } = useAuth()
  const toast = useToast()

  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)

  // جلب الطلبات المعلقة
  const loadRequests = async () => {
    setLoading(true)
    try {
      const data = await apiFetch('/emergency/doctor/pending')
      setRequests(data.requests || [])
    } catch {
      setRequests([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRequests()
  }, [])

  // التعامل مع طلب (قبول/رفض)
  const handleAction = async (id, action) => {
    setProcessing(true)
    try {
      await apiFetch(`/emergency/${id}/handle`, {
        method: 'PATCH',
        body: JSON.stringify({ action })
      })
      toast(`Request ${action === 'accept' ? 'accepted' : 'rejected'} successfully!`)
      loadRequests()
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setProcessing(false)
    }
  }

  // إحصائيات سريعة
  const activeCount = requests.length
  const teleconsultCount = requests.filter(r => r.type === 'teleconsult').length
  const supportCount = requests.filter(r => r.type === 'support_chat').length

  return (
    <div className="page">
      <Navbar />
      <div className={s.pageWrap}>
        {/* Header */}
        <div className={s.headerSection}>
          <div>
            <h1 className={s.pageTitle}>Emergency Support &amp; Requests</h1>
            <p className={s.pageSub}>
              Real-time status of urgent clinical assistance and teleconsultation requests.
            </p>
          </div>
          {/* يمكنك إضافة زر "طلب مساعدة" لتحويل الطبيب إلى دور المريض، لكن ليس ضرورياً هنا */}
        </div>

        {/* KPI Cards */}
        <div className={s.kpiGrid}>
          <div className={s.kpiCard}>
            <div className={s.kpiIcon} style={{ background: '#e0f2fe', color: '#0369a1' }}>
              <span className="icon" style={{ fontSize: 28 }}>emergency</span>
            </div>
            <div>
              <div className={s.kpiLabel}>Active Requests</div>
              <div className={s.kpiValue}>{activeCount}</div>
            </div>
          </div>
          <div className={s.kpiCard}>
            <div className={s.kpiIcon} style={{ background: '#ecfdf5', color: '#059669' }}>
              <span className="icon" style={{ fontSize: 28 }}>videocam</span>
            </div>
            <div>
              <div className={s.kpiLabel}>Teleconsults</div>
              <div className={s.kpiValue}>{teleconsultCount}</div>
            </div>
          </div>
          <div className={s.kpiCard}>
            <div className={s.kpiIcon} style={{ background: '#fef3c7', color: '#d97706' }}>
              <span className="icon" style={{ fontSize: 28 }}>forum</span>
            </div>
            <div>
              <div className={s.kpiLabel}>Support Chats</div>
              <div className={s.kpiValue}>{supportCount}</div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className={s.mainLayout}>
          {/* Left: قائمة الطلبات */}
          <div>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: '#0b1c30', marginBottom: 16 }}>
              Current Requests
            </h3>
            {loading ? (
              <div className={s.spinnerWrap}><div className="spinner" /></div>
            ) : requests.length === 0 ? (
              <div className={s.emptyState}>
                <span className={`icon ${s.emptyIcon}`}>inbox</span>
                <h3 className={s.emptyTitle}>No pending requests</h3>
                <p className={s.emptyText}>
                  All emergency requests have been handled. Great job!
                </p>
              </div>
            ) : (
              requests.map(req => {
                const meta = getRequestMeta(req.type)
                return (
                  <div key={req._id} className={s.requestCard}>
                    <div className={s.requestIcon} style={{ background: meta.bg, color: meta.color }}>
                      <span className="icon" style={{ fontSize: 28 }}>{meta.icon}</span>
                    </div>
                    <div className={s.requestInfo}>
                      <div className={s.requestTitle}>
                        {req.type === 'teleconsult' ? 'Clinical Teleconsultation' : 'Emergency Support Chat'}
                        <span className={`${s.statusBadge} ${s.statusPending} ${s.pulse}`}>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'currentColor', display: 'inline-block' }}></span>
                          PENDING
                        </span>
                      </div>
                      <div className={s.requestMeta}>
                        <span>ID: {req._id.toString().slice(-6)}</span>
                        <span>·</span>
                        <span>{req.patient?.name || 'Unknown Patient'}</span>
                        <span>·</span>
                        <span>{req.patient?.email || ''}</span>
                        <span>·</span>
                        <span>{new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      {req.message && (
                        <p style={{ fontSize: 13, color: '#475569', marginTop: 8, fontStyle: 'italic' }}>
                          "{req.message}"
                        </p>
                      )}
                    </div>
                    <div className={s.requestActions}>
                      <button
                        className={s.acceptBtn}
                        onClick={() => handleAction(req._id, 'accept')}
                        disabled={processing}
                      >
                        Accept
                      </button>
                      <button
                        className={s.rejectBtn}
                        onClick={() => handleAction(req._id, 'reject')}
                        disabled={processing}
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Right: Sidebar */}
          <aside className={s.sidebar}>
            {/* Emergency Contacts (قائمة ثابتة) */}
            <div className={s.sidebarCard} style={{ background: '#fef2f2', borderColor: '#fecaca' }}>
              <h4 className={s.sidebarTitle} style={{ color: '#dc2626' }}>
                <span className="icon" style={{ fontSize: 20 }}>contact_emergency</span>
                Emergency Contacts
              </h4>
              <button className={s.contactItem}>
                <div>
                  <div className={s.contactName}>Local EMS Dispatch</div>
                  <div className={s.contactDesc}>123</div>
                </div>
                <span className="icon" style={{ color: '#dc2626' }}>call</span>
              </button>
              <button className={s.contactItem}>
                <div>
                  <div className={s.contactName}>On-Call Director</div>
                  <div className={s.contactDesc}>+20 10 1234 5678</div>
                </div>
                <span className="icon" style={{ color: '#0ea5e9' }}>medical_services</span>
              </button>
            </div>

            {/* Safety Instructions */}
            <div className={s.sidebarCard}>
              <h4 className={s.sidebarTitle}>
                <span className="icon" style={{ color: '#0ea5e9' }}>info</span>
                Safety Instructions
              </h4>
              <div className={s.safetySteps}>
                <div className={s.stepItem}>
                  <div className={s.stepNumber}>1</div>
                  <p className={s.stepText}>Verify patient identity before sharing any clinical advice.</p>
                </div>
                <div className={s.stepItem}>
                  <div className={s.stepNumber}>2</div>
                  <p className={s.stepText}>Keep communication within the platform for legal record-keeping.</p>
                </div>
                <div className={s.stepItem}>
                  <div className={s.stepNumber}>3</div>
                  <p className={s.stepText}>If symptoms are life-threatening, instruct patient to call emergency services immediately.</p>
                </div>
              </div>
              <div className={s.locationInfo}>
                Your response time is being recorded for quality assurance.
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}