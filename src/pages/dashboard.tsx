import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../components/Layout';
import TaskTable from '../components/TaskTable';
import withAuth from '../utils/withAuth';
import { getTasks, getCurrentUser } from '../utils/api';
import { 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  PlusCircle,
  List,
  Calendar,
  Activity
} from 'lucide-react';

const Dashboard = () => {
  const router = useRouter();
  const [tasks, setTasks] = useState([]);
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
      setError(null);
      
      // Get the token from localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found');
        setError('Authentication error. Please log in again.');
        setLoading(false);
        return;
      }
      
      // Fetch recent tasks
      const tasksResponse = await getTasks({ 
        limit: 5, 
        sortBy: 'updatedAt', 
        sortOrder: 'desc' 
      });
      
      console.log('Tasks loaded:', tasksResponse.tasks);
      setTasks(tasksResponse.tasks);
      
      // Calculate task statistics
      const allTasksResponse = await getTasks({ limit: 1000 });
      console.log('All tasks loaded for stats:', allTasksResponse.tasks.length);
      calculateTaskStats(allTasksResponse.tasks);
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data. Please try refreshing the page.');
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

        {/* Recent Tasks */}
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
      </div>
    </Layout>
  );
};

export default withAuth(Dashboard);
