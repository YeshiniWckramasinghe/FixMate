import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CustomerServices from './pages/CustomerServices';
import CustomerBookings from './pages/CustomerBookings';
import ProviderServices from './pages/ProviderServices';
import ProviderBookings from './pages/ProviderBookings';
import AdminDashboard from './pages/AdminDashboard';
import AdminUsers from './pages/AdminUsers';
import AdminBookings from './pages/AdminBookings';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';

const HOME_BY_ROLE = {
  CUSTOMER: '/services',
  PROVIDER: '/provider/services',
  ADMIN: '/admin/dashboard',
};

function RoleHome() {
  const { user, token } = useAuth();
  if (!token || !user) return <Navigate to="/login" replace />;
  return <Navigate to={HOME_BY_ROLE[user.role] || '/login'} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          <Route
            path="/services"
            element={
              <ProtectedRoute role="CUSTOMER">
                <CustomerServices />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-bookings"
            element={
              <ProtectedRoute role="CUSTOMER">
                <CustomerBookings />
              </ProtectedRoute>
            }
          />

          <Route
            path="/provider/services"
            element={
              <ProtectedRoute role="PROVIDER">
                <ProviderServices />
              </ProtectedRoute>
            }
          />
          <Route
            path="/provider/bookings"
            element={
              <ProtectedRoute role="PROVIDER">
                <ProviderBookings />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute role="ADMIN">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute role="ADMIN">
                <AdminUsers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/bookings"
            element={
              <ProtectedRoute role="ADMIN">
                <AdminBookings />
              </ProtectedRoute>
            }
          />

          <Route path="/" element={<RoleHome />} />
          <Route path="*" element={<RoleHome />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
