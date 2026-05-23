import { useState, useCallback, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../components/ui/Toast'
import Navbar from '../../components/layout/Navbar'
import cls from './RegisterPage.module.css'

/* ─── Constants & Validators ─────────────────────────────────────── */
const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com', 'tempmail.com', '10minutemail.com', 'guerrillamail.com',
  'sharklasers.com', 'yopmail.com', 'throwaway.email', 'trashmail.com',
  'temp-mail.org', 'fakeinbox.com', 'moakt.com', 'getnada.com', 'mailnesia.com',
  'dispostable.com', 'mailnull.com', 'spamgourmet.com', 'trashmail.me',
  'maildrop.cc', 'discard.email', 'spambox.us', 'tempinbox.com',
])

const ALLOWED_ROLES = new Set(['patient', 'doctor'])

const NAME_REGEX_EN = /^[A-Za-z]+(?:[ .'\-][A-Za-z]+)*$/
const NAME_REGEX_AR = /^[\u0600-\u06FF]+(?:[ \u0600-\u06FF]+)*$/
const EMAIL_REGEX   = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/
const EG_MOBILE_REGEX   = /^(?:\+?20|0020)?0(1[0125]\d{8})$/
const EG_LANDLINE_REGEX = /^(?:\+?20|0020)?0([2-9]\d{6,8})$/
const MIN_AGE = 16
const MAX_AGE = 120

const validateName = (v) => {
  const t = v.trim()
  if (!t || t.length < 2)  return 'Name must be at least 2 characters.'
  if (t.length > 100)       return 'Name must be at most 100 characters.'
  if (!NAME_REGEX_EN.test(t) && !NAME_REGEX_AR.test(t))
    return 'Name can only contain letters (English or Arabic), spaces, hyphens, or apostrophes.'
  return null
}

const validateEmail = (v) => {
  const t = v.trim().toLowerCase()
  if (/[^\x00-\x7F]/.test(t))         return 'Email must contain English characters only.'
  if (!EMAIL_REGEX.test(t))            return 'Please enter a valid email address.'
  const domain = t.split('@')[1]
  if (!domain || domain.length < 4)   return 'Please enter a valid email address.'
  if (DISPOSABLE_DOMAINS.has(domain)) return 'Temporary email addresses are not allowed.'
  return null
}

const validatePassword = (v) => {
  if (!v || v.length < 8)   return 'Password must be at least 8 characters.'
  if (v.length > 128)        return 'Password is too long.'
  if (!/[A-Z]/.test(v))    return 'Password must contain at least one uppercase letter.'
  if (!/[0-9]/.test(v))    return 'Password must contain at least one number.'
  return null
}

const validateConfirm = (pass, confirm) => {
  if (pass !== confirm) return 'Passwords do not match.'
  return null
}

const validatePhone = (v) => {
  if (!v) return null
  const t = v.trim().replace(/[\s\-]/g, '')
  if (EG_MOBILE_REGEX.test(t) || EG_LANDLINE_REGEX.test(t)) return null
  return 'Please enter a valid Egyptian phone number (e.g. 01012345678 or +20 10 1234 5678).'
}

const validateDOB = (v) => {
  if (!v) return null
  const dob = new Date(v)
  if (isNaN(dob.getTime())) return 'Please enter a valid date.'
  const age = (Date.now() - dob.getTime()) / (1000 * 60 * 60 * 24 * 365.25)
  if (age < MIN_AGE) return `You must be at least ${MIN_AGE} years old.`
  if (age > MAX_AGE) return 'Please enter a valid date of birth.'
  return null
}

const validateRole = (v) => {
  if (!ALLOWED_ROLES.has(v)) return 'Invalid role selected.'
  return null
}

const passwordStrength = (v) => {
  if (!v) return 0
  let score = 0
  if (v.length >= 8)                           score++
  if (v.length >= 12)                          score++
  if (/[A-Z]/.test(v) && /[a-z]/.test(v))    score++
  if (/[0-9]/.test(v))                         score++
  if (/[^A-Za-z0-9]/.test(v))                 score++
  return Math.min(score, 4)
}

const STRENGTH_LABELS = ['', 'Weak', 'Fair', 'Good', 'Strong']
const STRENGTH_COLORS = ['', '#ef4444', '#f59e0b', '#3b82f6', '#22c55e']

/* ─── Rate limit hook ────────────────────────────────────────────── */
const useRateLimit = (maxAttempts = 3, windowMs = 60_000) => {
  const attempts = useRef([])
  return useCallback(() => {
    const now = Date.now()
    attempts.current = attempts.current.filter(t => now - t < windowMs)
    if (attempts.current.length >= maxAttempts) {
      const wait = Math.ceil((windowMs - (now - attempts.current[0])) / 1000)
      throw new Error(`Too many attempts. Please wait ${wait} seconds.`)
    }
    attempts.current.push(now)
  }, [maxAttempts, windowMs])
}

/* ─── Field component ────────────────────────────────────────────── */
function Field({ label, name, optional, errors, touched, children }) {
  return (
    <div className={cls.fieldGroup}>
      <label className={cls.label}>
        {label}{' '}
        {optional && <span className={cls.optional}>(optional)</span>}
      </label>
      {children}
      {touched[name] && errors[name] && (
        <p className={cls.errorText}>
          <span style={{ fontSize: 14 }}>⚠</span> {errors[name]}
        </p>
      )}
    </div>
  )
}

/* ─── Component ──────────────────────────────────────────────────── */
export default function RegisterPage() {
  const [step, setStep] = useState(1)
  const [role, setRole] = useState('patient')
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    phone: '', dateOfBirth: '',
  })
  const [errors,      setErrors]      = useState({})
  const [touched,     setTouched]     = useState({})
  const [loading,     setLoading]     = useState(false)
  const [showPass,    setShowPass]    = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const { register } = useAuth()
  const toast         = useToast()
  const navigate      = useNavigate()
  const checkRate     = useRateLimit(3, 60_000)

  /* ── Compute single field error ──────────────────────────────── */
  const getErr = (k, val, currentForm) => {
    switch (k) {
      case 'name':            return validateName(val)
      case 'email':           return validateEmail(val)
      case 'password':        return validatePassword(val)
      case 'confirmPassword': return validateConfirm(currentForm.password, val)
      case 'phone':           return validatePhone(val)
      case 'dateOfBirth':     return validateDOB(val)
      default:                return null
    }
  }

  /* ── onChange ────────────────────────────────────────────────── */
  const set = (k) => (e) => {
    const val = e.target.value
    setForm(prev => {
      const next = { ...prev, [k]: val }
      if (touched[k]) {
        setErrors(errs => {
          const updated = { ...errs, [k]: getErr(k, val, next) }
          if (k === 'password' && touched['confirmPassword']) {
            updated.confirmPassword = validateConfirm(val, next.confirmPassword)
          }
          return updated
        })
      }
      return next
    })
  }

  /* ── onBlur ──────────────────────────────────────────────────── */
  const blur = (k) => () => {
    setForm(currentForm => {
      setTouched(t => ({ ...t, [k]: true }))
      setErrors(errs => ({ ...errs, [k]: getErr(k, currentForm[k], currentForm) }))
      return currentForm
    })
  }

  /* ── Validate step 1 ─────────────────────────────────────────── */
  const validateStep1 = () => {
    const roleErr = validateRole(role)
    if (roleErr) { toast(roleErr, 'error'); return false }

    const newErrors = {
      name:            validateName(form.name),
      email:           validateEmail(form.email),
      password:        validatePassword(form.password),
      confirmPassword: validateConfirm(form.password, form.confirmPassword),
    }
    setTouched(t => ({ ...t, name: true, email: true, password: true, confirmPassword: true }))
    setErrors(prev => ({ ...prev, ...newErrors }))
    return Object.values(newErrors).every(e => e === null)
  }

  /* ── Validate step 2 ─────────────────────────────────────────── */
  const validateStep2 = () => {
    const newErrors = {
      phone:       validatePhone(form.phone),
      dateOfBirth: validateDOB(form.dateOfBirth),
    }
    setTouched(t => ({ ...t, phone: true, dateOfBirth: true }))
    setErrors(prev => ({ ...prev, ...newErrors }))
    return Object.values(newErrors).every(e => e === null)
  }

  /* ── Submit ──────────────────────────────────────────────────── */
  const handleSubmit = async (e) => {
    e.preventDefault()

    if (step === 1) {
      if (validateStep1()) setStep(2)
      return
    }

    if (!validateStep2()) return

    try {
      checkRate()
    } catch (err) {
      toast(err.message, 'error')
      return
    }

    setLoading(true)
    try {
      const sanitizedRole = ALLOWED_ROLES.has(role) ? role : null
      if (!sanitizedRole) { toast('Invalid role.', 'error'); return }

      const { confirmPassword: _c, ...rest } = form
      const payload = {
        ...rest,
        name:        rest.name.trim(),
        email:       rest.email.trim().toLowerCase(),
        phone:       rest.phone.trim()  || undefined,
        dateOfBirth: rest.dateOfBirth   || undefined,
        role:        sanitizedRole,
      }

      const user = await register(payload)
      toast('Account created successfully! Please verify your email.', 'success')

      if (user.role === 'doctor') navigate('/doctor/onboarding')
      else navigate('/patient/dashboard')

    } catch (err) {
      const safeMsg = err?.status === 409
        ? 'An account with this email already exists.'
        : 'Registration failed. Please try again.'
      toast(safeMsg, 'error')
    } finally {
      setLoading(false)
    }
  }

  /* ── Derived ─────────────────────────────────────────────────── */
  const strength = passwordStrength(form.password)

  const maxDOB = (() => {
    const d = new Date()
    d.setFullYear(d.getFullYear() - MIN_AGE)
    return d.toISOString().split('T')[0]
  })()

  const minDOB = (() => {
    const d = new Date()
    d.setFullYear(d.getFullYear() - MAX_AGE)
    return d.toISOString().split('T')[0]
  })()

  const inputStyle = (name) => ({
    borderColor: touched[name] && errors[name]  ? '#ef4444'
      : touched[name] && !errors[name]          ? '#22c55e'
      : undefined,
  })

  /* ── Render ──────────────────────────────────────────────────── */
  return (
    <>
      <Navbar />
      <div className={cls.pageWrap}>
        <div className={cls.container}>

          {/* Logo */}
          <Link to="/" className={cls.logo}>
            <div className={cls.logoIcon}>
              <span>M</span>
            </div>
            <span className={cls.logoText}>MediBook Pro</span>
          </Link>

          <div className={cls.card}>

            {/* Progress bar */}
            <div className={cls.progressWrap}>
              {[1, 2].map(n => (
                <div
                  key={n}
                  className={`${cls.progressStep} ${n <= step ? cls.progressActive : cls.progressInactive}`}
                />
              ))}
            </div>

            <h2 className={cls.heading}>
              {step === 1 ? 'Create your account' : 'Complete your profile'}
            </h2>
            <p className={cls.subHeading}>
              {step === 1
                ? <> Already have one?{' '}<Link to="/login">Sign in</Link> </>
                : 'Just a few more details'
              }
            </p>

            <form onSubmit={handleSubmit} noValidate>
              {step === 1 ? (
                <>
                  {/* Role selector */}
                  <div className={cls.roleGrid}>
                    {[
                      ['patient', 'person',      'I am a Patient', 'Book appointments'],
                      ['doctor',  'stethoscope', 'I am a Doctor',  'Manage practice'],
                    ].map(([r, icon, title, sub]) => (
                      <button key={r} type="button" onClick={() => setRole(r)}
                        className={`${cls.roleBtn} ${role === r ? cls.roleBtnActive : ''}`}>
                        <span className={`icon icon-filled ${cls.roleIcon}`} style={{ color: role === r ? '#0ea5e9' : '#94a3b8' }}>{icon}</span>
                        <div className={cls.roleTitle}>{title}</div>
                        <div className={cls.roleSub}>{sub}</div>
                      </button>
                    ))}
                  </div>

                  <Field label="Full Name" name="name" errors={errors} touched={touched}>
                    <input className={cls.input} value={form.name}
                      onChange={set('name')} onBlur={blur('name')}
                      placeholder="Ahmed Mohamed / أحمد محمد"
                      required maxLength={100}
                      style={inputStyle('name')}
                      autoComplete="name"
                    />
                  </Field>

                  <Field label="Email Address" name="email" errors={errors} touched={touched}>
                    <input className={cls.input} type="email" value={form.email}
                      onChange={set('email')} onBlur={blur('email')}
                      placeholder="ahmed@example.com"
                      required maxLength={100}
                      style={inputStyle('email')}
                      autoComplete="email"
                    />
                  </Field>

                  <Field label="Password" name="password" errors={errors} touched={touched}>
                    <div className={cls.passwordWrap}>
                      <input className={cls.input} type={showPass ? 'text' : 'password'}
                        value={form.password}
                        onChange={set('password')} onBlur={blur('password')}
                        placeholder="Min 8 chars, 1 uppercase, 1 number"
                        minLength={8} maxLength={128} required
                        style={{ ...inputStyle('password'), paddingRight: 44 }}
                        autoComplete="new-password"
                      />
                      <button type="button" onClick={() => setShowPass(v => !v)}
                        className={cls.toggleBtn}
                        aria-label={showPass ? 'Hide password' : 'Show password'}>
                        {showPass ? '🙈' : '👁️'}
                      </button>
                    </div>
                    {form.password && (
                      <div className={cls.strengthWrap}>
                        <div className={cls.strengthBar}>
                          {[1, 2, 3, 4].map(i => (
                            <div key={i} style={{
                              background: i <= strength ? STRENGTH_COLORS[strength] : '#e2e8f0',
                            }} />
                          ))}
                        </div>
                        <span className={cls.strengthLabel} style={{ color: STRENGTH_COLORS[strength] }}>
                          {STRENGTH_LABELS[strength]}
                        </span>
                      </div>
                    )}
                  </Field>

                  <Field label="Confirm Password" name="confirmPassword" errors={errors} touched={touched}>
                    <div className={cls.passwordWrap}>
                      <input className={cls.input} type={showConfirm ? 'text' : 'password'}
                        value={form.confirmPassword}
                        onChange={set('confirmPassword')} onBlur={blur('confirmPassword')}
                        placeholder="Re-enter password"
                        required maxLength={128}
                        style={{ ...inputStyle('confirmPassword'), paddingRight: 44 }}
                        autoComplete="new-password"
                      />
                      <button type="button" onClick={() => setShowConfirm(v => !v)}
                        className={cls.toggleBtn}
                        aria-label={showConfirm ? 'Hide password' : 'Show password'}>
                        {showConfirm ? '🙈' : '👁️'}
                      </button>
                    </div>
                  </Field>
                </>
              ) : (
                <>
                  <Field label="Phone Number" name="phone" optional errors={errors} touched={touched}>
                    <input className={cls.input} value={form.phone}
                      onChange={set('phone')} onBlur={blur('phone')}
                      placeholder="+20 10 1234 5678"
                      maxLength={20} type="tel"
                      style={inputStyle('phone')}
                      autoComplete="tel"
                    />
                  </Field>

                  <Field label="Date of Birth" name="dateOfBirth" optional errors={errors} touched={touched}>
                    <input className={cls.input} type="date"
                      value={form.dateOfBirth}
                      onChange={set('dateOfBirth')} onBlur={blur('dateOfBirth')}
                      min={minDOB} max={maxDOB}
                      style={inputStyle('dateOfBirth')}
                    />
                  </Field>

                  {role === 'doctor' && (
                    <div className={cls.infoBox}>
                      <span className="icon" style={{ fontSize: 16, verticalAlign: 'middle', marginRight: 6 }}>info</span>
                      After registration, you'll complete your professional profile for verification.
                    </div>
                  )}

                  <p className={cls.termsText}>
                    By creating an account, you agree to our{' '}
                    <Link to="/terms">Terms of Service</Link>{' '}
                    and{' '}
                    <Link to="/privacy">Privacy Policy</Link>.
                  </p>
                </>
              )}

              <div className={cls.buttonRow}>
                {step === 2 && (
                  <button type="button" onClick={() => setStep(1)}
                    className={cls.backBtn}
                    disabled={loading}>
                    ← Back
                  </button>
                )}
                <button type="submit" className={cls.primaryBtn}
                  disabled={loading}>
                  {loading
                    ? <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />
                    : step === 1 ? 'Continue →' : 'Create Account'
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}