/**
 * AuthContext — Production-grade, secure
 *
 * Security decisions:
 *  - Token stored in memory only (not localStorage) — XSS can't steal it
 *  - httpOnly cookie handled by the backend for refresh
 *  - Client-side rate limiting to slow brute-force UI abuse
 *  - Generic error messages (no user enumeration)
 *  - Input sanitization before any API call
 *  - apiFetch auto-retries once after silent token refresh
 *  - loggingOut ref prevents race conditions on simultaneous 401s
 *  - Network errors caught and surfaced with user-friendly messages
 *  - Proactive token refresh 60s before expiry (requires exp in token payload)
 *  - Notification polling pauses when tab is hidden (visibilitychange)
 */

import {
  createContext, useContext, useState,
  useEffect, useRef, useCallback,
} from 'react'

/* ─── Config ─────────────────────────────────────────────────────── */
const API = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api'

// Client-side rate limit: max 5 login attempts per 15 minutes
const RATE_LIMIT = { max: 5, windowMs: 15 * 60 * 1000 }

// How many ms before token expiry to proactively refresh (60 seconds)
const REFRESH_BEFORE_MS = 60_000

/* ─── Helpers ────────────────────────────────────────────────────── */

/** Sanitize string input — trim + strip null bytes + reject non-ASCII in email context */
const sanitize = (str = '') =>
  String(str).trim().replace(/\0/g, '').slice(0, 500)

/** Basic email format check — ASCII only, rejects Unicode/Arabic chars */
const isValidEmail = (email) => {
  if (/[^\x00-\x7F]/.test(email)) return false
  return /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,}$/.test(email)
}

/**
 * Parse JWT payload without verifying signature.
 * Used only to read the exp claim for proactive refresh scheduling.
 * Backend still validates the token on every request.
 */
const parseTokenExp = (token) => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return typeof payload.exp === 'number' ? payload.exp * 1000 : null
  } catch {
    return null
  }
}

/** In-memory rate limiter (resets on page reload — backend must also enforce) */
const rateLimiter = (() => {
  const attempts = []
  return {
    check() {
      const now = Date.now()
      while (attempts.length && attempts[0] < now - RATE_LIMIT.windowMs) {
        attempts.shift()
      }
      if (attempts.length >= RATE_LIMIT.max) {
        const wait = Math.ceil((attempts[0] + RATE_LIMIT.windowMs - now) / 1000 / 60)
        throw new Error(`Too many attempts. Please wait ${wait} minute${wait !== 1 ? 's' : ''}.`)
      }
      attempts.push(now)
    },
    reset() { attempts.length = 0 },
  }
})()

/* ─── Context ────────────────────────────────────────────────────── */
const Ctx = createContext(null)

