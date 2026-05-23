import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useToast } from '../../components/ui/Toast'
import Navbar from '../../components/layout/Navbar'
import s from './ForgotPasswordPage.module.css'

/* ─── Simple email validator ───────────────────────────────────── */
const isValidEmail = (val) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val) && val.length <= 254

export default function ForgotPasswordPage() {
  const [email,    setEmail]    = useState('')
  const [sent,     setSent]     = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const controllerRef = useRef(null) // AbortController for fetch
  const toast = useToast()

  const handleChange = (e) => {
    const val = e.target.value
    setEmail(val)
    // Live validation after first blur — keep it simple: only validate on submit
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Basic validation
    if (!email.trim()) {
      setError('Email is required.')
      return
    }
    if (!isValidEmail(email.trim())) {
      setError('Please enter a valid email address.')
      return
    }
    setError('')

    setLoading(true)

    // Abort previous request if any
    if (controllerRef.current) controllerRef.current.abort()
    controllerRef.current = new AbortController()
    const { signal } = controllerRef.current

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
        signal,
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Something went wrong.')
      setSent(true)
    } catch (err) {
      if (err.name === 'AbortError') return // silently ignore abort
      toast(err.message || 'Something went wrong. Try again.', 'error')
    } finally {
      setLoading(false)
      controllerRef.current = null
    }
  }

  return (
    <>
      <Navbar />
      <div className={s.page}>
        <div className={s.container}>

          {/* Logo */}
          <Link to="/" className={s.logo}>
            <div className={s.logoIcon}>
              <span>M</span>
            </div>
            <span className={s.logoText}>MediBook Pro</span>
          </Link>

          <div className={s.card}>
            {!sent ? (
              <>
                <div className={`${s.iconCircle} ${s.iconCircleSmall}`}>
                  <span className="icon icon-filled">lock_reset</span>
                </div>
                <h1 className={s.heading}>Forgot your password?</h1>
                <p className={s.subText}>
                  Enter your email and we'll send you a link to reset your password.
                </p>
                <form onSubmit={handleSubmit} noValidate>
                  <div className="form-group">
                    <label className="label">Email Address</label>
                    <input
                      className="input"
                      type="email"
                      value={email}
                      onChange={handleChange}
                      placeholder="you@example.com"
                      required
                      maxLength={254}
                      disabled={loading}
                      aria-invalid={!!error}
                      aria-describedby={error ? 'email-error' : undefined}
                    />
                    {error && (
                      <span id="email-error" role="alert" style={{ fontSize: 12, color: '#ef4444', marginTop: 4, display: 'block' }}>
                        {error}
                      </span>
                    )}
                  </div>
                  <button
                    type="submit"
                    className={`btn btn-primary ${s.fullBtn}`}
                    disabled={loading || !email.trim()}
                    aria-busy={loading}
                  >
                    {loading ? (
                      <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />
                    ) : (
                      'Send Reset Link'
                    )}
                  </button>
                </form>
              </>
            ) : (
              <>
                <div className={`${s.iconCircle} ${s.iconCircleLarge}`}>
                  <span className="icon icon-filled">mark_email_read</span>
                </div>
                <h1 className={s.sentHeading}>Check your email</h1>
                <p className={s.sentText}>
                  If <strong>{email}</strong> is registered, you'll receive a reset link shortly.
                </p>
                <p className={s.spamNote}>
                  Didn't receive it? Check your spam folder.
                </p>
                <button onClick={() => setSent(false)} className={`btn btn-secondary ${s.tryAgainBtn}`}>
                  Try a different email
                </button>
              </>
            )}
            <div className={s.backLink}>
              <Link to="/login">
                <span className="icon" style={{ fontSize: 15 }}>arrow_back</span> Back to sign in
              </Link>
            </div>
          </div>

        </div>
      </div>
    </>
  )
}