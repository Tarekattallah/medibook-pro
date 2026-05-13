import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import Navbar from '../../components/layout/Navbar'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../components/ui/Toast'

const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat']

function ReviewForm({ doctorId, onSubmitted }) {
  const { apiFetch, user } = useAuth()
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
        method:'POST',
        body: JSON.stringify({ rating, comment })
      })
      toast('Review submitted — thank you!')
      setRating(0); setComment('')
      onSubmitted()
    } catch (err) { toast(err.message, 'error') }
    finally { setSaving(false) }
  }

  return (
    <form onSubmit={submit} style={{background:'#f8fafc',border:'1.5px solid #e2e8f0',borderRadius:12,padding:20,marginTop:20}}>
      <h3 style={{fontSize:15,fontWeight:700,color:'#0b1c30',marginBottom:14}}>Write a Review</h3>
      {/* Star picker */}
      <div style={{display:'flex',gap:4,marginBottom:14}}>
        {[1,2,3,4,5].map(s => (
          <button key={s} type="button"
            onMouseEnter={() => setHover(s)} onMouseLeave={() => setHover(0)}
            onClick={() => setRating(s)}
            style={{background:'none',border:'none',cursor:'pointer',fontSize:28,color:(hover||rating)>=s?'#f59e0b':'#d1d5db',padding:'0 2px',lineHeight:1,transition:'color .1s'}}>
            ★
          </button>
        ))}
        {rating > 0 && <span style={{fontSize:13,color:'#64748b',marginLeft:8,alignSelf:'center'}}>
          {['','Poor','Fair','Good','Very Good','Excellent'][rating]}
        </span>}
      </div>
      <textarea value={comment} onChange={e=>setComment(e.target.value)}
        placeholder="Share your experience with this doctor (optional)..."
        style={{width:'100%',height:88,padding:'10px 14px',border:'1.5px solid #e2e8f0',borderRadius:8,fontSize:14,fontFamily:'Inter,sans-serif',resize:'vertical',outline:'none',background:'#fff'}}/>
      <div style={{display:'flex',justifyContent:'flex-end',marginTop:10}}>
        <button type="submit" className="btn btn-primary" style={{fontSize:13,padding:'8px 20px'}} disabled={saving}>
          {saving ? <div className="spinner" style={{width:16,height:16,borderWidth:2}}/> : 'Submit Review'}
        </button>
      </div>
    </form>
  )
}

