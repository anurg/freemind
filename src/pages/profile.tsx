import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import withAuth from '../utils/withAuth';
import { getCurrentUserProfile, updateUser, getUserInsights } from '../utils/api';
import { AlertTriangle, Save, User, BarChart2, Activity, CheckCircle, Clock } from 'lucide-react';

const ProfilePage = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [insights, setInsights] = useState<any>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Fetch user profile on mount
  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const userData = await getCurrentUserProfile();
      setUser(userData);
      setFormData({
        username: userData.username,
        email: userData.email,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setLoading(false);
    } catch (err: any) {
      console.error('Error fetching user profile:', err);
      setError(err.message || 'Failed to load user profile');
      setLoading(false);
    }
  };

  // Fetch user insights
  const fetchUserInsights = async () => {
    if (!user) return;
    
    try {
      setInsightsLoading(true);
      const insightsData = await getUserInsights(user.id);
      setInsights(insightsData);
      setInsightsLoading(false);
    } catch (err: any) {
      console.error('Error fetching user insights:', err);
      setInsightsLoading(false);
    }
  };

  // Load insights when tab changes to insights
  useEffect(() => {
    if (activeTab === 'insights' && user && !insights) {
      fetchUserInsights();
    }
  }, [activeTab, user]);

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Reset messages
      setError(null);
      setSuccess(null);
      
      // Validate passwords
      if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
        setError('New passwords do not match');
        return;
      }
      
      if (formData.newPassword && !formData.currentPassword) {
        setError('Current password is required to set a new password');
        return;
      }
      
      // Prepare update data
      const updateData: any = {
        username: formData.username,
        email: formData.email
      };
      
      // Only include password fields if changing password
      if (formData.newPassword) {
        updateData.currentPassword = formData.currentPassword;
        updateData.password = formData.newPassword;
      }
      
      setSaving(true);
      await updateUser(user.id, updateData);
      
      // Clear password fields
      setFormData({
        ...formData,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      setSuccess('Profile updated successfully');
      setSaving(false);
      
      // Refresh user data
      fetchUserProfile();
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError(err.message || 'Failed to update profile');
      setSaving(false);
    }
  };

  if (loading && !user) {
    return (
      <Layout>
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        
        {/* User header */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0 h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <User className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">{user?.username}</h3>
                <p className="text-sm text-gray-500">{user?.email}</p>
              </div>
            </div>
          </div>
          
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-4">
              <button
                onClick={() => setActiveTab('profile')}
                className={`${
                  activeTab === 'profile'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Profile Settings
              </button>
              
              <button
                onClick={() => setActiveTab('insights')}
                className={`${
                  activeTab === 'insights'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
              >
                <BarChart2 className="h-4 w-4 mr-2" />
                My Insights
              </button>
            </nav>
          </div>
          
          {/* Tab Content */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSubmit} className="px-4 py-5 sm:p-6">
              {/* Success message */}
              {success && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-md">
                  {success}
                </div>
              )}
              
              {/* Error message */}
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md flex items-start">
                  <AlertTriangle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {/* Username */}
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                    Username
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      name="username"
                      id="username"
                      value={formData.username}
                      onChange={handleChange}
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      required
                    />
                  </div>
                </div>
                
                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <div className="mt-1">
                    <input
                      type="email"
                      name="email"
                      id="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      required
                    />
                  </div>
                </div>
                
                {/* Current Password */}
                <div className="sm:col-span-2">
                  <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
                    Current Password
                  </label>
                  <div className="mt-1">
                    <input
                      type="password"
                      name="currentPassword"
                      id="currentPassword"
                      value={formData.currentPassword}
                      onChange={handleChange}
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    />
                    <p className="mt-1 text-xs text-gray-500">Required only if changing password</p>
                  </div>
                </div>
                
                {/* New Password */}
                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                    New Password
                  </label>
                  <div className="mt-1">
                    <input
                      type="password"
                      name="newPassword"
                      id="newPassword"
                      value={formData.newPassword}
                      onChange={handleChange}
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                </div>
                
                {/* Confirm Password */}
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                    Confirm New Password
                  </label>
                  <div className="mt-1">
                    <input
                      type="password"
                      name="confirmPassword"
                      id="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
          
          {activeTab === 'insights' && (
            <div className="px-4 py-5 sm:p-6">
              {insightsLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : insights ? (
                <div className="space-y-6">
                  {/* Task Statistics */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Task Statistics</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 bg-blue-100 rounded-md p-2">
                            <Activity className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-500">Total Tasks</p>
                            <p className="text-2xl font-semibold text-gray-900">{insights.taskStats.total}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 bg-green-100 rounded-md p-2">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-500">Completed Tasks</p>
                            <p className="text-2xl font-semibold text-gray-900">
                              {insights.performance.totalCompletedTasks}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 bg-purple-100 rounded-md p-2">
                            <Clock className="h-5 w-5 text-purple-600" />
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-500">Avg. Completion Time</p>
                            <p className="text-2xl font-semibold text-gray-900">
                              {insights.performance.averageCompletionDays} days
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Task Distribution */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Task Distribution</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Status Distribution */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-2">By Status</h4>
                        <div className="space-y-2">
                          {insights.taskStats.byStatus.map((item: any) => (
                            <div key={item.status}>
                              <div className="flex justify-between text-sm">
                                <span>{item.status.replace('_', ' ')}</span>
                                <span>{item.percentage}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full ${
                                    item.status === 'COMPLETED' ? 'bg-green-500' :
                                    item.status === 'IN_PROGRESS' ? 'bg-blue-500' :
                                    item.status === 'DELAYED' ? 'bg-red-500' :
                                    'bg-gray-500'
                                  }`}
                                  style={{ width: `${item.percentage}%` }}
                                ></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {/* Category Distribution */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-2">By Category</h4>
                        <div className="space-y-2">
                          {insights.taskStats.byCategory.map((item: any) => (
                            <div key={item.category}>
                              <div className="flex justify-between text-sm">
                                <span>{item.category}</span>
                                <span>{item.percentage}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-indigo-500 h-2 rounded-full"
                                  style={{ width: `${item.percentage}%` }}
                                ></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Recent Activity */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-2">Completed Tasks (Last 30 Days)</h4>
                      <p className="text-3xl font-semibold text-gray-900">
                        {insights.performance.completedTasksLast30Days}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  No insights data available. This could be due to insufficient task data.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default withAuth(ProfilePage);
