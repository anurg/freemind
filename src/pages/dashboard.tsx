import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../components/Layout';
import TaskTable from '../components/TaskTable';
import withAuth from '../utils/withAuth';
import { getTasks, getInsights, getCurrentUser } from '../utils/api';
import { 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  BarChart2, 
  PlusCircle,
  List,
  Calendar,
  Activity
} from 'lucide-react';

const Dashboard = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('tasks');
  const [tasks, setTasks] = useState([]);
  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [taskStats, setTaskStats] = useState({
    total: 0,
    completed: 0,
    inProgress: 0,
    pending: 0,
    delayed: 0,
    dueSoon: 0
  });

  // Fetch user and data on mount
  useEffect(() => {
    const currentUser = getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }

    fetchDashboardData();
  }, []);

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch recent tasks
      const tasksResponse = await getTasks({ 
        limit: 5, 
        sortBy: 'updatedAt', 
        sortOrder: 'desc' 
      });
      setTasks(tasksResponse.tasks);
      
      // Calculate task statistics
      const allTasksResponse = await getTasks({ limit: 1000 });
      calculateTaskStats(allTasksResponse.tasks);
      
      // Fetch insights if user is admin or manager
      const currentUser = getCurrentUser();
      if (currentUser && (currentUser.role === 'ADMIN' || currentUser.role === 'MANAGER')) {
        try {
          const insightsResponse = await getInsights();
          setInsights(insightsResponse);
        } catch (err) {
          console.error('Error fetching insights:', err);
        }
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
      setLoading(false);
    }
  };

  // Calculate task statistics
  const calculateTaskStats = (tasks: any[]) => {
    const now = new Date();
    const nextWeek = new Date(now);
    nextWeek.setDate(now.getDate() + 7);
    
    const stats = {
      total: tasks.length,
      completed: 0,
      inProgress: 0,
      pending: 0,
      delayed: 0,
      dueSoon: 0
    };
    
    tasks.forEach(task => {
      // Count by status
      if (task.status === 'COMPLETED') stats.completed++;
      else if (task.status === 'IN_PROGRESS') stats.inProgress++;
      else if (task.status === 'PENDING') stats.pending++;
      else if (task.status === 'DELAYED') stats.delayed++;
      
      // Count tasks due soon (in the next 7 days)
      if (
        task.dueDate && 
        new Date(task.dueDate) >= now && 
        new Date(task.dueDate) <= nextWeek &&
        task.status !== 'COMPLETED'
      ) {
        stats.dueSoon++;
      }
    });
    
    setTaskStats(stats);
  };

  // Navigate to create task page
  const handleCreateTask = () => {
    router.push('/tasks/create');
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
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <button
            onClick={handleCreateTask}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Create Task
          </button>
        </div>

        {/* Task Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                  <List className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Tasks</dt>
                    <dd className="text-3xl font-semibold text-gray-900">{taskStats.total}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Completed</dt>
                    <dd className="text-3xl font-semibold text-gray-900">{taskStats.completed}</dd>
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
                    <dt className="text-sm font-medium text-gray-500 truncate">In Progress</dt>
                    <dd className="text-3xl font-semibold text-gray-900">{taskStats.inProgress}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-gray-100 rounded-md p-3">
                  <Clock className="h-6 w-6 text-gray-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Pending</dt>
                    <dd className="text-3xl font-semibold text-gray-900">{taskStats.pending}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-red-100 rounded-md p-3">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Delayed</dt>
                    <dd className="text-3xl font-semibold text-gray-900">{taskStats.delayed}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-yellow-100 rounded-md p-3">
                  <Calendar className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Due Soon</dt>
                    <dd className="text-3xl font-semibold text-gray-900">{taskStats.dueSoon}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('tasks')}
              className={`${
                activeTab === 'tasks'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Recent Tasks
            </button>
            
            {user && (user.role === 'ADMIN' || user.role === 'MANAGER') && (
              <button
                onClick={() => setActiveTab('insights')}
                className={`${
                  activeTab === 'insights'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Insights
              </button>
            )}
          </nav>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'tasks' && (
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Tasks</h3>
                <Link href="/tasks" className="text-sm text-blue-600 hover:text-blue-800">
                  View All
                </Link>
              </div>
              <div className="border-t border-gray-200">
                {tasks.length > 0 ? (
                  <TaskTable tasks={tasks} />
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    No tasks found. Create your first task to get started.
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'insights' && insights && (
            <div className="space-y-6">
              {/* Summary Cards */}
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
                        {insights?.taskDistribution?.byStatus && insights.taskDistribution.byStatus.map((item: any) => (
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
                        {insights?.taskDistribution?.byCategory && insights.taskDistribution.byCategory.map((item: any) => (
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
              </div>
              
              {/* Performance Insights */}
              <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    Performance Insights
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Average Completion Time */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-2">Average Completion Time</h4>
                      <p className="text-3xl font-semibold text-gray-900">
                        {insights?.performance?.averageCompletionDays} days
                      </p>
                    </div>
                    
                    {/* Top Performers */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-2">Top Performers</h4>
                      {insights?.performance?.topPerformers && insights.performance.topPerformers.map((performer: any) => (
                        <div key={performer.userId} className="py-2 flex justify-between">
                          <span>{performer.user.username}</span>
                          <span className="font-medium">{performer.completedTasks} tasks</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Recommendations */}
              <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    Recommendations
                  </h3>
                  
                  <div className="space-y-4">
                    {insights?.recommendations && insights.recommendations.map((rec: any, index: number) => (
                      <div 
                        key={index} 
                        className={`p-4 rounded-lg ${
                          rec.type === 'success' ? 'bg-green-50 text-green-700' :
                          rec.type === 'warning' ? 'bg-yellow-50 text-yellow-700' :
                          rec.type === 'danger' ? 'bg-red-50 text-red-700' :
                          'bg-blue-50 text-blue-700'
                        }`}
                      >
                        {rec.message}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default withAuth(Dashboard);
