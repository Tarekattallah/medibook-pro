import { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../../components/layout/Navbar'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../components/ui/Toast'
import s from './MedicalRecordsPage.module.css'

/* ── Helper: تعيين نوع السجل ──────────────────────────────────── */
const getRecordTypeStyle = (type) => {
  const map = {
    'lab':         s.typeLab,
    'prescription': s.typePrescription,
    'imaging':     s.typeImaging,
    'emergency':   s.typeEmergency,
  }
  return map[type] || s.typeGeneral
}

const getRecordTypeLabel = (type) => {
  const map = {
    'lab':          'Lab Results',
    'prescription': 'Prescriptions',
    'imaging':      'Imaging',
    'emergency':    'Emergency',
  }
  return map[type] || 'General'
}

/* ── Helper: الأحرف الأولى من الاسم ───────────────────────────── */
const getInitials = (name) => {
  if (!name) return '??'
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

/* ── Helper: لون الصورة الرمزية ────────────────────────────────── */
const getAvatarColor = (name) => {
  const colors = [
    { bg: '#e0f2fe', text: '#0369a1' },
    { bg: '#f3e8ff', text: '#7c3aed' },
    { bg: '#ecfdf5', text: '#059669' },
    { bg: '#fff7ed', text: '#ea580c' },
    { bg: '#fef2f2', text: '#dc2626' },
  ]
  if (!name) return colors[0]
  const idx = name.charCodeAt(0) % colors.length
  return colors[idx]
}

export default function MedicalRecordsPage() {
  const { apiFetch } = useAuth()
  const toast = useToast()
  const fileInputRef = useRef(null)

  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalRecords, setTotalRecords] = useState(0)
  const limit = 10

  // ملخصات الشريط الجانبي (من نفس السجلات)
  const recentLabs = records.filter(r => r.type === 'lab').slice(0, 2)
  const activePrescriptions = records.filter(r => r.type === 'prescription').slice(0, 2)

  /* ── جلب السجلات الطبية ────────────────────────────────────── */
  const loadRecords = useCallback(async (query = searchQuery, pageNum = page) => {
    setLoading(true)
    try {
      const qs = new URLSearchParams({ page: pageNum, limit })
      if (query.trim()) qs.set('q', query.trim())

      const data = await apiFetch(`/medical-records/my?${qs}`)
      setRecords(data.records || [])
      setTotal(data.total || 0)
      setTotalRecords(data.allTotal || data.total || 0)
    } catch {
      setRecords([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [apiFetch, limit, searchQuery, page])

  useEffect(() => {
    loadRecords(searchQuery, page)
  }, [page])

  const handleSearch = (e) => {
    e.preventDefault()
    loadRecords(searchQuery, 1)
    setPage(1)
  }

  /* ── رفع ملف جديد ───────────────────────────────────────────── */
  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'application/msword',
                          'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    if (!allowedTypes.includes(file.type)) {
      toast('Unsupported file type. Allowed: PDF, JPG, PNG, DOC.', 'error')
      e.target.value = ''
      return
    }
    if (file.size > 15 * 1024 * 1024) {
      toast('File size must be less than 15MB.', 'error')
      e.target.value = ''
      return
    }

    const formData = new FormData()
    formData.append('file', file)
    formData.append('title', file.name)
    formData.append('type', 'general') // يمكن تحسينه لاحقاً

    try {
      await apiFetch('/medical-records', {
        method: 'POST',
        body: formData,
        // لا نضع Content-Type هنا، سيتم تعيينه تلقائياً مع boundary
      })
      toast('File uploaded successfully!')
      loadRecords(searchQuery, page)
    } catch (err) {
      toast(err.message || 'Upload failed.', 'error')
    } finally {
      e.target.value = ''
    }
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="page">
      <Navbar />

      <div className={s.pageWrap}>
        {/* ── Header ── */}
        <div className={s.headerSection}>
          <div className={s.headerLeft}>
            <div className={s.titleRow}>
              <h1 className={s.pageTitle}>Medical History</h1>
              <span className={s.recordCount}>{totalRecords} Records</span>
            </div>
            <form className={s.searchWrapper} onSubmit={handleSearch}>
              <span className={`icon ${s.searchIcon}`}>search</span>
              <input
                className={s.searchInput}
                type="text"
                placeholder="Search records or providers..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </form>
          </div>
          <button className={s.uploadBtn} onClick={handleUploadClick}>
            <span className="icon" style={{ fontSize: 20 }}>add</span>
            Upload New Record
          </button>
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleFileChange}
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
          />
        </div>

        {/* ── Upload Zone ── */}
        <div className={s.uploadZone} onClick={handleUploadClick}>
          <div className={s.uploadZoneIcon}>
            <span className="icon" style={{ fontSize: 32 }}>cloud_upload</span>
          </div>
          <h3 className={s.uploadZoneTitle}>Click or drag files to upload</h3>
          <p className={s.uploadZoneSub}>
            Support for PDF, JPG, PNG, and DOC. Maximum file size 15MB.
          </p>
        </div>

        {/* ── Main Content ── */}
        <div className={s.mainLayout}>
          {/* ── Table ── */}
          <div>
            <div className={s.tableCard}>
              {loading ? (
                <div className={s.spinnerWrap}><div className="spinner" /></div>
              ) : records.length === 0 ? (
                <div className={s.emptyState}>
                  <span className={`icon ${s.emptyIcon}`}>folder_open</span>
                  <h3 className={s.emptyTitle}>No medical records yet</h3>
                  <p className={s.emptyText}>
                    Your medical history will appear here once records are added.
                  </p>
                </div>
              ) : (
                <>
                  <div className={s.tableWrapper}>
                    <table className={s.recordsTable}>
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Healthcare Provider</th>
                          <th>Specialty</th>
                          <th>Reason for Visit / Summary</th>
                          <th style={{ textAlign: 'right' }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {records.map(rec => {
                          const avatarColor = getAvatarColor(rec.providerName || rec.doctor?.name)
                          return (
                            <tr key={rec._id}>
                              <td style={{ whiteSpace: 'nowrap', fontWeight: 500 }}>
                                {new Date(rec.date || rec.createdAt).toLocaleDateString('en', {
                                  month: 'short', day: 'numeric', year: 'numeric'
                                })}
                              </td>
                              <td>
                                <div className={s.providerCell}>
                                  <div
                                    className={s.providerAvatar}
                                    style={{ background: avatarColor.bg, color: avatarColor.text }}
                                  >
                                    {getInitials(rec.providerName || rec.doctor?.name)}
                                  </div>
                                  <span className={s.providerName}>
                                    {rec.providerName || rec.doctor?.name || 'Unknown Provider'}
                                  </span>
                                </div>
                              </td>
                              <td>
                                <span className={`${s.recordType} ${getRecordTypeStyle(rec.type)}`}>
                                  {getRecordTypeLabel(rec.type)}
                                </span>
                              </td>
                              <td style={{ color: '#64748b' }}>
                                {rec.summary || rec.reason || rec.description || '—'}
                              </td>
                              <td>
                                <div className={s.actionCell}>
                                  <Link
                                    to={`/patient/records/${rec._id}`}
                                    className={s.viewLink}
                                  >
                                    View Full Report
                                  </Link>
                                  <button className={s.moreBtn} title="More options">
                                    <span className="icon" style={{ fontSize: 20 }}>more_vert</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* ── Pagination ── */}
                  {totalPages > 1 && (
                    <div className={s.pagination}>
                      <span className={s.paginationInfo}>
                        Showing {Math.min((page - 1) * limit + 1, total)}–{Math.min(page * limit, total)} of {total} records
                      </span>
                      <div className={s.paginationBtns}>
                        <button
                          className={s.pageBtn}
                          disabled={page <= 1}
                          onClick={() => setPage(p => Math.max(1, p - 1))}
                        >
                          <span className="icon" style={{ fontSize: 18 }}>chevron_left</span>
                        </button>
                        <button
                          className={s.pageBtn}
                          disabled={page >= totalPages}
                          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        >
                          <span className="icon" style={{ fontSize: 18 }}>chevron_right</span>
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* ── Sidebar (ديناميكي من البيانات) ── */}
          <aside className={s.sidebar}>
            {/* Health Alerts (ثابتة حالياً) */}
            <div className={s.alertCard}>
              <div className={s.alertHeader}>
                <span className="icon" style={{ fontSize: 20 }}>report</span>
                Health Alerts
              </div>
              <div className={s.alertItem}>
                <p className={s.alertTitle}>Vaccination Due</p>
                <p className={s.alertDesc}>Tetanus booster recommended by Dec 2025.</p>
              </div>
            </div>

            {/* Recent Labs (من السجلات) */}
            <div className={s.sidebarCard}>
              <h4 className={s.sidebarCardTitle}>Recent Labs</h4>
              {recentLabs.length > 0 ? (
                recentLabs.map((lab, i) => (
                  <div key={lab._id || i} className={s.sidebarItem}>
                    <div className={s.sidebarItemIcon} style={{ background: '#e0f2fe', color: '#0369a1' }}>
                      <span className="icon" style={{ fontSize: 20 }}>science</span>
                    </div>
                    <div>
                      <div className={s.sidebarItemTitle}>{lab.title || 'Lab Result'}</div>
                      <div className={s.sidebarItemSub}>{new Date(lab.date).toLocaleDateString('en', { month: 'short', day: 'numeric' })} • Normal</div>
                    </div>
                  </div>
                ))
              ) : (
                <p style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center', padding: '10px 0' }}>No recent labs.</p>
              )}
              <button className={s.sidebarAction}>View All Labs</button>
            </div>

            {/* Active Prescriptions (من السجلات) */}
            <div className={s.sidebarCard}>
              <h4 className={s.sidebarCardTitle}>Active Prescriptions</h4>
              {activePrescriptions.length > 0 ? (
                activePrescriptions.map((pres, i) => (
                  <div key={pres._id || i} className={s.sidebarItem}>
                    <div className={s.sidebarItemIcon} style={{ background: '#f3e8ff', color: '#7c3aed' }}>
                      <span className="icon" style={{ fontSize: 20 }}>medication</span>
                    </div>
                    <div>
                      <div className={s.sidebarItemTitle}>{pres.title || 'Prescription'}</div>
                      <div className={s.sidebarItemSub}>{pres.description || 'No details'}</div>
                    </div>
                  </div>
                ))
              ) : (
                <p style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center', padding: '10px 0' }}>No active prescriptions.</p>
              )}
              <button className={s.sidebarAction}>Manage Rx</button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}