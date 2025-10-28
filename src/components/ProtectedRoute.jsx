import { Navigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { authService } from '../lib/api';

// This component protects routes that require authentication
function ProtectedRoute({ children }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');

      if (!token) {
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }

      try {
        const response = await authService.getCurrentUser();
        setIsAuthenticated(true);
        setIsLoading(false);
      } catch (error) {
        localStorage.removeItem('token');
        setIsAuthenticated(false);
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);
  
  if (isLoading) {
    // Show loading spinner or message while checking auth status
    return <div className="text-center py-5">Loading...</div>;
  }
  
  if (!isAuthenticated) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // Removed admin role check - any authenticated user can access admin panel
  
  // Render the protected route if authenticated and has required role
  return children;
}

export default ProtectedRoute;