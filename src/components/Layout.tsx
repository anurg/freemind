import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { 
  LogOut, 
  User, 
  Bell, 
  Menu, 
  X, 
  Home, 
  Users, 
  BarChart2, 
  Settings,
  List,
  Server
} from 'lucide-react';
import { logout, getCurrentUser, getNotifications } from '../utils/api';
import Notifications from './Notifications';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Get current user on mount
  useEffect(() => {
    const currentUser = getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }
  }, []);

  // Fetch unread notifications count
  useEffect(() => {
    if (!user) return;

    const fetchUnreadCount = async () => {
      try {
        const response = await getNotifications({ unreadOnly: true, limit: 1 });
        setUnreadCount(response.pagination.total);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    fetchUnreadCount();
    
    // Set up interval to check for new notifications
    const interval = setInterval(fetchUnreadCount, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, [user]);

  // Handle logout
  const handleLogout = () => {
    logout();
  };

  // Handle notification view
  const handleViewTask = (taskId: string) => {
    setNotificationsOpen(false);
    router.push(`/tasks/${taskId}`);
  };

  // Check if the current route is active
  const isActive = (path: string) => {
    return router.pathname === path || router.pathname.startsWith(`${path}/`);
  };

  // Navigation items based on user role
  const getNavItems = () => {
    const baseNavItems = [
      { 
        path: '/dashboard', 
        label: 'Dashboard', 
        icon: <Home className="h-5 w-5" /> 
      },
      { 
        path: '/tasks', 
        label: 'Tasks', 
        icon: <List className="h-5 w-5" /> 
      },
      { 
        path: '/insights', 
        label: 'Insights', 
        icon: <BarChart2 className="h-5 w-5" /> 
      },
      { 
        path: '/settings', 
        label: 'Settings', 
        icon: <Settings className="h-5 w-5" /> 
      }
    ];

    const adminNavItems = [
      { 
        path: '/users', 
        label: 'Users', 
        icon: <Users className="h-5 w-5" /> 
      }
    ];

    const items = [...baseNavItems];

    // Add admin only items
    if (user && user.role === 'ADMIN') {
      items.push(...adminNavItems);
      // Admin settings are now integrated into the main settings page
    }

    return items;
  };

  // Skip layout on login page
  if (router.pathname === '/login') {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo and mobile menu button */}
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link href="/dashboard" className="text-xl font-bold text-blue-600">
                  FreeMind
                </Link>
              </div>
              
              {/* Mobile menu button */}
              <div className="md:hidden flex items-center ml-4">
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="text-gray-500 hover:text-gray-700 focus:outline-none"
                >
                  {mobileMenuOpen ? (
                    <X className="h-6 w-6" />
                  ) : (
                    <Menu className="h-6 w-6" />
                  )}
                </button>
              </div>
            </div>

            {/* Desktop navigation */}
            <nav className="hidden md:flex space-x-8">
              {getNavItems().map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    isActive(item.path)
                      ? 'border-blue-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* User menu and notifications */}
            <div className="flex items-center">
              {/* Notifications */}
              <div className="relative ml-3">
                <button
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className="p-1 rounded-full text-gray-500 hover:text-gray-700 focus:outline-none"
                >
                  <Bell className="h-6 w-6" />
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 block h-4 w-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications dropdown */}
                {notificationsOpen && (
                  <div className="origin-top-right absolute right-0 mt-2 w-80 sm:w-96 z-50">
                    <Notifications 
                      onViewTask={handleViewTask} 
                      onClose={() => setNotificationsOpen(false)} 
                    />
                  </div>
                )}
              </div>

              {/* User menu */}
              <div className="ml-3 relative">
                <div className="flex items-center">
                  <div className="flex flex-col items-end">
                    <span className="text-sm font-medium text-gray-700">
                      {user?.username}
                    </span>
                    <span className="text-xs text-gray-500">
                      {user?.role}
                    </span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="ml-3 p-1 rounded-full text-gray-500 hover:text-gray-700 focus:outline-none"
                    title="Logout"
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white shadow-lg">
          <div className="pt-2 pb-3 space-y-1">
            {getNavItems().map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center px-4 py-2 text-base font-medium ${
                  isActive(item.path)
                    ? 'bg-blue-50 border-l-4 border-blue-500 text-blue-700'
                    : 'border-l-4 border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="mr-3">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500">
            &copy; {new Date().getFullYear()} FreeMind Task Tracker. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