export default function DoctorProfilePage() {
  const { id } = useParams()
  const { apiFetch, user } = useAuth()
  const navigate  = useNavigate()
  const toast     = useToast()
  const [doctor,  setDoctor]   = useState(null)
  const [reviews, setReviews]  = useState([])
  const [slots,   setSlots]    = useState([])
  const [selDay,  setSelDay]   = useState(0)
  const [selSlot, setSelSlot]  = useState('')
  const [visitType,setVisitType]= useState('in-person')
  const [loading, setLoading]  = useState(true)
  const [showReviewForm, setShowReviewForm] = useState(false)

  const loadDoctor = () =>
    apiFetch(`/doctors/${id}`)
      .then(d => { setDoctor(d.doctor); setReviews(d.reviews||[]) })
      .catch(() => navigate('/404'))

  useEffect(() => { loadDoctor().finally(() => setLoading(false)) }, [id])

  useEffect(() => {
    if (!doctor) return
    const date = new Date(); date.setDate(date.getDate() + selDay)
    const iso  = date.toISOString().split('T')[0]
    apiFetch(`/doctors/${id}/availability?date=${iso}`)
      .then(d => setSlots(d.slots||[]))
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

  if (loading) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh'}}><div className="spinner"/></div>
  if (!doctor) return null

  const initials = doctor.name?.split(' ').filter((_,i)=>i>0).map(w=>w[0]).slice(0,2).join('') || 'DR'
  const canReview = user?.role === 'patient'
  const hasReviewed = reviews.some(r => r.patient?._id === user?._id || r.patient?.toString() === user?._id)

  return (
    <div className="page">
      <Navbar/>
      <div style={{maxWidth:1100,margin:'0 auto',padding:'32px 24px'}}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 340px',gap:28,alignItems:'flex-start'}}>

          {/* ---- Left ---- */}
          <div style={{display:'flex',flexDirection:'column',gap:20}}>

            {/* Header card */}
            <div className="card" style={{padding:28}}>
              <div style={{display:'flex',gap:20,alignItems:'flex-start'}}>
                <div style={{width:88,height:88,borderRadius:'50%',background:'linear-gradient(135deg,#bae6fd,#0ea5e9)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:28,fontWeight:800,color:'#fff',flexShrink:0}}>
                  {initials}
                </div>
                <div style={{flex:1}}>
                  <div style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap'}}>
                    <h1 style={{fontSize:24,fontWeight:800,color:'#0b1c30',letterSpacing:'-0.02em'}}>{doctor.name}</h1>
                    {doctor.isVerified && <span className="badge badge-verified"><span className="icon icon-filled" style={{fontSize:14}}>verified</span> Verified</span>}
                  </div>
                  <div style={{fontSize:16,color:'#0ea5e9',fontWeight:600,marginTop:4}}>{doctor.specialty}</div>
                  <div style={{display:'flex',alignItems:'center',gap:6,marginTop:6,color:'#64748b',fontSize:14}}>
                    <span className="icon" style={{fontSize:16}}>location_on</span>{doctor.location}
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:20,marginTop:14,flexWrap:'wrap'}}>
                    <div style={{display:'flex',alignItems:'center',gap:4}}>
                      <span className="stars">{'★'.repeat(Math.round(doctor.rating||0))}</span>
                      <span style={{fontWeight:700,fontSize:14}}>{doctor.rating?.toFixed(1)||'—'}</span>
                      <span style={{color:'#94a3b8',fontSize:13}}>({doctor.reviewCount} reviews)</span>
                    </div>
                    <div style={{display:'flex',alignItems:'center',gap:4,fontSize:13,color:'#64748b'}}>
                      <span className="icon" style={{fontSize:15}}>work</span>{doctor.yearsExperience} yrs exp
                    </div>
                    {doctor.languages?.map(l => <span key={l} className="tag" style={{fontSize:12}}>{l}</span>)}
                  </div>
                </div>
              </div>
            </div>

            {/* About */}
            <div className="card" style={{padding:24}}>
              <h2 style={{fontSize:18,fontWeight:700,color:'#0b1c30',marginBottom:12}}>About</h2>
              <p style={{fontSize:14,color:'#475569',lineHeight:1.8}}>{doctor.bio||'Experienced specialist committed to patient-centered care.'}</p>
            </div>

            {/* Reviews */}
            <div className="card" style={{padding:24}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:18,flexWrap:'wrap',gap:10}}>
                <h2 style={{fontSize:18,fontWeight:700,color:'#0b1c30'}}>
                  Patient Reviews <span style={{fontSize:14,color:'#94a3b8',fontWeight:400}}>({reviews.length})</span>
                </h2>
                {canReview && !hasReviewed && (
                  <button onClick={() => setShowReviewForm(v=>!v)} className="btn btn-secondary" style={{fontSize:13,padding:'7px 14px'}}>
                    <span className="icon" style={{fontSize:16}}>star</span>
                    {showReviewForm ? 'Cancel' : 'Write a Review'}
                  </button>
                )}
              </div>

              {/* Review form */}
              {showReviewForm && (
                <ReviewForm doctorId={id} onSubmitted={() => { setShowReviewForm(false); loadDoctor() }}/>
              )}

              {reviews.length === 0 && !showReviewForm ? (
                <div style={{textAlign:'center',padding:'24px 0',color:'#94a3b8'}}>
                  <span className="icon" style={{fontSize:40,display:'block',marginBottom:8}}>rate_review</span>
                  <p style={{fontSize:14}}>No reviews yet. Be the first!</p>
                </div>
              ) : reviews.map(r => (
                <div key={r._id} style={{paddingBottom:16,marginBottom:16,borderBottom:'1px solid #f1f5f9'}}>
                  <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:8}}>
                    <div style={{width:34,height:34,borderRadius:'50%',background:'#e0f2fe',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:13,color:'#0284c7'}}>
                      {r.patient?.name?.[0]||'P'}
                    </div>
                    <div>
                      <div style={{fontSize:13,fontWeight:600,color:'#0b1c30'}}>{r.patient?.name||'Patient'}</div>
                      <div className="stars" style={{fontSize:13}}>{'★'.repeat(r.rating)}{'☆'.repeat(5-r.rating)}</div>
                    </div>
                    <span style={{fontSize:11,color:'#94a3b8',marginLeft:'auto'}}>
                      {new Date(r.createdAt).toLocaleDateString('en',{month:'short',day:'numeric',year:'numeric'})}
                    </span>
                  </div>
                  {r.comment && <p style={{fontSize:13,color:'#475569',lineHeight:1.6,paddingLeft:44}}>{r.comment}</p>}
                </div>
              ))}
            </div>
          </div>

          {/* ---- Right: Booking widget ---- */}
          <div style={{position:'sticky',top:80}}>
            <div className="card" style={{padding:24}}>
              <div style={{display:'flex',alignItems:'baseline',gap:4,marginBottom:20}}>
                <span style={{fontSize:28,fontWeight:800,color:'#0b1c30'}}>EGP {doctor.price}</span>
                <span style={{fontSize:13,color:'#94a3b8'}}>/session</span>
              </div>

              {/* Visit type */}
              <div style={{display:'flex',borderRadius:10,overflow:'hidden',border:'1.5px solid #e2e8f0',marginBottom:20}}>
                {[['in-person','local_hospital','In-Person'],['video','videocam','Video Call']].map(([t,icon,label])=>(
                  <button key={t} onClick={() => setVisitType(t)}
                    style={{flex:1,padding:'10px 8px',display:'flex',alignItems:'center',justifyContent:'center',gap:6,fontSize:13,fontWeight:600,cursor:'pointer',border:'none',background:visitType===t?'#0ea5e9':'#fff',color:visitType===t?'#fff':'#64748b',transition:'all .15s'}}>
                    <span className="icon" style={{fontSize:16}}>{icon}</span>{label}
                  </button>
                ))}
              </div>

              {/* Day picker */}
              <div style={{marginBottom:16}}>
                <div style={{fontSize:11,fontWeight:700,color:'#64748b',textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:10}}>Select Date</div>
                <div style={{display:'flex',gap:6,overflowX:'auto',paddingBottom:4}}>
                  {DAYS.map((d,i) => {
                    const date=new Date(); date.setDate(date.getDate()+i)
                    return (
                      <button key={d} onClick={() => setSelDay(i)}
                        style={{flexShrink:0,padding:'8px 10px',borderRadius:8,border:`1.5px solid ${selDay===i?'#0ea5e9':'#e2e8f0'}`,background:selDay===i?'#f0f9ff':'#fff',cursor:'pointer',textAlign:'center',transition:'all .15s',minWidth:48}}>
                        <div style={{fontSize:10,color:selDay===i?'#0ea5e9':'#94a3b8',fontWeight:700}}>{d}</div>
                        <div style={{fontSize:14,fontWeight:700,color:selDay===i?'#0ea5e9':'#374151',marginTop:1}}>{date.getDate()}</div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Slots */}
              <div style={{marginBottom:20}}>
                <div style={{fontSize:11,fontWeight:700,color:'#64748b',textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:10}}>Available Times</div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:6}}>
                  {slots.length === 0 && <p style={{gridColumn:'1/-1',textAlign:'center',fontSize:13,color:'#94a3b8',padding:'12px 0'}}>No slots available</p>}
                  {slots.map(s => (
                    <button key={s.time} disabled={!s.available} onClick={() => setSelSlot(s.time)}
                      style={{padding:'8px 4px',borderRadius:8,border:`1.5px solid ${selSlot===s.time?'#0ea5e9':s.available?'#e2e8f0':'#f1f5f9'}`,background:selSlot===s.time?'#0ea5e9':s.available?'#fff':'#f8fafc',color:selSlot===s.time?'#fff':s.available?'#374151':'#cbd5e1',fontSize:12,fontFamily:'JetBrains Mono,monospace',fontWeight:600,cursor:s.available?'pointer':'not-allowed',transition:'all .15s'}}>
                      {s.time}
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={handleBook} disabled={!selSlot} className="btn btn-primary"
                style={{width:'100%',height:46,fontSize:15,opacity:selSlot?1:.45,cursor:selSlot?'pointer':'not-allowed'}}>
                {selSlot ? `Book at ${selSlot}` : 'Select a time slot'}
              </button>
              <p style={{fontSize:12,color:'#94a3b8',textAlign:'center',marginTop:10}}>Free cancellation up to 24h before</p>

              {!user && (
                <div style={{marginTop:12,padding:12,background:'#f0f9ff',borderRadius:8,textAlign:'center'}}>
                  <p style={{fontSize:13,color:'#0284c7'}}>
                    <Link to="/login" style={{fontWeight:700,color:'#0ea5e9',textDecoration:'none'}}>Sign in</Link> to book an appointment
                  </p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
