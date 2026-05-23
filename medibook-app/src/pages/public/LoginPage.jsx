import { useState, useId } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../components/ui/Toast'
import Navbar from '../../components/layout/Navbar'
import s from './LoginPage.module.css'

const dashboardFor = (role) => {
  if (role === 'admin')  return '/admin'
  if (role === 'doctor') return '/doctor/dashboard'
  return '/patient/dashboard'
}

export default function LoginPage() {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [errors,   setErrors]   = useState({})
  const [showPassword, setShowPassword] = useState(false) // ← للإظهار/الإخفاء

  const { login } = useAuth()
  const toast      = useToast()
  const navigate   = useNavigate()

  const emailId    = useId()
  const passwordId = useId()

  const validate = () => {
    const errs = {}
    if (!email.trim())                        errs.email    = 'Email is required.'
    else if (!/\S+@\S+\.\S+/.test(email))    errs.email    = 'Enter a valid email.'
    if (!password)                            errs.password = 'Password is required.'
    else if (password.length < 8)            errs.password = 'Password must be at least 8 characters.'
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})

    setLoading(true)
    try {
      const user = await login(email, password)
      toast(`Welcome back, ${user.name}!`, 'success')
      navigate(dashboardFor(user.role), { replace: true })
    } catch (err) {
      toast(err.message || 'Login failed. Please try again.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Navbar />
      <div className={s.page}>

        {/* القسم الأيسر: صورة طبية + طبقة زجاجية */}
        <div className={s.leftPanel}>
          <img
            className={s.bgImage}
            src="https://img.magnific.com/free-vector/cartoon-doctors-nurses-collection-illustration_23-2148920402.jpg?semt=ais_hybrid&w=740&q=80"
            alt="Doctor consulting"
          />
          <div className={s.glassOverlay}>
            <Link to="/" className={s.brandLink}>
              <div className={s.brandIcon}>
                <span>M</span>
              </div>
              <span className={s.brandName}>MediBook Pro</span>
            </Link>
            <h1 className={s.heroTitle}>
              Your health,<br />our priority.
            </h1>
            <p className={s.heroSub}>
              Book appointments with verified doctors in minutes. Manage your health records,
              appointments, and more.
            </p>
            <div className={s.featureList}>
              {[
                ['verified',        'Verified doctors only'],
                ['bolt',            'Instant booking'],
                ['event_available', 'Free cancellation'],
              ].map(([icon, text]) => (
                <div key={text} className={s.featureItem}>
                  <div className={s.featureIcon}>
                    <span className="icon icon-filled">{icon}</span>
                  </div>
                  <span className={s.featureText}>{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* القسم الأيمن: النموذج */}
        <div className={s.rightPanel}>
          <div className={s.formWrapper}>
            <h2 className={s.formTitle}>Sign in</h2>
            <p className={s.formSub}>
              Don't have an account?{' '}
              <Link to="/register" className={s.signupLink}>
                Sign up free
              </Link>
            </p>

            <form onSubmit={handleSubmit} noValidate aria-label="Sign in form">

              {/* Email */}
              <div className={s.formGroup}>
                <label className={s.label} htmlFor={emailId}>Email Address</label>
                <div className={s.inputWrapper}>
                  <span className={`icon ${s.inputIcon}`}>mail</span>
                  <input
                    id={emailId}
                    className={s.inputField}
                    type="email"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setErrors(prev => ({ ...prev, email: undefined })) }}
                    placeholder="you@example.com"
                    autoComplete="username email"
                    required
                    maxLength={100}
                    disabled={loading}
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? `${emailId}-err` : undefined}
                  />
                </div>
                {errors.email && (
                  <span id={`${emailId}-err`} role="alert" className={s.errorText}>
                    ⚠ {errors.email}
                  </span>
                )}
              </div>

              {/* Password */}
              <div className={s.formGroup}>
                <label className={s.label} htmlFor={passwordId}>Password</label>
                <div className={s.inputWrapper}>
                  <span className={`icon ${s.inputIcon}`}>lock</span>
                  <input
                    id={passwordId}
                    className={s.inputField}
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => { setPassword(e.target.value); setErrors(prev => ({ ...prev, password: undefined })) }}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    required
                    maxLength={128}
                    disabled={loading}
                    aria-invalid={!!errors.password}
                    aria-describedby={errors.password ? `${passwordId}-err` : undefined}
                  />
                  <button
                    type="button"
                    className={s.passwordToggle}
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    <span className="icon" style={{ fontSize: 20 }}>
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
                {errors.password && (
                  <span id={`${passwordId}-err`} role="alert" className={s.errorText}>
                    ⚠ {errors.password}
                  </span>
                )}
              </div>

              {/* Options */}
              <div className={s.optionsRow}>
                <Link
                  to="/forgot-password"
                  className={`${s.forgotLink} ${loading ? s.forgotLinkDisabled : ''}`}
                  tabIndex={loading ? -1 : 0}
                  aria-disabled={loading}
                >
                  Forgot password?
                </Link>
              </div>

              {/* Submit */}
              <button
                type="submit"
                className={s.submitBtn}
                disabled={loading}
                aria-busy={loading}
              >
                {loading ? (
                  <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} aria-label="Signing in…" />
                ) : (
                  'Sign In'
                )}
              </button>

            </form>
          </div>
        </div>
      </div>
    </>
  )
}