import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import s from './Navbar.module.css'

/** تعقيم النص لمنع XSS */
const sanitize = (input = '') => {
  return String(input)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}

export default function Navbar() {
  const { user, logout, unreadCount } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const menuRef = useRef(null)

  useEffect(() => {
    const handle = e => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/')
    setMenuOpen(false)
  }

  const dashLink =
    user?.role === 'admin' ? '/admin'
    : user?.role === 'doctor' ? '/doctor/dashboard'
    : '/patient/dashboard'

  const isActive = path => location.pathname === path

  const handleSearch = (e) => {
    e.preventDefault()
    const sanitizedQuery = searchQuery.trim()
    if (sanitizedQuery) {
      navigate(`/search?q=${encodeURIComponent(sanitizedQuery)}`)
      setSearchQuery('')
    }
  }

  const publicLinks = [['/search', 'Find Doctors']]
  const patientLinks = [
    ['/patient/appointments', 'My Appointments'],
    ['/patient/records', 'Patient Records'],
    ['/notifications', 'Messages'],
    ['/patient/emergency-requests', 'emergency', 'Emergency Requests'],
  ]
  const doctorLinks = [
    ['/doctor/schedule', 'My Schedule'],
    ['/notifications', 'Messages'],
  ]

  const navLinks = !user
    ? publicLinks
    : user.role === 'patient'
      ? [...publicLinks, ...patientLinks]
      : user.role === 'doctor'
        ? [...publicLinks, ...doctorLinks]
        : publicLinks

  const firstName = user?.name?.split(' ')[0] || ''
  const safeFirstName = sanitize(firstName)
  const safeFullName = sanitize(user?.name || '')
  const safeEmail = sanitize(user?.email || '')
  const safeRole = sanitize(user?.role || '')

  return (
    <>
      <header className={s.header}>
        <div className={s.inner}>
          {/* Logo */}
          <Link to="/" className={s.logoLink}>
            <div className={s.logoIcon}>
              <span>M</span>
            </div>
            <span className={s.logoText}>
              MediBook <span className={s.logoAccent}>Pro</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className={`${s.desktopNav} hide-mobile`}>
            {navLinks.map(([href, label]) => (
              <Link
                key={href}
                to={href}
                className={`${s.navLink} ${isActive(href) ? s.navLinkActive : ''}`}
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Right Section */}
          <div className={s.rightSection}>
            {/* Search */}
            <form onSubmit={handleSearch} className={`${s.searchForm} hide-mobile`}>
              <span className={`icon ${s.searchIcon}`}>search</span>
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search doctors..."
                className={s.searchInput}
                onFocus={e => (e.target.style.borderColor = '#0ea5e9')}
                onBlur={e => (e.target.style.borderColor = '#e2e8f0')}
              />
            </form>

            {user ? (
              <>
                {/* Notifications */}
                <Link to="/notifications" className={s.iconBtn}>
                  <span className="icon">notifications</span>
                  {unreadCount > 0 && <span className={s.notificationBadge} />}
                </Link>

                {/* Settings */}
                <Link to="/settings" className={s.iconBtn}>
                  <span className="icon">settings</span>
                </Link>

                {/* User Menu */}
                <div ref={menuRef} className={s.userMenuWrapper}>
                  <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className={s.userMenuButton}
                  >
                    <div className={s.userAvatar}>
                      {safeFirstName.charAt(0) || 'U'}
                    </div>
                    <span className={s.userName}>
                      {safeFirstName}
                    </span>
                    <span className={`icon ${s.chevron} ${menuOpen ? s.chevronOpen : ''}`}>
                      expand_more
                    </span>
                  </button>

                  {menuOpen && (
                    <div className={s.dropdown}>
                      <div className={s.dropdownHeader}>
                        <div className={s.dropdownName}>{safeFullName}</div>
                        <div className={s.dropdownEmail}>{safeEmail}</div>
                        <div className={s.dropdownRole}>{safeRole}</div>
                      </div>
                      {[
                        [dashLink, 'dashboard', 'Dashboard'],
                        ['/notifications', 'notifications', 'Notifications', unreadCount > 0 ? unreadCount : null],
                        ['/settings', 'manage_accounts', 'Account Settings'],
                        ...(user.role === 'patient' ? [
                          ['/patient/appointments', 'calendar_month', 'My Appointments'],
                          ['/patient/records', 'folder_open', 'Medical Records'],
                        ] : []),
                        ...(user.role === 'doctor' ? [
                          ['/doctor/schedule', 'schedule', 'My Schedule'],
                          ['/doctor/edit-profile', 'edit', 'Edit Profile'],
                        ] : []),
                      ].map(([href, icon, label, badge]) => (
                        <Link
                          key={href + label}
                          to={href}
                          onClick={() => setMenuOpen(false)}
                          className={s.dropdownLink}
                        >
                          <span className={`icon ${s.dropdownIcon}`}>{icon}</span>
                          <span className={s.dropdownLabel}>{label}</span>
                          {badge && <span className={s.dropdownBadge}>{badge}</span>}
                        </Link>
                      ))}
                      <button onClick={handleLogout} className={s.logoutButton}>
                        <span className="icon" style={{ fontSize: 18 }}>logout</span>
                        Sign out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className={`btn btn-ghost ${s.authBtn}`}>Sign In</Link>
                <Link to="/register" className={`btn btn-primary ${s.authBtn}`}>Get Started</Link>
              </>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className={s.mobileMenuBtn}
            >
              <span className="icon">{mobileOpen ? 'close' : 'menu'}</span>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className={s.mobileMenu}>
            {navLinks.map(([href, label]) => (
              <Link
                key={href}
                to={href}
                onClick={() => setMobileOpen(false)}
                className={s.mobileLink}
              >
                {label}
              </Link>
            ))}
            {!user ? (
              <>
                <Link to="/login" onClick={() => setMobileOpen(false)} className={s.mobileAuthLink}>Sign In</Link>
                <Link to="/register" onClick={() => setMobileOpen(false)} className={`${s.mobileAuthLink} ${s.mobileAuthBtn}`}>Get Started</Link>
              </>
            ) : (
              <>
                <Link to={dashLink} onClick={() => setMobileOpen(false)} className={s.mobileDashboardLink}>Dashboard</Link>
                <button onClick={handleLogout} className={s.mobileLogoutBtn}>Sign out</button>
              </>
            )}
          </div>
        )}
      </header>
    </>
  )
}