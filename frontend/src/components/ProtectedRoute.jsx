import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Route guard. `requireAdmin` restricts a route to admins only.
export default function ProtectedRoute({ children, requireAdmin = false }) {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="page-loader">
        <span className="spinner" />
      </div>
    );
  }

  // Not signed in -> back to the single login page.
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  // Admin-only page reached by a normal user -> send them to their home.
  if (requireAdmin && !isAdmin) return <Navigate to="/" replace />;

  return children;
}
