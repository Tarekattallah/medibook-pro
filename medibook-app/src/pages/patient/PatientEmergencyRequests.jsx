import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../../components/layout/Navbar'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../components/ui/Toast'

export default function PatientEmergencyRequests() {
    const { apiFetch } = useAuth()
    const toast = useToast()
    const [requests, setRequests] = useState([])
    const [loading, setLoading] = useState(true)

    const loadRequests = () => {
        apiFetch('/emergency/my-requests')
            .then(d => setRequests(d.requests || []))
            .catch(() => { })
            .finally(() => setLoading(false))
    }

    useEffect(() => { loadRequests() }, [])

    const cancelRequest = async (id) => {
        if (!window.confirm('Cancel this request?')) return
        try {
            await apiFetch(`/emergency/${id}`, { method: 'DELETE' })
            toast('Request cancelled.')
            loadRequests()
        } catch (err) {
            toast(err.message, 'error')
        }
    }

    return (
        <div className="page">
            <Navbar />
            <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 24px' }}>
                <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0b1c30', marginBottom: 24 }}>My Emergency Requests</h1>

                {loading ? (
                    <div className="spinner" style={{ margin: '40px auto' }} />
                ) : requests.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 24px', color: '#64748b' }}>
                        <span className="icon" style={{ fontSize: 48, color: '#cbd5e1' }}>history</span>
                        <p style={{ marginTop: 16 }}>No requests yet.</p>
                    </div>
                ) : (
                    requests.map(req => (
                        <div key={req._id} className="card" style={{ padding: 20, marginBottom: 16 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                <h3 style={{ fontWeight: 700, color: '#0b1c30', textTransform: 'capitalize' }}>
                                    {req.type === 'teleconsult' ? 'Teleconsult' : 'Support Chat'}
                                </h3>
                                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                    <span className={`badge badge-${req.status === 'pending' ? 'pending' : req.status === 'accepted' ? 'confirmed' : req.status === 'rejected' ? 'cancelled' : 'completed'}`}>
                                        {req.status}
                                    </span>
                                    {req.status === 'pending' && (
                                        <button
                                            onClick={() => cancelRequest(req._id)}
                                            className="btn btn-danger"
                                            style={{ fontSize: 11, padding: '3px 8px' }}
                                        >
                                            Cancel
                                        </button>
                                    )}
                                </div>
                            </div>
                            {req.message && <p style={{ fontSize: 14, color: '#475569', marginBottom: 8 }}>"{req.message}"</p>}
                            {req.responseMessage && (
                                <div style={{ background: '#f0fdf4', padding: 12, borderRadius: 8, fontSize: 13, color: '#166534' }}>
                                    <strong>Response:</strong> {req.responseMessage}
                                </div>
                            )}
                            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 8 }}>
                                {new Date(req.createdAt).toLocaleString()}
                            </div>
                        </div>
                    ))
                )}

                <Link to="/patient/appointments" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 16, color: '#0ea5e9', textDecoration: 'none', fontWeight: 600 }}>
                    <span className="icon" style={{ fontSize: 18 }}>arrow_back</span> Back to Appointments
                </Link>
            </div>
        </div>
    )
}