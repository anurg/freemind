import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import withAuth from '../utils/withAuth';
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead, deleteNotification } from '../utils/api';
import { Bell, Check, CheckCircle, Trash2, RefreshCw } from 'lucide-react';

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    isRead: '',
    type: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  // Fetch notifications on mount and when filters change
  useEffect(() => {
    fetchNotifications();
  }, [filters]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await getNotifications(filters);
      setNotifications(response.notifications);
      setLoading(false);
    } catch (err: any) {
      console.error('Error fetching notifications:', err);
      setError(err.message || 'Failed to load notifications');
      setLoading(false);
    }
  };

  // Handle filter changes
  const handleFilterChange = (name: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Mark notification as read
  const handleMarkAsRead = async (id: string) => {
    try {
      await markNotificationAsRead(id);
      setNotifications(prev =>
        prev && prev.map(notification =>
          notification.id === id ? { ...notification, isRead: true } : notification
        )
      );
    } catch (err: any) {
      console.error('Error marking notification as read:', err);
      setError(err.message || 'Failed to mark notification as read');
    }
  };

  // Mark all notifications as read
  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications(prev =>
        prev && prev.map(notification => ({ ...notification, isRead: true }))
      );
    } catch (err: any) {
      console.error('Error marking all notifications as read:', err);
      setError(err.message || 'Failed to mark all notifications as read');
    }
  };

  // Delete notification
  const handleDelete = async (id: string) => {
    try {
      await deleteNotification(id);
      setNotifications(prev =>
        prev.filter(notification => notification.id !== id)
      );
    } catch (err: any) {
      console.error('Error deleting notification:', err);
      setError(err.message || 'Failed to delete notification');
    }
  };

  // Get notification icon based on type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'TASK_ASSIGNED':
      case 'TASK_UPDATED':
        return <Bell className="h-5 w-5 text-blue-500" />;
      case 'TASK_COMPLETED':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'COMMENT_ADDED':
        return <Bell className="h-5 w-5 text-purple-500" />;
      case 'DUE_DATE_REMINDER':
        return <Bell className="h-5 w-5 text-yellow-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <div className="flex space-x-2">
            <button
              onClick={fetchNotifications}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </button>
            <button
              onClick={handleMarkAllAsRead}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              <Check className="h-4 w-4 mr-2" />
              Mark All as Read
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white shadow rounded-lg p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label htmlFor="isReadFilter" className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                id="isReadFilter"
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                value={filters.isRead}
                onChange={(e) => handleFilterChange('isRead', e.target.value)}
              >
                <option value="">All Notifications</option>
                <option value="false">Unread</option>
                <option value="true">Read</option>
              </select>
            </div>
            
            <div className="flex-1">
              <label htmlFor="typeFilter" className="block text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <select
                id="typeFilter"
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
              >
                <option value="">All Types</option>
                <option value="TASK_ASSIGNED">Task Assigned</option>
                <option value="TASK_UPDATED">Task Updated</option>
                <option value="TASK_COMPLETED">Task Completed</option>
                <option value="COMMENT_ADDED">Comment Added</option>
                <option value="DUE_DATE_REMINDER">Due Date Reminder</option>
              </select>
            </div>
            
            <div className="flex-1">
              <label htmlFor="sortOrder" className="block text-sm font-medium text-gray-700 mb-1">
                Sort
              </label>
              <select
                id="sortOrder"
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                value={filters.sortOrder}
                onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
              >
                <option value="desc">Newest First</option>
                <option value="asc">Oldest First</option>
              </select>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
            {error}
          </div>
        )}

        {/* Notifications List */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : notifications && notifications.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {notifications && notifications.map((notification) => (
                <li 
                  key={notification.id} 
                  className={`p-4 hover:bg-gray-50 ${!notification.isRead ? 'bg-blue-50' : ''}`}
                >
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium text-gray-900 ${!notification.isRead ? 'font-semibold' : ''}`}>
                        {notification.title}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {notification.message}
                      </p>
                      <div className="mt-2 flex items-center text-xs text-gray-500">
                        <span>{new Date(notification.createdAt).toLocaleString()}</span>
                        {notification.relatedItemId && (
                          <a 
                            href={`/tasks/${notification.relatedItemId}`} 
                            className="ml-2 text-blue-600 hover:text-blue-800"
                          >
                            View Task
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="flex-shrink-0 flex space-x-2">
                      {!notification.isRead && (
                        <button
                          onClick={() => handleMarkAsRead(notification.id)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Mark as read"
                        >
                          <Check className="h-5 w-5" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(notification.id)}
                        className="text-red-600 hover:text-red-800"
                        title="Delete notification"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="py-8 text-center text-gray-500">
              <Bell className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p>No notifications found</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default withAuth(NotificationsPage);
