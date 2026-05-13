import { useState, useEffect, useRef } from 'react'
import Navbar from '../../components/layout/Navbar'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../components/ui/Toast'

const ACCEPT = '.pdf,.jpg,.jpeg,.png,.doc,.docx'

const TYPE_META = {
  'lab-result':   { icon:'science',     ic:'#7c3aed', bg:'#f5f3ff', label:'Lab Results'  },
  'prescription': { icon:'medication',  ic:'#059669', bg:'#ecfdf5', label:'Prescription'  },
  'imaging':      { icon:'radiology',   ic:'#0284c7', bg:'#eff6ff', label:'Imaging'       },
  'consultation': { icon:'stethoscope', ic:'#dc2626', bg:'#fef2f2', label:'Consultation'  },
  'vaccination':  { icon:'vaccines',    ic:'#d97706', bg:'#fffbeb', label:'Vaccination'   },
  'other':        { icon:'description', ic:'#64748b', bg:'#f8fafc', label:'Document'      },
}

export default function MedicalRecordsPage() {
  const { apiFetch } = useAuth()
  const toast   = useToast()
  const fileRef = useRef(null)

  const [records,   setRecords]   = useState([])
  const [loading,   setLoading]   = useState(true)
  const [uploading, setUploading] = useState(false)
  const [dragOver,  setDragOver]  = useState(false)
  const [preview,   setPreview]   = useState(null)

  // Load records from API
  const loadRecords = async () => {
    setLoading(true)
    try {
      const data = await apiFetch('/medical-records')
      setRecords(data.records || [])
    } catch {
      // Fallback static demo data if API not ready
      setRecords([
        { _id:'1', type:'lab-result',   title:'Complete Blood Count',  date: new Date('2025-01-10'), doctor:{ name:'Dr. Sarah Johnson' }, attachments:[] },
        { _id:'2', type:'prescription', title:'Medication Refill',     date: new Date('2024-12-15'), doctor:{ name:'Dr. Michael Chen'  }, attachments:[] },
        { _id:'3', type:'imaging',      title:'Chest X-Ray Report',    date: new Date('2024-11-20'), doctor:{ name:'Dr. James Wilson'  }, attachments:[] },
      ])
    } finally { setLoading(false) }
  }

  useEffect(() => { loadRecords() }, [])

  const uploadFile = async file => {
    if (!file) return
    if (file.size > 10 * 1024 * 1024) { toast('File too large (max 10MB)', 'error'); return }
    setUploading(true)
    try {
      const form = new FormData()
      form.append('file',  file)
      form.append('title', file.name.replace(/\.[^/.]+$/, ''))
      form.append('type',  file.type.startsWith('image') ? 'imaging' : 'other')

      const token = localStorage.getItem('mb_token')
      const res   = await fetch('/api/medical-records', {
        method:  'POST',
        headers: { Authorization: `Bearer ${token}` },
        body:    form,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)

      toast('File uploaded successfully!')
      loadRecords() // reload from server
    } catch (err) {
      // Fallback: add locally with object URL
      const local = {
        _id:         Date.now().toString(),
        type:        file.type.startsWith('image') ? 'imaging' : 'other',
        title:       file.name.replace(/\.[^/.]+$/, ''),
        date:        new Date(),
        doctor:      null,
        attachments: [{ name: file.name, url: URL.createObjectURL(file), type: file.type }],
        _local:      true,
      }
      setRecords(prev => [local, ...prev])
      toast('Saved locally (backend not connected)')
    } finally { setUploading(false) }
  }

  const deleteRecord = async id => {
    if (!window.confirm('Delete this record?')) return
    try {
      await apiFetch(`/medical-records/${id}`, { method:'DELETE' })
      setRecords(prev => prev.filter(r => r._id !== id))
      toast('Record deleted')
    } catch (err) { toast(err.message, 'error') }
  }

  const onFileChange = e  => { const f = e.target.files?.[0]; if (f) uploadFile(f); e.target.value = '' }
  const onDrop       = e  => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) uploadFile(f) }
  const onDragOver   = e  => { e.preventDefault(); setDragOver(true) }
  const onDragLeave  = () => setDragOver(false)

  const fmtDate = d => new Date(d).toLocaleDateString('en', { month:'short', day:'numeric', year:'numeric' })

  return (
    <div className="page">
      <Navbar/>

      {/* Preview modal */}
      {preview && (
        <div style={{position:'fixed',inset:0,background:'rgba(15,23,42,.8)',backdropFilter:'blur(4px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000,padding:24}}
          onClick={() => setPreview(null)}>
          <div style={{background:'#fff',borderRadius:16,padding:24,maxWidth:820,width:'100%',maxHeight:'90vh',overflow:'auto'}} onClick={e=>e.stopPropagation()}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
              <h3 style={{fontWeight:700,color:'#0b1c30',fontSize:16}}>{preview.name}</h3>
              <button onClick={() => setPreview(null)} style={{background:'none',border:'none',cursor:'pointer'}}>
                <span className="icon" style={{fontSize:24,color:'#64748b'}}>close</span>
              </button>
            </div>
            {preview.url && (preview.type?.startsWith('image') || /\.(jpg|jpeg|png|gif|webp)$/i.test(preview.url))
              ? <img src={preview.url} alt={preview.name} style={{width:'100%',borderRadius:8}}/>
              : <div style={{textAlign:'center',padding:60,color:'#94a3b8'}}>
                  <span className="icon" style={{fontSize:64,display:'block',marginBottom:12}}>description</span>
                  <p>Preview not available.</p>
                  <a href={preview.url} download target="_blank" rel="noreferrer" style={{color:'#0ea5e9',fontWeight:600}}>Download file</a>
                </div>
            }
          </div>
        </div>
      )}

      <div style={{maxWidth:800,margin:'0 auto',padding:'32px 24px'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:28,flexWrap:'wrap',gap:12}}>
          <div>
            <h1 style={{fontSize:26,fontWeight:800,color:'#0b1c30',letterSpacing:'-0.02em'}}>Medical Records</h1>
            <p style={{fontSize:13,color:'#64748b',marginTop:4}}>{records.length} record{records.length!==1?'s':''}</p>
          </div>
          <button onClick={() => fileRef.current?.click()} className="btn btn-primary" style={{fontSize:14}} disabled={uploading}>
            {uploading
              ? <><div className="spinner" style={{width:16,height:16,borderWidth:2}}/> Uploading...</>
              : <><span className="icon" style={{fontSize:17}}>upload</span> Upload Record</>}
          </button>
          <input ref={fileRef} type="file" accept={ACCEPT} onChange={onFileChange} style={{display:'none'}}/>
        </div>

        {/* Drop zone */}
        <div onDrop={onDrop} onDragOver={onDragOver} onDragLeave={onDragLeave}
          onClick={() => !uploading && fileRef.current?.click()}
          style={{border:`2px dashed ${dragOver?'#0ea5e9':'#e2e8f0'}`,borderRadius:12,padding:'28px 24px',textAlign:'center',marginBottom:24,background:dragOver?'#f0f9ff':'#f8fafc',cursor:'pointer',transition:'all .2s'}}>
          {uploading
            ? <><div className="spinner" style={{margin:'0 auto 10px'}}/><p style={{color:'#64748b',fontSize:14}}>Uploading...</p></>
            : <>
                <span className="icon" style={{fontSize:36,color:dragOver?'#0ea5e9':'#cbd5e1',display:'block',marginBottom:8}}>cloud_upload</span>
                <p style={{fontWeight:600,color:'#374151',fontSize:14,marginBottom:3}}>{dragOver?'Drop to upload':'Drag & drop or click to upload'}</p>
                <p style={{fontSize:12,color:'#94a3b8'}}>PDF, JPG, PNG, DOC — max 10 MB</p>
              </>
          }
        </div>

        {/* Records */}
        {loading ? (
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            {[1,2,3].map(i => (
              <div key={i} className="card" style={{padding:18,display:'flex',gap:14,height:76}}>
                <div style={{width:48,height:48,borderRadius:12,background:'#f1f5f9'}}/>
                <div style={{flex:1,display:'flex',flexDirection:'column',gap:8,paddingTop:4}}>
                  <div style={{height:13,background:'#f1f5f9',borderRadius:6,width:'40%'}}/>
                  <div style={{height:11,background:'#f1f5f9',borderRadius:6,width:'60%'}}/>
                </div>
              </div>
            ))}
          </div>
        ) : records.length === 0 ? (
          <div style={{textAlign:'center',padding:'50px 24px'}}>
            <span className="icon" style={{fontSize:52,color:'#cbd5e1',display:'block',marginBottom:12}}>folder_open</span>
            <p style={{color:'#64748b',fontSize:15,fontWeight:600}}>No records yet</p>
            <p style={{color:'#94a3b8',fontSize:13,marginTop:4}}>Upload your first medical document</p>
          </div>
        ) : (
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            {records.map(r => {
              const meta = TYPE_META[r.type] || TYPE_META['other']
              const att  = r.attachments?.[0]
              return (
                <div key={r._id} className="card" style={{padding:18,display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,flexWrap:'wrap'}}>
                  <div style={{display:'flex',alignItems:'center',gap:14}}>
                    <div style={{width:48,height:48,borderRadius:12,background:meta.bg,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                      <span className="icon icon-filled" style={{fontSize:24,color:meta.ic}}>{meta.icon}</span>
                    </div>
                    <div>
                      <div style={{fontWeight:700,fontSize:14,color:'#0b1c30'}}>{r.title}</div>
                      <div style={{fontSize:12,color:'#64748b',marginTop:2}}>
                        {meta.label} · {fmtDate(r.date)}
                      </div>
                      <div style={{fontSize:11,color:'#94a3b8',marginTop:1}}>
                        {r.doctor?.name || 'Uploaded by patient'}
                        {att && ` · ${att.name}`}
                      </div>
                    </div>
                  </div>
                  <div style={{display:'flex',gap:8,flexShrink:0}}>
                    {att?.url && (
                      <button onClick={() => setPreview({ name:r.title, url:att.url, type:att.type })}
                        className="btn btn-ghost" style={{fontSize:13,padding:'7px 12px'}}>
                        <span className="icon" style={{fontSize:15}}>visibility</span> View
                      </button>
                    )}
                    <button onClick={() => deleteRecord(r._id)}
                      className="btn btn-danger" style={{fontSize:13,padding:'7px 12px'}}>
                      <span className="icon" style={{fontSize:15}}>delete</span>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
