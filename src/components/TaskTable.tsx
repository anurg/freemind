import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { ChevronUp, ChevronDown, Search, X } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  categoryId?: string;
  category_rel?: {
    id: string;
    name: string;
    description?: string;
  } | null;
  priority: string;
  completionPercentage: number;
  dueDate?: string;
  assignedTo?: {
    id: string;
    username: string;
  };
  createdBy?: {
    id: string;
    username: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

interface TaskTableProps {
  tasks: Task[];
  loading: boolean;
}

const TaskTable: React.FC<TaskTableProps> = ({ tasks, loading }) => {
  const router = useRouter();
  const [sortField, setSortField] = useState<string>('updatedAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);

  // Update filtered tasks when tasks, search term, or sorting changes
  useEffect(() => {
    let filtered = [...tasks];
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(task => {
        const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (task.assignedTo?.username.toLowerCase().includes(searchTerm.toLowerCase()) || false);
        return matchesSearch;
      });
    }
    
    // Apply sorting
    const sorted = filtered.sort((a, b) => {
      let aValue, bValue;
      
      // Special handling for nested fields
      if (sortField === 'category_rel') {
        aValue = a.category_rel?.name || '';
        bValue = b.category_rel?.name || '';
      } else if (sortField === 'assignedTo') {
        aValue = a.assignedTo?.username || '';
        bValue = b.assignedTo?.username || '';
      } else {
        // @ts-ignore
        aValue = a[sortField] || '';
        // @ts-ignore
        bValue = b[sortField] || '';
      }
      
      // Handle date fields
      if (sortField === 'dueDate' || sortField === 'createdAt' || sortField === 'updatedAt') {
        aValue = aValue ? new Date(aValue).getTime() : 0;
        bValue = bValue ? new Date(bValue).getTime() : 0;
      }
      
      // Handle string comparison
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      // Handle number comparison
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    });
    
    setFilteredTasks(sorted);
  }, [tasks, searchTerm, sortField, sortDirection]);

  // Handle sort change
  const handleSort = (field: string) => {
    if (field === sortField) {
      // Toggle sort direction if clicking the same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new sort field and default to ascending
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Handle view task
  const handleViewTask = (taskId: string) => {
    router.push(`/tasks/${taskId}`);
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'DELAYED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get sorted tasks
  const sortedTasks = filteredTasks;

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      {/* Search Bar */}
      <div className="p-4 border-b border-gray-200">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
            placeholder="Search tasks by title or assignee..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <button 
                onClick={() => setSearchTerm('')}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Task Table */}
      {loading ? (
        <div className="flex justify-center items-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('title')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Title</span>
                    {sortField === 'title' && (
                      sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('category_rel')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Category</span>
                    {sortField === 'category_rel' && (
                      sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Status</span>
                    {sortField === 'status' && (
                      sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('completionPercentage')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Progress</span>
                    {sortField === 'completionPercentage' && (
                      sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('dueDate')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Due Date</span>
                    {sortField === 'dueDate' && (
                      sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assigned To
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedTasks.length > 0 ? (
                sortedTasks.map((task) => (
                  <tr key={task.id}>
                    <td className="px-6 py-4 whitespace-nowrap">{task.title}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{task.category_rel ? task.category_rel.name : 'Uncategorized'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(task.status)}`}>
                        {task.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className="bg-blue-600 h-2.5 rounded-full" 
                          style={{ width: `${task.completionPercentage}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-500">{task.completionPercentage}%</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {task.assignedTo ? task.assignedTo.username : 'Unassigned'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 hover:text-blue-900">
                      <button 
                        onClick={() => handleViewTask(task.id)}
                        className="hover:underline"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    No tasks found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TaskTable;
