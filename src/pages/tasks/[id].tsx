import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import TaskDetail from '../../components/TaskDetail';
import TaskForm from '../../components/TaskForm';
import withAuth from '../../utils/withAuth';
import { 
  getTask, 
  deleteTask, 
  getCurrentUser, 
  addComment, 
  deleteComment, 
  updateTask,
  expediteTask 
} from '../../utils/api';
import { Edit, Trash2, ArrowLeft } from 'lucide-react';

const TaskDetailPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const [task, setTask] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Fetch task data
  useEffect(() => {
    if (id) {
      fetchTask(id as string);
    }
  }, [id]);

  // Fetch user on mount
  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      setCurrentUser(user);
    }
  }, []);

  const fetchTask = async (taskId: string) => {
    try {
      setLoading(true);
      const taskData = await getTask(taskId);
      setTask(taskData);
      setLoading(false);
    } catch (err: any) {
      console.error('Error fetching task:', err);
      setError(err.message || 'Failed to load task');
      setLoading(false);
    }
  };

  // Handle task deletion
  const handleDelete = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      await deleteTask(id as string);
      router.push('/tasks');
    } catch (err: any) {
      console.error('Error deleting task:', err);
      setError(err.message || 'Failed to delete task');
      setLoading(false);
    }
  };

  // Toggle edit mode
  const toggleEditMode = () => {
    setEditMode(!editMode);
  };

  // Handle successful edit
  const handleEditSuccess = () => {
    setEditMode(false);
    fetchTask(id as string);
  };

  // Handle back navigation
  const handleBack = () => {
    router.push('/tasks');
  };

  // Handle task update
  const handleUpdateTask = async (taskId: string, data: any) => {
    try {
      await updateTask(taskId, data);
      await fetchTask(taskId);
    } catch (err: any) {
      console.error('Error updating task:', err);
      setError(err.message || 'Failed to update task');
    }
  };

  // Handle adding a comment
  const handleAddComment = async (taskId: string, content: string) => {
    try {
      await addComment(taskId, content);
      await fetchTask(taskId);
    } catch (err: any) {
      console.error('Error adding comment:', err);
      setError(err.message || 'Failed to add comment');
    }
  };

  // Handle deleting a comment
  const handleDeleteComment = async (commentId: string) => {
    try {
      await deleteComment(commentId);
      await fetchTask(id as string);
    } catch (err: any) {
      console.error('Error deleting comment:', err);
      setError(err.message || 'Failed to delete comment');
    }
  };

  // Handle expediting a task
  const handleExpediteTask = async (taskId: string, message: string) => {
    try {
      await expediteTask(taskId, message);
      await fetchTask(taskId);
      // Show success message
      alert('Task expedite request sent successfully');
    } catch (err: any) {
      console.error('Error expediting task:', err);
      setError(err.message || 'Failed to expedite task');
    }
  };

  // Check if user can edit/delete the task
  const canManageTask = () => {
    if (!currentUser || !task) return false;
    
    return (
      currentUser.role === 'ADMIN' ||
      currentUser.role === 'MANAGER' ||
      currentUser.id === task.createdById
    );
  };

  // Check if user can delete the task (admin only)
  const canDeleteTask = () => {
    if (!currentUser || !task) return false;
    return currentUser.role === 'ADMIN';
  };

  if (loading && !task) {
    return (
      <Layout>
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
          {error}
          <div className="mt-4">
            <button
              onClick={handleBack}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Tasks
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleBack}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </button>
            <h1 className="text-2xl font-bold text-gray-900">
              {editMode ? 'Edit Task' : 'Task Details'}
            </h1>
          </div>
          
          {!editMode && canManageTask() && (
            <div className="flex space-x-2">
              <button
                onClick={toggleEditMode}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </button>
              
              {deleteConfirm ? (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-red-600">Are you sure?</span>
                  <button
                    onClick={handleDelete}
                    className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                  >
                    Yes, Delete
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(false)}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                canDeleteTask() && (
                  <button
                    onClick={() => setDeleteConfirm(true)}
                    className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </button>
                )
              )}
            </div>
          )}
        </div>

        {/* Task Content */}
        {editMode ? (
          <TaskForm taskId={id as string} onSuccess={handleEditSuccess} />
        ) : (
          task && currentUser && (
            <TaskDetail 
              task={task} 
              currentUser={currentUser}
              onUpdate={handleUpdateTask}
              onAddComment={handleAddComment}
              onDeleteComment={handleDeleteComment}
              onExpedite={handleExpediteTask}
              onClose={handleBack}
            />
          )
        )}
      </div>
    </Layout>
  );
};

export default withAuth(TaskDetailPage);
