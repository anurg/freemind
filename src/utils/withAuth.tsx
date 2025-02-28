import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { isAuthenticated, getCurrentUser } from './api';

// Higher-order component for route protection
export default function withAuth(WrappedComponent: React.ComponentType<any>, allowedRoles: string[] = []) {
  return function WithAuth(props: any) {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [authorized, setAuthorized] = useState(false);

    useEffect(() => {
      // Check if user is authenticated
      const checkAuth = () => {
        if (!isAuthenticated()) {
          // Redirect to login if not authenticated
          router.push({
            pathname: '/login',
            query: { returnUrl: router.asPath },
          });
          return false;
        }

        // If roles are specified, check if user has required role
        if (allowedRoles.length > 0) {
          const user = getCurrentUser();
          if (!user || !allowedRoles.includes(user.role)) {
            // Redirect to dashboard if authenticated but not authorized
            router.push('/dashboard');
            return false;
          }
        }

        return true;
      };

      // Check authentication on initial load
      const auth = checkAuth();
      setAuthorized(auth);
      setLoading(false);

      // Set up event listener for route changes
      const handleRouteChange = () => {
        setAuthorized(checkAuth());
      };

      // Listen for route changes
      router.events.on('routeChangeComplete', handleRouteChange);

      // Clean up event listener
      return () => {
        router.events.off('routeChangeComplete', handleRouteChange);
      };
    }, [router]);

    // Show loading state while checking authentication
    if (loading) {
      return (
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    // Render component if authorized
    return authorized ? <WrappedComponent {...props} /> : null;
  };
}
