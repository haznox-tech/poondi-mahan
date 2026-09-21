import { Navigate } from 'react-router-dom';
import { useAdminAuth } from './AdminAuthContext.jsx';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAdminAuth();
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }
  return children;
}
