import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import TaskTable from '../../components/TaskTable';
import withAuth from '../../utils/withAuth';
import { getTasks, getCurrentUser } from '../../utils/api';
import { PlusCircle, Filter, RefreshCw, Download, FileText } from 'lucide-react';
import { exportTasksToCSV, exportTasksToExcel, exportTasksToPDF } from '../../utils/exportUtils';

const TasksPage = () => {
  const router = useRouter();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    assignedToId: '',
    priority: '',
    sortBy: 'updatedAt',
    sortOrder: 'desc',
    page: 1,
    limit: 10
  });
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 0,
    currentPage: 1
  });

  // Fetch user on mount
  useEffect(() => {
    const currentUser = getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }
  }, []);

  // Fetch tasks when filters change
  useEffect(() => {
    fetchTasks();
  }, [filters]);

  // Fetch tasks from API
  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await getTasks(filters);
      setTasks(response.tasks);
      setPagination({
        total: response.pagination.total,
        totalPages: response.pagination.totalPages,
        currentPage: response.pagination.currentPage
      });
      setLoading(false);
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError('Failed to load tasks');
      setLoading(false);
    }
  };

  // Handle filter changes
  const handleFilterChange = (name: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [name]: value,
      page: 1 // Reset to first page when filters change
    }));
  };

  // Handle page change
  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    
    setFilters(prev => ({
      ...prev,
      page: newPage
    }));
  };

  // Navigate to create task page
  const handleCreateTask = () => {
    router.push('/tasks/create');
  };

  // Refresh tasks
  const handleRefresh = () => {
    fetchTasks();
  };

  // Toggle export options dropdown
  const toggleExportOptions = () => {
    setShowExportOptions(!showExportOptions);
  };

  // Handle exports
  const handleExportCSV = () => {
    exportTasksToCSV(tasks);
    setShowExportOptions(false);
  };

  const handleExportExcel = () => {
    exportTasksToExcel(tasks);
    setShowExportOptions(false);
  };

  const handleExportPDF = async () => {
    try {
      await exportTasksToPDF(tasks, filters);
      setShowExportOptions(false);
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      setError('Failed to export tasks as PDF. Please try again.');
      setTimeout(() => setError(null), 5000); // Clear error after 5 seconds
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
          <div className="flex space-x-2">
            <button
              onClick={handleRefresh}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </button>

            {/* Export Dropdown */}
            <div className="relative">
              <button
                onClick={toggleExportOptions}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </button>
              
              {showExportOptions && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                  <div className="py-1">
                    <button
                      onClick={handleExportCSV}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Export as CSV
                    </button>
                    <button
                      onClick={handleExportExcel}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Export as Excel
                    </button>
                    <button
                      onClick={handleExportPDF}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Export as PDF
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={handleCreateTask}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Create Task
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white shadow rounded-lg p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label htmlFor="statusFilter" className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Filter className="h-4 w-4 text-gray-400" />
                </div>
                <select
                  id="statusFilter"
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none w-full"
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  <option value="">All Statuses</option>
                  <option value="PENDING">Pending</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="DELAYED">Delayed</option>
                </select>
              </div>
            </div>
            
            <div className="flex-1">
              <label htmlFor="priorityFilter" className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Filter className="h-4 w-4 text-gray-400" />
                </div>
                <select
                  id="priorityFilter"
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none w-full"
                  value={filters.priority}
                  onChange={(e) => handleFilterChange('priority', e.target.value)}
                >
                  <option value="">All Priorities</option>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>
            </div>
            
            <div className="flex-1">
              <label htmlFor="sortBy" className="block text-sm font-medium text-gray-700 mb-1">
                Sort By
              </label>
              <div className="flex space-x-2">
                <select
                  id="sortBy"
                  className="py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none w-full"
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                >
                  <option value="updatedAt">Last Updated</option>
                  <option value="createdAt">Created Date</option>
                  <option value="dueDate">Due Date</option>
                  <option value="title">Title</option>
                  <option value="priority">Priority</option>
                  <option value="status">Status</option>
                </select>
                
                <select
                  id="sortOrder"
                  className="py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                  value={filters.sortOrder}
                  onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                >
                  <option value="asc">Ascending</option>
                  <option value="desc">Descending</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
            {error}
          </div>
        )}

        {/* Task Table */}
        <TaskTable tasks={tasks} loading={loading} />

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex justify-center mt-4">
            <nav className="inline-flex rounded-md shadow">
              <button
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
                className="px-3 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="px-3 py-2 border-t border-b border-gray-300 bg-white text-sm font-medium text-gray-700">
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>
              <button
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage === pagination.totalPages}
                className="px-3 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </nav>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default withAuth(TasksPage);
