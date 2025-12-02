import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'wouter';
import { useEffect } from 'react';

interface AdminRouteProps {
  children: React.ReactNode;
}

/**
 * Protected route component that only allows admin users
 * Redirects non-admin users to the dashboard
 */
export function AdminRoute({ children }: AdminRouteProps) {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation('/login');
    } else if (!isLoading && isAuthenticated && !isAdmin) {
      setLocation('/dashboard');
    }
  }, [isAuthenticated, isAdmin, isLoading, setLocation]);

  // Wait for auth check to complete
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Don't render if not authenticated or not admin (redirect will happen)
  if (!isAuthenticated || !isAdmin) {
    return null;
  }

  // Render children if admin
  return <>{children}</>;
}

