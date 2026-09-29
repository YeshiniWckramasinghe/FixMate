import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Guards a route: requires login, and optionally a specific role.
export default function ProtectedRoute({ role, children }) {
  const { user, token } = useAuth();

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (role && user.role !== role) {
    return <Navigate to="/" replace />;
  }

  return children;
}
