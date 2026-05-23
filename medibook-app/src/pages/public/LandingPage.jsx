import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import Navbar from '../../components/layout/Navbar'
import s from './LandingPage.module.css'

const SPECS = [
  { icon: 'favorite',    label: 'Cardiology',    color: '#fef2f2', ic: '#ef4444' },
  { icon: 'neurology',   label: 'Neurology',     color: '#faf5ff', ic: '#9333ea' },
  { icon: 'dermatology', label: 'Dermatology',   color: '#fff7ed', ic: '#f97316' },
  { icon: 'orthopedics', label: 'Orthopedics',   color: '#f0fdf4', ic: '#16a34a' },
  { icon: 'pediatrics',  label: 'Pediatrics',    color: '#eff6ff', ic: '#2563eb' },
  { icon: 'psychology',  label: 'Psychiatry',    color: '#fdf4ff', ic: '#c026d3' },
  { icon: 'visibility',  label: 'Ophthalmology', color: '#ecfeff', ic: '#0891b2' },
  { icon: 'dentistry',   label: 'Dentistry',     color: '#f0fdf4', ic: '#059669' },
]

const STATS = [
  { value: '2,500+',  label: 'Verified Doctors'   },
  { value: '50,000+', label: 'Appointments Booked' },
  { value: '120+',    label: 'Cities'              },
  { value: '4.9★',   label: 'Average Rating'      },
]

const STEPS = [
  { icon: 'search',         title: 'Search', desc: 'Find verified specialists by name, specialty, or location.'  },
  { icon: 'calendar_month', title: 'Book',   desc: 'Choose your preferred time slot and book instantly.'         },
  { icon: 'check_circle',   title: 'Visit',  desc: 'Get a confirmation and attend your appointment.'             },
]

export default function LandingPage() {
  const [q, setQ] = useState('')
  const navigate  = useNavigate()

  const handleSearch = e => {
    e.preventDefault()
    navigate(`/search${q ? `?q=${encodeURIComponent(q)}` : ''}`)
  }

  return (
    <div className="page">
      <Navbar />

      {/* ── HERO ── */}
      <section className={s.hero}>
        <div className={s.heroInner}>

          {/* Left */}
          <div className={s.heroLeft}>
            <div className={s.heroBadge}>
              <span className="icon icon-filled">verified</span>
              Trusted by 50,000+ patients across Egypt
            </div>

            <h1 className={s.heroTitle}>
              Find &amp; Book the<br />
              <span className={s.heroAccent}>Right Doctor</span>
            </h1>

            <p className={s.heroSubtitle}>
              Search from thousands of verified specialists. Book appointments
              online, instantly — no waiting, no hassle.
            </p>

            <form className={s.searchBar} onSubmit={handleSearch}>
              <div className={s.searchField}>
                <span className="icon">search</span>
                <input
                  value={q}
                  onChange={e => setQ(e.target.value)}
                  placeholder="Doctor name, specialty..."
                  className={s.searchInput}
                />
              </div>
              <button type="submit" className={`btn btn-primary ${s.searchBtn}`}>
                Search
              </button>
            </form>
          </div>

          {/* Right — Hero Image */}
          <div className={s.heroRight}>
            <div className={s.imgWrap}>
              <img
                src="https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=920&q=80&auto=format&fit=crop"
                alt="Doctor consulting patient"
                className={s.heroImg}
                loading="eager"
              />

              {/* Floating badge — top left */}
              <div className={`${s.floatCard} ${s.floatTop}`}>
                <div className={s.floatIcon}>
                  <span className="icon icon-filled" style={{ color: '#059669' }}>check_circle</span>
                </div>
                <div>
                  <p className={s.floatName}>Dr. Sarah Ahmed</p>
                  <p className={s.floatStatus}>Confirmed</p>
                </div>
              </div>

              {/* Floating badge — bottom right */}
              <div className={`${s.floatCard} ${s.floatBottom}`}>
                <div className={s.floatStars}>
                  <span className="icon icon-filled" style={{ color: '#f59e0b', fontSize: 14 }}>star</span>
                  <span className={s.floatRating}>4.9</span>
                  <span className={s.floatReviews}>(250 reviews)</span>
                </div>
                <p className={s.floatAvail}>Next available: Today</p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── STATS ── */}
      <section className={s.stats}>
        <div className={s.statsInner}>
          {STATS.map(st => (
            <div key={st.label} className={s.statItem}>
              <div className={s.statValue}>{st.value}</div>
              <div className={s.statLabel}>{st.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── SPECIALTIES ── */}
      <section className={`section ${s.specialties}`}>
        <div className={s.sectionInner}>
          <h2 className={s.sectionTitle}>Browse by Specialty</h2>
          <p className={s.sectionSub}>Find the right specialist for your health needs</p>
          <div className={s.specGrid}>
            {SPECS.map(sp => (
              <button
                key={sp.label}
                className={`card ${s.specCard}`}
                onClick={() => navigate(`/search?specialty=${sp.label}`)}
              >
                <div className={s.specIcon} style={{ background: sp.color }}>
                  <span className="icon icon-filled" style={{ color: sp.ic }}>{sp.icon}</span>
                </div>
                <div className={s.specText}>
                  <div className={s.specName}>{sp.label}</div>
                  <div className={s.specLink}>Find specialists →</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className={`section ${s.howItWorks}`}>
        <div className={s.howInner}>
          <h2 className={s.sectionTitle}>How It Works</h2>
          <p className={s.sectionSub}>Book your appointment in 3 simple steps</p>
          <div className={s.stepsGrid}>
            {STEPS.map((st, i) => (
              <div key={st.title} className={s.stepItem}>
                <div className={s.stepIconWrap}>
                  <span className="icon icon-filled">{st.icon}</span>
                </div>
                <div className={s.stepNum}>Step {i + 1}</div>
                <h3 className={s.stepTitle}>{st.title}</h3>
                <p className={s.stepDesc}>{st.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className={s.cta}>
        <h2 className={s.ctaTitle}>Ready to book your appointment?</h2>
        <p className={s.ctaSub}>Join thousands of patients who found their doctor on MediBook Pro</p>
        <div className={s.ctaButtons}>
          <Link to="/register" className={`btn ${s.ctaBtnPrimary}`}>Create Free Account</Link>
          <Link to="/search"   className={`btn ${s.ctaBtnOutline}`}>Browse Doctors</Link>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className={s.footer}>
        <div className={s.footerBrand}>MediBook Pro</div>
        <p className={s.footerCopy}>© 2024 MediBook Pro. All rights reserved.</p>
      </footer>
    </div>
  )
}