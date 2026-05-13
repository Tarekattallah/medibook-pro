import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import Navbar from '../../components/layout/Navbar'

const SPECS = [
  {icon:'favorite',label:'Cardiology',color:'#fef2f2',ic:'#ef4444'},
  {icon:'neurology',label:'Neurology',color:'#faf5ff',ic:'#9333ea'},
  {icon:'dermatology',label:'Dermatology',color:'#fff7ed',ic:'#f97316'},
  {icon:'orthopedics',label:'Orthopedics',color:'#f0fdf4',ic:'#16a34a'},
  {icon:'pediatrics',label:'Pediatrics',color:'#eff6ff',ic:'#2563eb'},
  {icon:'psychology',label:'Psychiatry',color:'#fdf4ff',ic:'#c026d3'},
  {icon:'visibility',label:'Ophthalmology',color:'#ecfeff',ic:'#0891b2'},
  {icon:'dentistry',label:'Dentistry',color:'#f0fdf4',ic:'#059669'},
]

const STATS = [
  {value:'2,500+',label:'Verified Doctors'},
  {value:'50,000+',label:'Appointments Booked'},
  {value:'120+',label:'Cities'},
  {value:'4.9★',label:'Average Rating'},
]

const STEPS = [
  {icon:'search',title:'Search',desc:'Find verified specialists by name, specialty, or location.'},
  {icon:'calendar_month',title:'Book',desc:'Choose your preferred time slot and book instantly.'},
  {icon:'check_circle',title:'Visit',desc:'Get a confirmation and attend your appointment.'},
]

