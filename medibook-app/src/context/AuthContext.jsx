import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'

const Ctx = createContext(null)

// In production: uses VITE_API_URL env var
// In development: uses vite proxy → localhost:4000
const API = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api'

export function AuthProvider({ children }) {
  const [user,        setUser]        = useState(null)
  const [loading,     setLoading]     = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)
  const loggingOut = useRef(false)

  const doLogout = useCallback(() => {
    if (loggingOut.current) return
    loggingOut.current = true
    localStorage.removeItem('mb_token')
    setUser(null)
    setUnreadCount(0)
    setTimeout(() => { loggingOut.current = false }, 2000)
  }, [])

  // Restore session
  useEffect(() => {
    const t = localStorage.getItem('mb_token')
    if (!t) { setLoading(false); return }
    fetch(`${API}/auth/me`, { headers: { Authorization: `Bearer ${t}` } })
      .then(r => {
        if (r.status === 401) { localStorage.removeItem('mb_token'); return null }
        return r.json()
      })
      .then(d => { if (d?.user) setUser(d.user) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // Poll unread notifications every 60s
  useEffect(() => {
    if (!user) return
    const fetch_unread = () => {
      const t = localStorage.getItem('mb_token')
      if (!t || loggingOut.current) return
      fetch(`${API}/notifications?limit=1`, { headers: { Authorization: `Bearer ${t}` } })
        .then(r => r.ok ? r.json() : null)
        .then(d => { if (d?.unreadCount !== undefined) setUnreadCount(d.unreadCount) })
        .catch(() => {})
    }
    fetch_unread()
    const id = setInterval(fetch_unread, 60000)
    return () => clearInterval(id)
  }, [user])

  const apiFetch = useCallback(async (path, opts = {}) => {
    if (loggingOut.current) throw new Error('Please log in.')
    const t = localStorage.getItem('mb_token')
    const res = await fetch(`${API}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(t ? { Authorization: `Bearer ${t}` } : {}),
      },
      ...opts,
    })
    if (res.status === 401) { doLogout(); throw new Error('Session expired. Please log in again.') }
    const data = await res.json()
    if (!res.ok) throw new Error(data.message || 'Request failed')
    return data
  }, [doLogout])

  const login = async (email, password) => {
    const res  = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.message || 'Login failed')
    loggingOut.current = false
    localStorage.setItem('mb_token', data.token)
    setUser(data.user)
    return data.user
  }

  const register = async (payload) => {
    const res  = await fetch(`${API}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.message || 'Registration failed')
    loggingOut.current = false
    localStorage.setItem('mb_token', data.token)
    setUser(data.user)
    return data.user
  }

  const logout    = doLogout
  const updateUser = (updates) => setUser(prev => ({ ...prev, ...updates }))

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh' }}>
      <div className="spinner"/>
    </div>
  )

  return (
    <Ctx.Provider value={{ user, login, logout, register, apiFetch, unreadCount, setUnreadCount, updateUser }}>
      {children}
    </Ctx.Provider>
  )
}

export const useAuth = () => useContext(Ctx)
