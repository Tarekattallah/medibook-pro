import { useState, useEffect, createContext, useContext, useCallback } from 'react'

const ToastCtx = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const show = useCallback((message, type = 'success') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500)
  }, [])

  return (
    <ToastCtx.Provider value={show}>
      {children}
      <div style={{position:'fixed',bottom:24,right:24,display:'flex',flexDirection:'column',gap:8,zIndex:9999}}>
        {toasts.map(t => (
          <div key={t.id} className="fade-in" style={{display:'flex',alignItems:'center',gap:10,padding:'12px 16px',borderRadius:10,background: t.type==='error'?'#dc2626':t.type==='warn'?'#d97706':'#059669',color:'#fff',fontWeight:600,fontSize:14,boxShadow:'0 8px 24px rgba(0,0,0,0.15)',minWidth:260}}>
            <span className="icon icon-filled">{t.type==='error'?'error':t.type==='warn'?'warning':'check_circle'}</span>
            {t.message}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}

export const useToast = () => useContext(ToastCtx)
