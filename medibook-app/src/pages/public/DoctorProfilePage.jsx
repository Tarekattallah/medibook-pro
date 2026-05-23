import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import Navbar from '../../components/layout/Navbar'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../components/ui/Toast'
import s from './DoctorProfilePage.module.css'

const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat']

/* ─── Review Form ─── */
function ReviewForm({ doctorId, onSubmitted }) {
  const { apiFetch } = useAuth()
  const toast = useToast()
  const [rating,  setRating]  = useState(0)
  const [hover,   setHover]   = useState(0)
  const [comment, setComment] = useState('')
  const [saving,  setSaving]  = useState(false)

  const submit = async e => {
    e.preventDefault()
    if (!rating) { toast('Please select a rating', 'error'); return }
    setSaving(true)
    try {
      await apiFetch(`/doctors/${doctorId}/reviews`, {
        method: 'POST',
        body: JSON.stringify({ rating, comment })
      })
      toast('Review submitted — thank you!')
      setRating(0); setComment('')
      onSubmitted()
    } catch (err) { toast(err.message, 'error') }
    finally { setSaving(false) }
  }

  return (
    <form onSubmit={submit} className={s.reviewForm}>
      <h3 className={s.reviewFormTitle}>Write a Review</h3>
      <div className={s.starPicker}>
        {[1,2,3,4,5].map(n => (
          <button key={n} type="button"
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            onClick={() => setRating(n)}
            className={s.starBtn}
            style={{ color: (hover || rating) >= n ? '#f59e0b' : '#d1d5db' }}>
            ★
          </button>
        ))}
        {rating > 0 && (
          <span className={s.ratingLabel}>
            {['','Poor','Fair','Good','Very Good','Excellent'][rating]}
          </span>
        )}
      </div>
      <textarea
        value={comment}
        onChange={e => setComment(e.target.value)}
        placeholder="Share your experience with this doctor (optional)..."
        className={s.reviewTextarea}
      />
      <div className={s.reviewFormFooter}>
        <button type="submit" className="btn btn-primary" style={{ fontSize: 13, padding: '8px 20px' }} disabled={saving}>
          {saving ? <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> : 'Submit Review'}
        </button>
      </div>
    </form>
  )
}

/* ─── Avatar ─── */
function DoctorAvatar({ doctor }) {
  const [err, setErr] = useState(false)

  const src = doctor?.avatar
    ? (doctor.avatar.startsWith('http')
        ? doctor.avatar
        : `${import.meta.env.VITE_API_URL ?? ''}${doctor.avatar}`)
    : null

  const initials = doctor?.name
    ?.split(' ').filter((_,i) => i > 0).map(w => w[0]).slice(0,2).join('') || 'DR'

  if (src && !err) {
    return (
      <img
        src={src}
        alt={doctor.name}
        onError={() => setErr(true)}
        className={s.avatarImg}
      />
    )
  }

  return (
    <div className={s.avatarInitials}>
      {initials}
    </div>
  )
}