export function AuthProvider({ children }) {
  const tokenRef      = useRef(null)
  const [user,        setUser]        = useState(null)
  const [loading,     setLoading]     = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)
  const loggingOut    = useRef(false)
  const proactiveTimer = useRef(null)

  /* ── Schedule proactive refresh before token expires ─────────── */
  const scheduleProactiveRefresh = useCallback((token, refreshFn) => {
    if (proactiveTimer.current) clearTimeout(proactiveTimer.current)
    const exp = parseTokenExp(token)
    if (!exp) return
    const delay = exp - Date.now() - REFRESH_BEFORE_MS
    if (delay <= 0) return
    proactiveTimer.current = setTimeout(async () => {
      const ok = await refreshFn()
      // If refresh succeeded, refreshToken() will call scheduleProactiveRefresh again
      if (!ok) { /* token expired — next API call will handle 401 */ }
    }, delay)
  }, [])

  /* ── Logout ───────────────────────────────────────────────────── */
  const doLogout = useCallback(async (notifyServer = true) => {
    if (loggingOut.current) return
    loggingOut.current = true
    rateLimiter.reset()
    if (proactiveTimer.current) clearTimeout(proactiveTimer.current)

    if (notifyServer && tokenRef.current) {
      fetch(`${API}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: { Authorization: `Bearer ${tokenRef.current}` },
      }).catch(() => {})
    }

    tokenRef.current = null
    setUser(null)
    setUnreadCount(0)
    setTimeout(() => { loggingOut.current = false }, 2000)
  }, [])

  /* ── Silent refresh (uses httpOnly refresh cookie) ───────────── */
  const refreshToken = useCallback(async () => {
    try {
      const res = await fetch(`${API}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      })
      if (!res.ok) return false
      const data = await res.json()
      if (data?.token) {
        tokenRef.current = data.token
        // Schedule next proactive refresh based on new token's expiry
        scheduleProactiveRefresh(data.token, refreshToken)
        return true
      }
    } catch {
      // Network error — don't log the user out, just return false
    }
    return false
  }, [scheduleProactiveRefresh])

  /* ── Restore session on mount ─────────────────────────────────── */
  useEffect(() => {
    ;(async () => {
      const ok = await refreshToken()
      if (!ok) { setLoading(false); return }

      try {
        const res = await fetch(`${API}/auth/me`, {
          headers: { Authorization: `Bearer ${tokenRef.current}` },
          credentials: 'include',
        })
        if (res.status === 401) { await doLogout(false); return }
        const data = await res.json()
        if (data?.user) setUser(data.user)
      } catch {
        // Network error on mount — leave user logged out gracefully
      } finally {
        setLoading(false)
      }
    })()
  }, [refreshToken, doLogout])

  /* ── Poll unread notifications every 60s, pause when tab hidden ── */
  useEffect(() => {
    if (!user) return

    const fetchUnread = async () => {
      // Pause polling when tab is not visible — saves requests
      if (document.visibilityState === 'hidden') return
      if (!tokenRef.current || loggingOut.current) return
      try {
        const res = await fetch(`${API}/notifications?limit=1`, {
          headers: { Authorization: `Bearer ${tokenRef.current}` },
          credentials: 'include',
        })
        if (res.status === 401) { await doLogout(false); return }
        const data = res.ok ? await res.json() : null
        if (data?.unreadCount !== undefined) setUnreadCount(data.unreadCount)
      } catch {
        // Network error — ignore, will retry next interval
      }
    }

    fetchUnread()
    const id = setInterval(fetchUnread, 60_000)

    // Also fetch immediately when user returns to tab
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') fetchUnread()
    }
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [user, doLogout])

  /* ── Core JSON fetch (auto-retry after token refresh) ────────── */
  const apiFetch = useCallback(async (path, opts = {}, _retried = false) => {
    if (loggingOut.current) throw new Error('Please log in.')

    let res
    try {
      res = await fetch(`${API}${path}`, {
        ...opts,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(tokenRef.current ? { Authorization: `Bearer ${tokenRef.current}` } : {}),
          ...opts.headers,
        },
      })
    } catch {
      // Network-level failure (no internet, DNS failure, etc.)
      throw new Error('Network error. Please check your connection and try again.')
    }

    if (res.status === 401) {
      if (!_retried) {
        const ok = await refreshToken()
        if (ok) return apiFetch(path, opts, true)
      }
      await doLogout(false)
      throw new Error('Session expired. Please log in again.')
    }

    const data = await res.json()
    if (!res.ok) {
      const err = new Error(data.message || 'Request failed')
      err.status = res.status
      throw err
    }
    return data
  }, [doLogout, refreshToken])

  /* ── FormData fetch (file upload) ────────────────────────────── */
  const apiFetchForm = useCallback(async (path, formData, method = 'PATCH') => {
    if (loggingOut.current) throw new Error('Please log in.')
    if (!(formData instanceof FormData)) throw new Error('Invalid request format.')

    let res
    try {
      res = await fetch(`${API}${path}`, {
        method,
        credentials: 'include',
        headers: tokenRef.current ? { Authorization: `Bearer ${tokenRef.current}` } : {},
        body: formData,
      })
    } catch {
      throw new Error('Network error. Please check your connection and try again.')
    }

    if (res.status === 401) {
      const ok = await refreshToken()
      if (ok) return apiFetchForm(path, formData, method)
      await doLogout(false)
      throw new Error('Session expired. Please log in again.')
    }

    const data = await res.json()
    if (!res.ok) {
      const err = new Error(data.message || 'Request failed')
      err.status = res.status
      throw err
    }
    return data
  }, [doLogout, refreshToken])

  /* ── Login ───────────────────────────────────────────────────── */
  const login = useCallback(async (rawEmail, rawPassword) => {
    rateLimiter.check()

    const email    = sanitize(rawEmail).toLowerCase()
    const password = sanitize(rawPassword)

    if (!email || !password)
      throw new Error('Please enter your email and password.')
    if (!isValidEmail(email))
      throw new Error('Please enter a valid email address.')
    if (password.length < 8)
      throw new Error('Invalid email or password.')

    let res
    try {
      res = await fetch(`${API}/auth/login`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
    } catch {
      throw new Error('Network error. Please check your connection and try again.')
    }

    const data = await res.json()
    if (!res.ok) throw new Error('Invalid email or password.')

    // Set token first, then clear loggingOut flag — avoids brief race window
    tokenRef.current   = data.token
    loggingOut.current = false
    setUser(data.user)
    rateLimiter.reset()

    // Schedule proactive refresh based on token expiry
    scheduleProactiveRefresh(data.token, refreshToken)

    return data.user
  }, [scheduleProactiveRefresh, refreshToken])

  /* ── Register ─────────────────────────────────────────────────── */
  const register = useCallback(async (payload) => {
    const email    = sanitize(payload.email ?? '').toLowerCase()
    const password = sanitize(payload.password ?? '')
    const name     = sanitize(payload.name ?? '').slice(0, 100)

    if (!isValidEmail(email))
      throw new Error('Please enter a valid email address.')
    if (password.length < 8)
      throw new Error('Password must be at least 8 characters.')

    let res
    try {
      res = await fetch(`${API}/auth/register`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, email, password, name }),
      })
    } catch {
      throw new Error('Network error. Please check your connection and try again.')
    }

    const data = await res.json()
    if (!res.ok) {
      // Attach HTTP status so callers can distinguish 409 Conflict etc.
      const err = new Error(data.message || 'Registration failed')
      err.status = res.status
      throw err
    }

    // Set token first, then clear loggingOut flag
    tokenRef.current   = data.token
    loggingOut.current = false
    setUser(data.user)

    scheduleProactiveRefresh(data.token, refreshToken)

    return data.user
  }, [scheduleProactiveRefresh, refreshToken])

  /* ── updateUser ───────────────────────────────────────────────── */
  const updateUser = useCallback(
    (updates) => setUser(prev => ({ ...prev, ...updates })),
    []
  )

  /* ── Loading screen ───────────────────────────────────────────── */
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <div className="spinner" />
    </div>
  )

  return (
    <Ctx.Provider value={{
      user,
      login,
      logout: doLogout,
      register,
      apiFetch,
      apiFetchForm,
      unreadCount,
      setUnreadCount,
      updateUser,
    }}>
      {children}
    </Ctx.Provider>
  )
}

export const useAuth = () => useContext(Ctx)