import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import withAuth from '../../utils/withAuth';
import { getInsights } from '../../utils/api';
import { BarChart2, Activity, Users, Clock } from 'lucide-react';

const Insights = () => {
  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch insights data on mount
  useEffect(() => {
    fetchInsightsData();
  }, []);

  // Fetch insights data
  const fetchInsightsData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get the token from localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found');
        setError('Authentication error. Please log in again.');
        setLoading(false);
        return;
      }
      
      console.log('Fetching insights data...');
      
      // Fetch insights
      const insightsResponse = await getInsights();
      console.log('Insights response:', insightsResponse);
      
      if (!insightsResponse || !insightsResponse.summary) {
        console.error('Invalid insights data format:', insightsResponse);
        setError('Failed to load insights data: Invalid data format');
        setLoading(false);
        return;
      }
      
      setInsights(insightsResponse);
      
      setLoading(false);
    } catch (err: any) {
      console.error('Error fetching insights data:', err);
      setError(`Failed to load insights data: ${err.message || 'Unknown error'}`);
      setLoading(false);
    }
  };

  // Render loading state
  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  // Render error state
  if (error) {
    return (
      <Layout>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
          {error}
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Insights</h1>
          <button 
            onClick={fetchInsightsData}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            disabled={loading}
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Refreshing...
              </>
            ) : 'Refresh Data'}
          </button>
        </div>

        {insights ? (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                      <BarChart2 className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Tasks This Month</dt>
                        <dd className="flex items-center text-3xl font-semibold text-gray-900">
                          <span className="mr-2">{insights?.summary?.tasksThisMonth || 0}</span>
                          {insights?.summary?.tasksThisMonth > 0 && (
                            <span className="text-sm font-normal text-gray-500">
                              ({insights?.summary?.completedTasksThisMonth || 0} completed)
                            </span>
                          )}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                      <Users className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Active Users</dt>
                        <dd className="text-3xl font-semibold text-gray-900">
                          {insights?.userActivity?.activeUsers || 0}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-purple-100 rounded-md p-3">
                      <Clock className="h-6 w-6 text-purple-600" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Overdue Tasks</dt>
                        <dd className="text-3xl font-semibold text-gray-900">
                          {insights?.summary?.overdueTasks || 0}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                      <Activity className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Average Completion Time</dt>
                        <dd className="text-3xl font-semibold text-gray-900">
                          {insights?.summary?.averageCompletionDays || 'N/A'} {insights?.summary?.averageCompletionDays ? 'days' : ''}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                      <Clock className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Tasks Due Soon</dt>
                        <dd className="text-3xl font-semibold text-gray-900">
                          {insights?.summary?.tasksDueSoon || 0}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Task Distribution */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Task Distribution
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Status Distribution */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">By Status</h4>
                    <div className="space-y-2">
                      {insights?.statistics?.byStatus && insights.statistics.byStatus.map((item: any) => (
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
                      {insights?.statistics?.byCategory && insights.statistics.byCategory.map((item: any) => (
                        <div key={item.categoryId || 'uncategorized'}>
                          <div className="flex justify-between text-sm">
                            <span>{item.categoryName || 'Uncategorized'}</span>
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
            </div>
            
            {/* Performance Insights */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Performance Insights
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Top Performers */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Top Performers</h4>
                    <div className="space-y-2">
                      {insights?.performance?.topPerformers && insights.performance.topPerformers.map((user: any, index: number) => (
                        <div key={user.id} className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                              {index + 1}
                            </div>
                            <div className="ml-3">
                              <p className="text-sm font-medium text-gray-900">{user.username}</p>
                              <p className="text-xs text-gray-500">{user.email}</p>
                            </div>
                          </div>
                          <div className="text-sm text-gray-900">
                            {user.completedTasks} tasks
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Task Completion Trend */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Task Completion Trend</h4>
                    <div className="space-y-2">
                      {insights?.taskActivity?.completionTrend && insights.taskActivity.completionTrend.map((item: any) => (
                        <div key={item.period}>
                          <div className="flex justify-between text-sm">
                            <span>{item.period}</span>
                            <span>{item.count} tasks</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full"
                              style={{ width: `${(item.count / Math.max(...insights.taskActivity.completionTrend.map((i: any) => i.count))) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg p-6 text-center text-gray-500">
            No insights data available. This could be due to insufficient task data or you may not have the required permissions.
          </div>
        )}
      </div>
    </Layout>
  );
};

export default withAuth(Insights);