export default function LandingPage() {
  const [q, setQ] = useState('')
  const navigate = useNavigate()

  return (
    <div className="page">
      <Navbar/>

      {/* Hero */}
      <section style={{background:'linear-gradient(160deg,#f0f9ff 0%,#fff 55%)',padding:'80px 24px 100px',textAlign:'center'}}>
        <div style={{maxWidth:720,margin:'0 auto'}}>
          <div style={{display:'inline-flex',alignItems:'center',gap:8,background:'#e0f2fe',color:'#0284c7',borderRadius:99,padding:'6px 16px',fontSize:13,fontWeight:600,marginBottom:24}}>
            <span className="icon icon-filled" style={{fontSize:16}}>verified</span>
            Trusted by 50,000+ patients across Egypt
          </div>
          <h1 style={{fontSize:'clamp(36px,5vw,60px)',fontWeight:800,color:'#0b1c30',lineHeight:1.1,letterSpacing:'-0.03em',marginBottom:20}}>
            Find & Book the<br/>
            <span style={{color:'#0ea5e9'}}>Right Doctor</span>
          </h1>
          <p style={{fontSize:18,color:'#475569',marginBottom:40,lineHeight:1.6}}>
            Search from thousands of verified specialists. Book appointments online, instantly — no waiting, no hassle.
          </p>

          {/* Search */}
          <form onSubmit={e => { e.preventDefault(); navigate(`/search${q?`?q=${q}`:''}`) }}
            style={{display:'flex',gap:8,background:'#fff',borderRadius:14,padding:8,boxShadow:'0 4px 32px rgba(14,165,233,.15)',border:'1.5px solid #e0f2fe',maxWidth:600,margin:'0 auto'}}>
            <div style={{flex:1,display:'flex',alignItems:'center',gap:8,padding:'0 12px'}}>
              <span className="icon" style={{color:'#94a3b8',fontSize:20}}>search</span>
              <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Doctor name, specialty..."
                style={{border:'none',outline:'none',flex:1,fontSize:15,color:'#0b1c30',background:'transparent'}}/>
            </div>
            <button type="submit" className="btn btn-primary" style={{borderRadius:10,padding:'12px 24px',fontSize:15}}>
              Search
            </button>
          </form>
        </div>
      </section>

      {/* Stats */}
      <section style={{background:'#0ea5e9',padding:'40px 24px'}}>
        <div style={{maxWidth:900,margin:'0 auto',display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16,textAlign:'center'}}>
          {STATS.map(s => (
            <div key={s.label}>
              <div style={{fontSize:28,fontWeight:800,color:'#fff'}}>{s.value}</div>
              <div style={{fontSize:13,color:'rgba(255,255,255,.75)',marginTop:4}}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Specialties */}
      <section className="section" style={{background:'#fff'}}>
        <div style={{maxWidth:1100,margin:'0 auto'}}>
          <h2 style={{fontSize:32,fontWeight:800,color:'#0b1c30',textAlign:'center',marginBottom:8}}>Browse by Specialty</h2>
          <p style={{textAlign:'center',color:'#64748b',marginBottom:40}}>Find the right specialist for your health needs</p>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:16}}>
            {SPECS.map(s => (
              <button key={s.label} onClick={() => navigate(`/search?specialty=${s.label}`)}
                className="card" style={{padding:20,display:'flex',alignItems:'center',gap:14,cursor:'pointer',border:'1.5px solid #e2e8f0',background:'#fff',textAlign:'left',transition:'all .2s'}}
                onMouseEnter={e=>{e.currentTarget.style.borderColor='#0ea5e9';e.currentTarget.style.transform='translateY(-2px)'}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor='#e2e8f0';e.currentTarget.style.transform='translateY(0)'}}>
                <div style={{width:44,height:44,borderRadius:12,background:s.color,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                  <span className="icon icon-filled" style={{fontSize:22,color:s.ic}}>{s.icon}</span>
                </div>
                <div>
                  <div style={{fontWeight:700,fontSize:14,color:'#0b1c30'}}>{s.label}</div>
                  <div style={{fontSize:12,color:'#94a3b8',marginTop:2}}>Find specialists →</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="section" style={{background:'#f8fafc'}}>
        <div style={{maxWidth:800,margin:'0 auto',textAlign:'center'}}>
          <h2 style={{fontSize:32,fontWeight:800,color:'#0b1c30',marginBottom:8}}>How It Works</h2>
          <p style={{color:'#64748b',marginBottom:48}}>Book your appointment in 3 simple steps</p>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:32}}>
            {STEPS.map((s,i) => (
              <div key={s.title}>
                <div style={{width:56,height:56,borderRadius:'50%',background:'#e0f2fe',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px'}}>
                  <span className="icon icon-filled" style={{fontSize:26,color:'#0ea5e9'}}>{s.icon}</span>
                </div>
                <div style={{fontSize:12,fontWeight:700,color:'#0ea5e9',letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:8}}>Step {i+1}</div>
                <h3 style={{fontSize:18,fontWeight:700,color:'#0b1c30',marginBottom:8}}>{s.title}</h3>
                <p style={{fontSize:14,color:'#64748b',lineHeight:1.6}}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{background:'linear-gradient(135deg,#0ea5e9,#006591)',padding:'80px 24px',textAlign:'center'}}>
        <h2 style={{fontSize:36,fontWeight:800,color:'#fff',marginBottom:16}}>Ready to book your appointment?</h2>
        <p style={{color:'rgba(255,255,255,.8)',fontSize:16,marginBottom:32}}>Join thousands of patients who found their doctor on MediBook Pro</p>
        <div style={{display:'flex',gap:12,justifyContent:'center',flexWrap:'wrap'}}>
          <Link to="/register" className="btn" style={{background:'#fff',color:'#0ea5e9',fontWeight:700,padding:'14px 32px',fontSize:15}}>Create Free Account</Link>
          <Link to="/search" className="btn" style={{background:'rgba(255,255,255,.15)',color:'#fff',border:'2px solid rgba(255,255,255,.3)',padding:'14px 32px',fontSize:15}}>Browse Doctors</Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{background:'#0b1c30',color:'rgba(255,255,255,.5)',padding:'40px 24px',textAlign:'center'}}>
        <div style={{color:'#fff',fontWeight:700,fontSize:16,marginBottom:8}}>MediBook Pro</div>
        <p style={{fontSize:13}}>© 2024 MediBook Pro. All rights reserved.</p>
      </footer>
    </div>
  )
}
