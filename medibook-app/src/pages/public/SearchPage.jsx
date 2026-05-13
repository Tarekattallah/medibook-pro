import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import Navbar from '../../components/layout/Navbar'
import DoctorCard from '../../components/ui/DoctorCard'
import { useAuth } from '../../context/AuthContext'

const SPECS = ['Cardiology','Neurology','Dermatology','Orthopedics','Pediatrics','Psychiatry','Ophthalmology','Dentistry','Gynecology']
const LIMIT  = 6

export default function SearchPage() {
  const [params]          = useSearchParams()
  const { apiFetch }      = useAuth()
  const [doctors, setDoctors]   = useState([])
  const [total,   setTotal]     = useState(0)
  const [page,    setPage]      = useState(1)
  const [loading, setLoading]   = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [q,        setQ]        = useState(params.get('q')        || '')
  const [specialty, setSpec]    = useState(params.get('specialty') || '')
  const [maxPrice,  setPrice]   = useState(1000)
  const [minRating, setRating]  = useState(0)

  /* ---- fetch (page 1 = replace, page > 1 = append) ---- */
  const fetchDoctors = useCallback(async (newPage = 1, replace = true) => {
    if (replace) setLoading(true); else setLoadingMore(true)
    try {
      const qs = new URLSearchParams({ page: newPage, limit: LIMIT })
      if (q)                qs.set('q',        q)
      if (specialty)        qs.set('specialty', specialty)
      if (maxPrice < 1000)  qs.set('maxPrice',  maxPrice)
      if (minRating > 0)    qs.set('minRating', minRating)
      const data = await apiFetch(`/doctors/search?${qs}`)
      const list = data.doctors || []
      setTotal(data.total || 0)
      setDoctors(prev => replace ? list : [...prev, ...list])
      setPage(newPage)
    } catch { if (replace) setDoctors([]) }
    finally { setLoading(false); setLoadingMore(false) }
  }, [q, specialty, maxPrice, minRating])

  /* reset to page 1 when filters change */
  useEffect(() => { fetchDoctors(1, true) }, [specialty, minRating, maxPrice])

  const handleSearch = e => { e.preventDefault(); fetchDoctors(1, true) }
  const loadMore     = ()  => fetchDoctors(page + 1, false)

  const hasMore = doctors.length < total

  return (
    <div className="page">
      <Navbar/>

      {/* Search bar */}
      <div style={{background:'#fff',borderBottom:'1.5px solid #e2e8f0',padding:'14px 24px'}}>
        <form onSubmit={handleSearch} style={{maxWidth:720,margin:'0 auto',display:'flex',gap:8}}>
          <div style={{flex:1,display:'flex',alignItems:'center',gap:8,border:'1.5px solid #e2e8f0',borderRadius:10,padding:'0 14px',background:'#f8fafc'}}>
            <span className="icon" style={{color:'#94a3b8'}}>search</span>
            <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Doctor name or specialty..."
              style={{border:'none',outline:'none',flex:1,fontSize:14,background:'transparent',color:'#0b1c30'}}/>
            {q && <button type="button" onClick={()=>setQ('')} style={{background:'none',border:'none',cursor:'pointer',color:'#94a3b8',padding:0}}>
              <span className="icon" style={{fontSize:16}}>close</span>
            </button>}
          </div>
          <button type="submit" className="btn btn-primary" style={{borderRadius:10,padding:'0 20px'}}>Search</button>
        </form>
      </div>

      <div style={{maxWidth:1280,margin:'0 auto',padding:'24px',display:'flex',gap:24,alignItems:'flex-start'}}>

        {/* ---- Filters sidebar ---- */}
        <aside style={{width:240,flexShrink:0,background:'#fff',borderRadius:12,border:'1.5px solid #e2e8f0',padding:20,position:'sticky',top:80}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20}}>
            <span style={{fontWeight:700,fontSize:14,color:'#0b1c30'}}>Filters</span>
            <button onClick={() => { setSpec(''); setPrice(1000); setRating(0) }}
              style={{fontSize:12,color:'#0ea5e9',background:'none',border:'none',cursor:'pointer',fontWeight:600}}>Clear all</button>
          </div>

          {/* Specialty */}
          <div style={{marginBottom:22}}>
            <div style={{fontSize:11,fontWeight:700,color:'#64748b',textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:10}}>Specialty</div>
            {SPECS.map(s => (
              <label key={s} style={{display:'flex',alignItems:'center',gap:8,padding:'5px 0',cursor:'pointer'}}>
                <input type="radio" name="spec" checked={specialty===s} onChange={() => setSpec(specialty===s?'':s)} style={{accentColor:'#0ea5e9'}}/>
                <span style={{fontSize:13,color:specialty===s?'#0ea5e9':'#374151',fontWeight:specialty===s?600:400}}>{s}</span>
              </label>
            ))}
          </div>

          {/* Rating */}
          <div style={{marginBottom:22}}>
            <div style={{fontSize:11,fontWeight:700,color:'#64748b',textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:10}}>Min Rating</div>
            {[[0,'Any'],[4,'4.0+'],[4.5,'4.5+'],[4.8,'4.8+']].map(([v,l]) => (
              <label key={v} style={{display:'flex',alignItems:'center',gap:8,padding:'5px 0',cursor:'pointer'}}>
                <input type="radio" name="rating" checked={minRating===v} onChange={() => setRating(v)} style={{accentColor:'#0ea5e9'}}/>
                <span style={{fontSize:13,color:minRating===v?'#0ea5e9':'#374151',fontWeight:minRating===v?600:400}}>
                  {v > 0 && <span style={{color:'#f59e0b'}}>★ </span>}{l}
                </span>
              </label>
            ))}
          </div>

          {/* Price */}
          <div>
            <div style={{fontSize:11,fontWeight:700,color:'#64748b',textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:10}}>
              Max Price: <span style={{color:'#0b1c30',fontWeight:800}}>EGP {maxPrice === 1000 ? 'Any' : maxPrice}</span>
            </div>
            <input type="range" min={100} max={1000} step={50} value={maxPrice} onChange={e=>setPrice(+e.target.value)}
              style={{width:'100%',accentColor:'#0ea5e9'}}/>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:'#94a3b8',marginTop:4}}>
              <span>EGP 100</span><span>EGP 1000+</span>
            </div>
          </div>
        </aside>

        {/* ---- Results ---- */}
        <main style={{flex:1,minWidth:0}}>
          {/* Header */}
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20,flexWrap:'wrap',gap:10}}>
            <div>
              <h1 style={{fontSize:20,fontWeight:800,color:'#0b1c30'}}>
                {specialty || (q ? `Results for "${q}"` : 'All Doctors')}
              </h1>
              <p style={{fontSize:13,color:'#64748b',marginTop:2}}>
                {loading ? 'Searching...' : `${total} doctor${total !== 1 ? 's' : ''} found`}
              </p>
            </div>
            {/* Active filters */}
            <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
              {specialty && <span style={{display:'inline-flex',alignItems:'center',gap:6,background:'#eff6ff',color:'#2563eb',borderRadius:99,padding:'4px 12px',fontSize:12,fontWeight:600}}>
                {specialty} <button onClick={()=>setSpec('')} style={{background:'none',border:'none',cursor:'pointer',color:'#2563eb',padding:0,lineHeight:1}}>×</button>
              </span>}
              {minRating > 0 && <span style={{display:'inline-flex',alignItems:'center',gap:6,background:'#fffbeb',color:'#d97706',borderRadius:99,padding:'4px 12px',fontSize:12,fontWeight:600}}>
                ★ {minRating}+ <button onClick={()=>setRating(0)} style={{background:'none',border:'none',cursor:'pointer',color:'#d97706',padding:0,lineHeight:1}}>×</button>
              </span>}
            </div>
          </div>

          {/* Skeletons */}
          {loading ? (
            <div style={{display:'flex',flexDirection:'column',gap:16}}>
              {[1,2,3].map(i => (
                <div key={i} className="card" style={{padding:20,display:'flex',gap:16}}>
                  <div style={{width:64,height:64,borderRadius:'50%',background:'#f1f5f9',flexShrink:0,animation:'pulse 1.5s infinite'}}/>
                  <div style={{flex:1,display:'flex',flexDirection:'column',gap:10,paddingTop:6}}>
                    <div style={{height:14,background:'#f1f5f9',borderRadius:8,width:'38%'}}/>
                    <div style={{height:12,background:'#f1f5f9',borderRadius:8,width:'22%'}}/>
                    <div style={{height:12,background:'#f1f5f9',borderRadius:8,width:'55%'}}/>
                    <div style={{height:32,background:'#f1f5f9',borderRadius:8,width:'30%',marginTop:4}}/>
                  </div>
                </div>
              ))}
              <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}`}</style>
            </div>

          ) : doctors.length === 0 ? (
            <div style={{textAlign:'center',padding:'80px 24px'}}>
              <span className="icon" style={{fontSize:64,color:'#cbd5e1',display:'block',marginBottom:16}}>search_off</span>
              <h3 style={{fontSize:20,fontWeight:700,color:'#0b1c30',marginBottom:8}}>No doctors found</h3>
              <p style={{color:'#64748b',marginBottom:20}}>Try adjusting your filters or search terms</p>
              <button onClick={() => { setSpec(''); setPrice(1000); setRating(0); setQ('') }} className="btn btn-primary">
                Clear all filters
              </button>
            </div>

          ) : (
            <>
              <div style={{display:'flex',flexDirection:'column',gap:16}}>
                {doctors.map(d => <DoctorCard key={d._id} doctor={d}/>)}
              </div>

              {/* Pagination */}
              <div style={{marginTop:32,display:'flex',flexDirection:'column',alignItems:'center',gap:12}}>
                {/* Progress bar */}
                <div style={{width:'100%',maxWidth:400,background:'#f1f5f9',borderRadius:99,height:6,overflow:'hidden'}}>
                  <div style={{height:'100%',background:'linear-gradient(90deg,#0ea5e9,#006591)',borderRadius:99,width:`${Math.min((doctors.length/total)*100,100)}%`,transition:'width .4s'}}/>
                </div>
                <p style={{fontSize:13,color:'#64748b'}}>
                  Showing <strong style={{color:'#0b1c30'}}>{doctors.length}</strong> of <strong style={{color:'#0b1c30'}}>{total}</strong> doctors
                </p>

                {hasMore && (
                  <button onClick={loadMore} disabled={loadingMore} className="btn btn-secondary"
                    style={{minWidth:160,height:44,fontSize:14,marginTop:4}}>
                    {loadingMore
                      ? <><div className="spinner" style={{width:18,height:18,borderWidth:2}}/> Loading...</>
                      : <><span className="icon" style={{fontSize:18}}>expand_more</span> Load More</>
                    }
                  </button>
                )}

                {!hasMore && total > 0 && (
                  <p style={{fontSize:13,color:'#94a3b8',display:'flex',alignItems:'center',gap:6}}>
                    <span className="icon icon-filled" style={{fontSize:16,color:'#059669'}}>check_circle</span>
                    All {total} doctors loaded
                  </p>
                )}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  )
}
