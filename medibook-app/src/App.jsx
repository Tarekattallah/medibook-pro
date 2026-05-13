import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ToastProvider } from './components/ui/Toast'

// Public
import LandingPage        from './pages/public/LandingPage'
import LoginPage          from './pages/public/LoginPage'
import RegisterPage       from './pages/public/RegisterPage'
import SearchPage         from './pages/public/SearchPage'
import DoctorProfilePage  from './pages/public/DoctorProfilePage'
import BookingPage        from './pages/public/BookingPage'
import BookingSuccessPage from './pages/public/BookingSuccessPage'
import ForgotPasswordPage from './pages/public/ForgotPasswordPage'
import ResetPasswordPage  from './pages/public/ResetPasswordPage'
import NotFoundPage       from './pages/public/NotFoundPage'

// Patient
import PatientDashboard    from './pages/patient/PatientDashboard'
import AppointmentsPage    from './pages/patient/AppointmentsPage'
import MedicalRecordsPage  from './pages/patient/MedicalRecordsPage'
import ProfileSettingsPage from './pages/patient/ProfileSettingsPage'

// Doctor
import DoctorDashboard      from './pages/doctor/DoctorDashboard'
import DoctorOnboardingPage from './pages/doctor/DoctorOnboardingPage'
import DoctorSchedulePage   from './pages/doctor/DoctorSchedulePage'

// Admin
import AdminDashboard        from './pages/admin/AdminDashboard'
import AdminUsersPage        from './pages/admin/AdminUsersPage'
import AdminAnalyticsPage    from './pages/admin/AdminAnalyticsPage'
import AdminAppointmentsPage from './pages/admin/AdminAppointmentsPage'

// Shared
import NotificationsPage from './pages/shared/NotificationsPage'

function Guard({ children, roles }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace/>
  if (roles && !roles.includes(user.role)) {
    if (user.role === 'admin')  return <Navigate to="/admin" replace/>
    if (user.role === 'doctor') return <Navigate to="/doctor/dashboard" replace/>
    return <Navigate to="/patient/dashboard" replace/>
  }
  return children
}

function AppRoutes() {
  const { user } = useAuth()
  const afterLogin = user?.role === 'admin'  ? '/admin'
    : user?.role === 'doctor' ? '/doctor/dashboard'
    : '/patient/dashboard'

  return (
    <Routes>
      {/* Public — no auth needed */}
      <Route path="/"                        element={<LandingPage/>}/>
      <Route path="/search"                  element={<SearchPage/>}/>
      <Route path="/doctor/:id"              element={<DoctorProfilePage/>}/>
      <Route path="/booking-success"         element={<BookingSuccessPage/>}/>
      <Route path="/forgot-password"         element={<ForgotPasswordPage/>}/>
      <Route path="/reset-password/:token"   element={<ResetPasswordPage/>}/>

      {/* Auth — redirect if already logged in */}
      <Route path="/login"    element={user ? <Navigate to={afterLogin} replace/> : <LoginPage/>}/>
      <Route path="/register" element={user ? <Navigate to={afterLogin} replace/> : <RegisterPage/>}/>

      {/* Booking — patients only */}
      <Route path="/book/:id" element={<Guard roles={['patient']}><BookingPage/></Guard>}/>

      {/* Shared — any authenticated user */}
      <Route path="/notifications" element={<Guard roles={['patient','doctor','admin']}><NotificationsPage/></Guard>}/>
      <Route path="/settings"      element={<Guard roles={['patient','doctor','admin']}><ProfileSettingsPage/></Guard>}/>

      {/* Patient */}
      <Route path="/patient/dashboard"    element={<Guard roles={['patient']}><PatientDashboard/></Guard>}/>
      <Route path="/patient/appointments" element={<Guard roles={['patient']}><AppointmentsPage/></Guard>}/>
      <Route path="/patient/records"      element={<Guard roles={['patient']}><MedicalRecordsPage/></Guard>}/>

      {/* Doctor */}
      <Route path="/doctor/dashboard"  element={<Guard roles={['doctor']}><DoctorDashboard/></Guard>}/>
      <Route path="/doctor/onboarding" element={<Guard roles={['doctor']}><DoctorOnboardingPage/></Guard>}/>
      <Route path="/doctor/schedule"   element={<Guard roles={['doctor']}><DoctorSchedulePage/></Guard>}/>

      {/* Admin */}
      <Route path="/admin"              element={<Guard roles={['admin']}><AdminDashboard/></Guard>}/>
      <Route path="/admin/users"        element={<Guard roles={['admin']}><AdminUsersPage/></Guard>}/>
      <Route path="/admin/appointments" element={<Guard roles={['admin']}><AdminAppointmentsPage/></Guard>}/>
      <Route path="/admin/analytics"    element={<Guard roles={['admin']}><AdminAnalyticsPage/></Guard>}/>

      {/* 404 */}
      <Route path="*" element={<NotFoundPage/>}/>
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <AppRoutes/>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  )
}
