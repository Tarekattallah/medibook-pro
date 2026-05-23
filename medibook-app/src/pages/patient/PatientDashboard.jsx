import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../../components/layout/Navbar'
import { useAuth } from '../../context/AuthContext'
import s from './PatientDashboard.module.css'

export default function PatientDashboard() {
  const { user, apiFetch } = useAuth()
  const [apts, setApts] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [weeklyStats, setWeeklyStats] = useState([])
  const [recentActivity, setRecentActivity] = useState([])
  const [recommendedDoctors, setRecommendedDoctors] = useState([])  // <-- جديد

  useEffect(() => {
    // جلب كل البيانات معاً لتجنب تأخير عرض الأقسام
    Promise.all([
      apiFetch('/appointments/my?limit=20'),
      apiFetch('/appointments/stats/weekly'),
      apiFetch('/appointments/recent?limit=5'),
      apiFetch('/doctors/search?minRating=4.5&limit=4')   // <-- الأطباء الموصى بهم
    ]).then(([aptsData, weeklyData, recentData, doctorsData]) => {
      const all = aptsData.appointments || []
      setApts(all)
      const uniqueDoctors = [...new Set(all.map(a => a.doctor?._id).filter(Boolean))]
      setStats({
        total: all.length,
        upcoming: all.filter(a => ['confirmed', 'pending'].includes(a.status)).length,
        completed: all.filter(a => a.status === 'completed').length,
        cancelled: all.filter(a => a.status === 'cancelled').length,
        doctors: uniqueDoctors.length,
      })
      setWeeklyStats(weeklyData.stats || [])
      setRecentActivity(recentData.activities || [])
      setRecommendedDoctors(doctorsData.doctors || [])      // <-- تعيين الأطباء
    }).catch(() => {}).finally(() => setLoading(false))
  }, [apiFetch])

  const upcoming = apts.filter(a => ['confirmed', 'pending'].includes(a.status)).slice(0, 3)
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  // حساب أقصى قيمة للرسم البياني لضبط الارتفاع النسبي
  const maxWeeklyCount = Math.max(...weeklyStats.map(d => d.count), 1)

  // مساعد لعرض الصورة الرمزية أو الأحرف الأولى للطبيب
  const renderDoctorAvatar = (doc) => {
    if (doc.avatar) {
      return <img src={doc.avatar} alt={doc.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
    }
    // استخراج الأحرف الأولى من الاسم (بعد "Dr." لو موجود)
    const initials = doc.name
      ? doc.name.replace(/^Dr\.\s*/i, '').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
      : 'DR'
    return initials
  }

  return (
    <div className="page">
      <Navbar />

      <main style={{ width: '100%', padding: '24px 20px' }}>

        {/* ── التحية ── */}
        <section style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, marginBottom: 4 }}>
            <h1 style={{ fontSize: 30, fontWeight: 700, color: '#0b1c30', letterSpacing: '-0.01em' }}>
              {greeting}, {user?.name?.split(' ')[0]}
              <span style={{ display: 'inline-block', animation: 'float 3s ease-in-out infinite', marginLeft: 8 }}>👋</span>
            </h1>
          </div>
          <p style={{ fontSize: 15, color: '#64748b', marginTop: 6 }}>
            {loading ? 'Loading your health summary...' : upcoming.length > 0
              ? `You have ${upcoming.length} upcoming appointment${upcoming.length > 1 ? 's' : ''}`
              : 'No upcoming appointments — book one today and stay on top of your health.'}
          </p>
        </section>

        {/* ── Hero Banner ── */}
        <div className={s.heroBanner} style={{ height: 320, marginBottom: 24 }}>
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuC6YpAJTXUFhMLc9aO_DAKrTehjq8agH_HPCImKa3R3FT9rb5R2lZY9QIS5dBLZt4_FomcVe2O3orgLB7LTUrO_PFRi81L_GzaduPUMx45F681ufvI_RF4I5nD7MMMB99IBPmbGfJBvjU68j_yzPY9YXWNJwD0npyb_rgwdWJvkkcWm9HXFEJ-rvnuAKKGRhb14-8JqvMB0pZ3CjNaYS2cCQGZ_6PP5A9FRxHPdQzFqs1CFn2RLVoCr54n2cYJh-5SYJcU8xV3lv90"
            alt="Healthcare Banner"
            style={{ objectFit: 'cover', objectPosition: 'center 28%', width: '100%', height: '100%' }}
          />
          <div className={s.heroOverlay}>
            <h2 className={s.heroTitle}>World-Class Healthcare,<br />At Your Fingertips.</h2>
            <p className={s.heroSub}>Access thousands of verified specialists and manage your medical records securely.</p>
            <div>
              <Link to="/search" className={s.heroBtn}>
                <span className="icon" style={{ fontSize: 18 }}>search</span>
                Learn More
              </Link>
            </div>
          </div>
        </div>

        {/* ── Stats Grid ── */}
        {!loading && stats && (
          <div className={s.statsGrid}>
            {[
              { label: 'Total Visits', value: stats.total, icon: 'calendar_month', bg: '#eff6ff', ic: '#2563eb' },
              { label: 'Upcoming', value: stats.upcoming, icon: 'event_available', bg: '#ecfdf5', ic: '#059669' },
              { label: 'Completed', value: stats.completed, icon: 'verified', bg: '#f5f3ff', ic: '#7c3aed' },
              { label: 'Cancelled', value: stats.cancelled, icon: 'cancel', bg: '#fef2f2', ic: '#dc2626' },
              { label: 'Doctors Visited', value: stats.doctors, icon: 'stethoscope', bg: '#fff7ed', ic: '#ea580c' },
            ].map(item => (
              <div key={item.label} className={s.statCard}>
                <div className={s.statIcon} style={{ background: item.bg }}>
                  <span className="icon icon-filled" style={{ fontSize: 22, color: item.ic }}>{item.icon}</span>
                </div>
                <div className={s.statValue}>{item.value}</div>
                <div className={s.statLabel}>{item.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* ── Quick Actions ── */}
        <div className={s.actionsGrid}>
          <Link to="/search" className={`${s.actionCard} ${s.actionPrimary}`}>
            <div className={s.actionIcon} style={{ background: 'rgba(255,255,255,0.2)' }}>
              <span className="icon" style={{ color: '#fff' }}>person_search</span>
            </div>
            <div>
              <div className={s.actionLabel} style={{ color: '#fff' }}>Find a Doctor</div>
              <div className={s.actionSub} style={{ color: 'rgba(255,255,255,0.8)' }}>Browse verified specialists</div>
            </div>
          </Link>
          <Link to="/patient/appointments" className={s.actionCard}>
            <div className={s.actionIcon} style={{ background: '#eff6ff' }}>
              <span className="icon" style={{ color: '#2563eb' }}>event_note</span>
            </div>
            <div>
              <div className={s.actionLabel}>My Appointments</div>
              <div className={s.actionSub}>Manage your schedule</div>
            </div>
          </Link>
          <Link to="/patient/records" className={s.actionCard}>
            <div className={s.actionIcon} style={{ background: '#ecfdf5' }}>
              <span className="icon" style={{ color: '#059669' }}>clinical_notes</span>
            </div>
            <div>
              <div className={s.actionLabel}>Medical Records</div>
              <div className={s.actionSub}>Secure health history</div>
            </div>
          </Link>
        </div>

        {/* ── Main Content: Appointments + Chart + Activity + Sidebar ── */}
        <div className={s.twoCol} style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Upcoming Appointments */}
            <section className={s.appointmentsCard}>
              <div className={s.appointmentsHeader}>
                <h3 className={s.appointmentsTitle}>Upcoming Appointments</h3>
                <Link to="/patient/appointments" className={s.viewAll}>
                  View all <span className="icon" style={{ fontSize: 18 }}>arrow_forward</span>
                </Link>
              </div>
              {loading ? (
                <div style={{ padding: 48, display: 'flex', justifyContent: 'center' }}><div className="spinner" /></div>
              ) : upcoming.length === 0 ? (
                <div className={s.emptyState}>
                  <div className={s.emptyIcon}>
                    <span className="icon" style={{ fontSize: 40, color: '#cbd5e1' }}>calendar_month</span>
                  </div>
                  <h4 className={s.emptyTitle}>No appointments scheduled</h4>
                  <p className={s.emptyText}>You don't have any appointments currently scheduled. Take a proactive step towards your health today.</p>
                  <Link to="/search" className={s.bookBtn}>
                    <span className="icon" style={{ fontSize: 18 }}>add</span>
                    Book Your First Appointment
                  </Link>
                </div>
              ) : (
                upcoming.map(a => (
                  <div key={a._id} className={s.appointmentItem}>
                    <div className={s.doctorAvatar}>{a.doctor?.name?.[4] || 'D'}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: '#0b1c30' }}>{a.doctor?.name}</div>
                      <div style={{ fontSize: 13, color: '#0ea5e9', fontWeight: 600 }}>{a.doctor?.specialty}</div>
                      <div style={{ fontSize: 12, color: '#64748b', marginTop: 2, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <span>{new Date(a.date).toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                        <span>· {a.timeSlot}</span>
                        <span>· {a.type}</span>
                      </div>
                    </div>
                    <span className={`badge badge-${a.status}`} style={{ flexShrink: 0 }}>{a.status}</span>
                  </div>
                ))
              )}
            </section>

            {/* Chart + Recent Activity (side by side) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              {/* Mini Chart – باستخدام بيانات حقيقية */}
              <div className={s.chartCard}>
                <div className={s.chartTitle}>
                  <span className="icon" style={{ color: '#2563eb' }}>bar_chart</span>
                  Visits This Week
                </div>
                <div className={s.chartBars}>
                  {weeklyStats.length > 0 ? (
                    weeklyStats.map(b => {
                      const heightPercent = (b.count / maxWeeklyCount) * 100;
                      return (
                        <div key={b.day} className={s.chartBar}
                          style={{
                            height: `${Math.max(heightPercent, 4)}%`,
                            background: b.count > 0 ? 'linear-gradient(180deg, #0ea5e9, #006591)' : '#e0f2fe',
                          }}>
                          <span className={s.chartBarValue}>{b.count}</span>
                          <span className={s.chartBarLabel}>{b.day}</span>
                        </div>
                      );
                    })
                  ) : (
                    <p className={s.chartEmpty}>No data for this week</p>
                  )}
                </div>
              </div>

              {/* Recent Activity / Timeline – باستخدام بيانات حقيقية */}
              <div className={s.activityCard}>
                <div className={s.activityTitle}>
                  <span className="icon" style={{ color: '#7c3aed' }}>timeline</span>
                  Recent Activity
                </div>
                <div className={s.timeline}>
                  {recentActivity.length > 0 ? (
                    recentActivity.map((a, i) => (
                      <div key={a._id || i} className={s.timelineItem}>
                        <div className={s.timelineDot} style={{
                          background: a.status === 'completed' ? '#ecfdf5' : a.status === 'cancelled' ? '#fef2f2' : '#eff6ff',
                          color: a.status === 'completed' ? '#059669' : a.status === 'cancelled' ? '#dc2626' : '#2563eb',
                        }}>
                          <span className="icon" style={{ fontSize: 16 }}>
                            {a.status === 'completed' ? 'task_alt' : a.status === 'cancelled' ? 'cancel' : 'event'}
                          </span>
                        </div>
                        <div className={s.timelineContent}>
                          <div className={s.timelineLabel}>
                            {a.status === 'completed' ? 'Visit completed' : a.status === 'cancelled' ? 'Appointment cancelled' : 'Appointment booked'}
                          </div>
                          <div className={s.timelineTime}>
                            {a.doctor?.name && `with ${a.doctor.name} · `}
                            {new Date(a.createdAt || a.date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ textAlign: 'center', padding: '24px 0', color: '#94a3b8', fontSize: 13 }}>
                      No recent activity yet.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <aside className={s.sidebar}>
            <div className={s.tipsCard}>
              <div className={s.tipsTitle}>
                <span className="icon" style={{ color: '#006c49' }}>lightbulb</span>
                Health Tips
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[
                  { icon: '💧', title: 'Hydration Goal', desc: 'Drink 8 glasses of water daily.' },
                  { icon: '🏃', title: 'Stay Active', desc: '30 min exercise, 5 days a week.' },
                  { icon: '😴', title: 'Restful Sleep', desc: 'Aim for 7–9 hours of quality sleep.' },
                  { icon: '🥗', title: 'Balanced Diet', desc: 'Eat seasonal fruits and leafy greens.' },
                ].map((tip, i) => (
                  <div key={i} className={s.tipItem}>
                    <span className={s.tipIcon}>{tip.icon}</span>
                    <div>
                      <div className={s.tipTitle}>{tip.title}</div>
                      <div className={s.tipDesc}>{tip.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className={s.ctaCard}>
              <div className={s.ctaBlob}></div>
              <h4 className={s.ctaTitle}>Ready for a checkup?</h4>
              <p className={s.ctaText}>Find a verified specialist and book in minutes.</p>
              <Link to="/search" className={s.ctaButton}>
                <span className="icon" style={{ fontSize: 20 }}>search</span>
                Find a Doctor
              </Link>
            </div>
          </aside>
        </div>

        {/* ── Recommended Doctors (حقيقيون) ── */}
        <div className={s.recommendedSection}>
          <div className={s.recommendedHeader}>
            <h3 className={s.recommendedTitle}>Recommended Doctors</h3>
            <Link to="/search" className={s.viewAll}>
              Browse all <span className="icon" style={{ fontSize: 18 }}>arrow_forward</span>
            </Link>
          </div>
          <div className={s.recommendedGrid}>
            {recommendedDoctors.length > 0 ? (
              recommendedDoctors.map(doc => (
                <Link key={doc._id} to={`/doctor/${doc._id}`} className={s.recommendedCard}>
                  <div className={s.recAvatar}>
                    {doc.avatar ? (
                      <img src={doc.avatar} alt={doc.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      renderDoctorAvatar(doc)
                    )}
                  </div>
                  <div>
                    <div className={s.recName}>{doc.name}</div>
                    <div className={s.recSpec}>{doc.specialty}</div>
                    <div className={s.recRating}>★ {doc.rating?.toFixed(1)}</div>
                  </div>
                </Link>
              ))
            ) : (
              <p style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center', gridColumn: '1 / -1', padding: '20px 0' }}>
                {loading ? 'Loading recommendations...' : 'No recommendations available at the moment.'}
              </p>
            )}
          </div>
        </div>

      </main>
    </div>
  )
}