/* ─── Main Page ─── */
export default function DoctorProfilePage() {
  const { id }          = useParams()
  const { apiFetch, user } = useAuth()
  const navigate        = useNavigate()
  const toast           = useToast()

  const [doctor,       setDoctor]      = useState(null)
  const [reviews,      setReviews]     = useState([])
  const [slots,        setSlots]       = useState([])
  const [selDay,       setSelDay]      = useState(0)
  const [selSlot,      setSelSlot]     = useState('')
  const [visitType,    setVisitType]   = useState('in-person')
  const [loading,      setLoading]     = useState(true)
  const [activeTab,    setActiveTab]   = useState('about')
  const [showReviewForm, setShowReviewForm] = useState(false)

  const loadDoctor = () =>
    apiFetch(`/doctors/${id}`)
      .then(d => { setDoctor(d.doctor); setReviews(d.reviews || []) })
      .catch(() => navigate('/404'))

  useEffect(() => { loadDoctor().finally(() => setLoading(false)) }, [id])

  useEffect(() => {
    if (!doctor) return
    const date = new Date(); date.setDate(date.getDate() + selDay)
    const iso  = date.toISOString().split('T')[0]
    apiFetch(`/doctors/${id}/availability?date=${iso}`)
      .then(d => setSlots(d.slots || []))
      .catch(() => setSlots([]))
    setSelSlot('')
  }, [doctor, selDay])

  const handleBook = () => {
    if (!user) { navigate('/login'); return }
    if (user.role !== 'patient') { toast('Only patients can book appointments', 'warn'); return }
    if (!selSlot) return
    const date = new Date(); date.setDate(date.getDate() + selDay)
    navigate(`/book/${id}?slot=${selSlot}&date=${date.toISOString().split('T')[0]}&type=${visitType}`)
  }

  if (loading) return (
    <div className={s.loadingWrap}><div className="spinner" /></div>
  )
  if (!doctor) return null

  const canReview    = user?.role === 'patient'
  const hasReviewed  = reviews.some(r => r.patient?._id === user?._id || r.patient?.toString() === user?._id)
  const avgRating    = reviews.length
    ? (reviews.reduce((a, r) => a + r.rating, 0) / reviews.length).toFixed(1)
    : doctor.rating?.toFixed(1) || '—'

  const TABS = ['about','experience','reviews']

  return (
    <div className="page">
      <Navbar />

      <div className={s.pageWrap}>
        <div className={s.layout}>

          {/* ════ LEFT ════ */}
          <div className={s.leftCol}>

            {/* ── Header card ── */}
            <div className={`card ${s.headerCard}`}>
              <div className={s.headerRow}>

                {/* Avatar */}
                <div className={s.avatarWrap}>
                  <DoctorAvatar doctor={doctor} />
                  {doctor.isVerified && (
                    <div className={s.verifiedBadge}>
                      <span className="icon icon-filled" style={{ fontSize: 14, color: '#fff' }}>verified</span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className={s.headerInfo}>
                  <div className={s.nameRow}>
                    <h1 className={s.doctorName}>{doctor.name}</h1>
                    {doctor.isVerified && (
                      <span className={s.verifiedTag}>
                        <span className="icon icon-filled" style={{ fontSize: 13 }}>verified</span>
                        Verified
                      </span>
                    )}
                  </div>
                  <p className={s.specialty}>{doctor.specialty}</p>
                  <div className={s.locationRow}>
                    <span className="icon" style={{ fontSize: 16 }}>apartment</span>
                    {doctor.location}
                  </div>
                  <div className={s.metaRow}>
                    <div className={s.ratingChip}>
                      <span className="icon icon-filled" style={{ color: '#f59e0b', fontSize: 16 }}>star</span>
                      <span className={s.ratingVal}>{avgRating}</span>
                      <span className={s.ratingCount}>({doctor.reviewCount || reviews.length} reviews)</span>
                    </div>
                    <div className={s.expChip}>
                      <span className="icon" style={{ fontSize: 15 }}>history</span>
                      {doctor.yearsExperience} yrs experience
                    </div>
                    {doctor.languages?.map(l => (
                      <span key={l} className={s.langTag}>{l}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* ── Tabs ── */}
            <div className={`card ${s.tabsCard}`}>
              <div className={s.tabsBar}>
                {TABS.map(tab => (
                  <button
                    key={tab}
                    className={`${s.tabBtn} ${activeTab === tab ? s.tabActive : ''}`}
                    onClick={() => setActiveTab(tab)}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>

              <div className={s.tabContent}>

                {/* ── ABOUT tab ── */}
                {activeTab === 'about' && (
                  <div className={s.tabPanel}>
                    <section className={s.section}>
                      <h3 className={s.sectionTitle}>Professional Bio</h3>
                      <p className={s.bioText}>
                        {doctor.bio || 'Experienced specialist committed to patient-centered care.'}
                      </p>
                    </section>

                    {doctor.specializations?.length > 0 && (
                      <section className={s.section}>
                        <h4 className={s.subTitle}>Specializations</h4>
                        <div className={s.tagRow}>
                          {doctor.specializations.map(sp => (
                            <span key={sp} className={s.specTag}>{sp}</span>
                          ))}
                        </div>
                      </section>
                    )}

                    {doctor.conditions?.length > 0 && (
                      <section className={s.section}>
                        <h4 className={s.subTitle}>Conditions Treated</h4>
                        <ul className={s.conditionsList}>
                          {doctor.conditions.map(c => (
                            <li key={c} className={s.conditionItem}>
                              <span className="icon icon-filled" style={{ color: '#006591', fontSize: 18 }}>check_circle</span>
                              {c}
                            </li>
                          ))}
                        </ul>
                      </section>
                    )}
                  </div>
                )}

                {/* ── EXPERIENCE tab ── */}
                {activeTab === 'experience' && (
                  <div className={s.tabPanel}>
                    <section className={s.section}>
                      <h3 className={s.sectionTitle}>Education &amp; Training</h3>
                      <div className={s.eduList}>
                        {(doctor.education || []).map((ed, i) => (
                          <div key={i} className={s.eduItem}>
                            <div className={s.eduIcon}>
                              <span className="icon" style={{ color: '#006591' }}>school</span>
                            </div>
                            <div>
                              <p className={s.eduDegree}>{ed.degree}</p>
                              <p className={s.eduInstitution}>{ed.institution}</p>
                              <p className={s.eduYear}>{ed.year}</p>
                            </div>
                          </div>
                        ))}
                        {(!doctor.education || doctor.education.length === 0) && (
                          <p className={s.emptyText}>No education info available.</p>
                        )}
                      </div>
                    </section>
                  </div>
                )}

                {/* ── REVIEWS tab ── */}
                {activeTab === 'reviews' && (
                  <div className={s.tabPanel}>
                    <div className={s.reviewsHeader}>
                      <div className={s.reviewsSummary}>
                        <span className={s.avgScore}>{avgRating}</span>
                        <div className={s.avgStars}>
                          {[1,2,3,4,5].map(n => (
                            <span key={n} className="icon icon-filled"
                              style={{ color: n <= Math.round(Number(avgRating)) ? '#f59e0b' : '#d1d5db', fontSize: 20 }}>
                              star
                            </span>
                          ))}
                        </div>
                      </div>
                      {canReview && !hasReviewed && (
                        <button
                          onClick={() => setShowReviewForm(v => !v)}
                          className="btn btn-secondary"
                          style={{ fontSize: 13, padding: '7px 14px' }}>
                          <span className="icon" style={{ fontSize: 16 }}>star</span>
                          {showReviewForm ? 'Cancel' : 'Write a Review'}
                        </button>
                      )}
                    </div>

                    {showReviewForm && (
                      <ReviewForm doctorId={id} onSubmitted={() => { setShowReviewForm(false); loadDoctor() }} />
                    )}

                    {reviews.length === 0 && !showReviewForm ? (
                      <div className={s.emptyReviews}>
                        <span className="icon" style={{ fontSize: 40 }}>rate_review</span>
                        <p>No reviews yet. Be the first!</p>
                      </div>
                    ) : reviews.map(r => (
                      <div key={r._id} className={s.reviewItem}>
                        <div className={s.reviewTop}>
                          <div className={s.reviewAvatar}>
                            {r.patient?.name?.[0] || 'P'}
                          </div>
                          <div className={s.reviewMeta}>
                            <span className={s.reviewPatient}>{r.patient?.name || 'Patient'}</span>
                            <span className={s.reviewDate}>
                              {new Date(r.createdAt).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                          </div>
                          <div className={s.reviewStars}>
                            {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
                          </div>
                        </div>
                        {r.comment && <p className={s.reviewComment}>{r.comment}</p>}
                      </div>
                    ))}
                  </div>
                )}

              </div>
            </div>
          </div>

          {/* ════ RIGHT: Booking Widget ════ */}
          <aside className={s.rightCol}>
            <div className={`card ${s.bookingCard}`}>

              {/* Header */}
              <div className={s.bookingHeader}>
                <h2 className={s.bookingTitle}>Book Appointment</h2>
                <div className={s.feeWrap}>
                  <p className={s.feeLabel}>Consultation Fee</p>
                  <p className={s.feeValue}>EGP {doctor.price}</p>
                </div>
              </div>

              <div className={s.bookingBody}>

                {/* Visit type toggle */}
                <div className={s.visitToggle}>
                  {[['in-person','person','In-Person'],['video','videocam','Video Call']].map(([t, icon, label]) => (
                    <button key={t}
                      onClick={() => setVisitType(t)}
                      className={`${s.visitBtn} ${visitType === t ? s.visitBtnActive : ''}`}>
                      <span className="icon" style={{ fontSize: 16 }}>{icon}</span>
                      {label}
                    </button>
                  ))}
                </div>

                {/* Day picker */}
                <div>
                  <p className={s.widgetLabel}>Select Date</p>
                  <div className={s.dayPicker}>
                    {DAYS.map((d, i) => {
                      const date = new Date(); date.setDate(date.getDate() + i)
                      return (
                        <button key={d}
                          onClick={() => setSelDay(i)}
                          className={`${s.dayBtn} ${selDay === i ? s.dayBtnActive : ''}`}>
                          <span className={s.dayName}>{d}</span>
                          <span className={s.dayNum}>{date.getDate()}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Time slots */}
                <div>
                  <p className={s.widgetLabel}>Select Time</p>
                  <div className={s.slotsGrid}>
                    {slots.length === 0 && (
                      <p className={s.noSlots}>No slots available</p>
                    )}
                    {slots.map(sl => (
                      <button key={sl.time}
                        disabled={!sl.available}
                        onClick={() => setSelSlot(sl.time)}
                        className={`${s.slotBtn}
                          ${selSlot === sl.time ? s.slotActive : ''}
                          ${!sl.available ? s.slotDisabled : ''}`}>
                        {sl.time}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Book button */}
                <button
                  onClick={handleBook}
                  disabled={!selSlot}
                  className={`btn btn-primary ${s.bookBtn}`}
                  style={{ opacity: selSlot ? 1 : 0.45, cursor: selSlot ? 'pointer' : 'not-allowed' }}>
                  {selSlot ? `Confirm Booking` : 'Select a time slot'}
                  {selSlot && <span className="icon" style={{ fontSize: 18 }}>arrow_forward</span>}
                </button>

                <div className={s.cancellationNote}>
                  <span className="icon" style={{ fontSize: 16 }}>info</span>
                  Free cancellation up to 24h before
                </div>

                {!user && (
                  <div className={s.loginPrompt}>
                    <p>
                      <Link to="/login" className={s.loginLink}>Sign in</Link> to book an appointment
                    </p>
                  </div>
                )}
              </div>
            </div>
          </aside>

        </div>
      </div>
    </div>
  )
}