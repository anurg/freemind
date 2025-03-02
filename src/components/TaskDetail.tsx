import React, { useState, useEffect } from 'react';
import { Task, User, Comment, ProgressHistory } from '@prisma/client';
import { 
  Calendar, 
  Clock, 
  MessageSquare, 
  User as UserIcon, 
  CheckCircle, 
  AlertTriangle, 
  BarChart2,
  Send,
  Edit,
  Trash2,
  AlertOctagon
} from 'lucide-react';

type TaskWithRelations = Task & {
  assignedTo: User | null;
  createdBy: User;
  comments: (Comment & {
    user: {
      id: string;
      username: string;
    };
  })[];
  progressHistory: ProgressHistory[];
};

interface TaskDetailProps {
  task: TaskWithRelations;
  currentUser: {
    id: string;
    role: string;
  };
  onUpdate: (taskId: string, data: any) => Promise<void>;
  onAddComment: (taskId: string, content: string) => Promise<void>;
  onDeleteComment: (commentId: string) => Promise<void>;
  onExpedite?: (taskId: string, message: string) => Promise<void>;
  onClose: () => void;
}

const TaskDetail: React.FC<TaskDetailProps> = ({ 
  task, 
  currentUser, 
  onUpdate, 
  onAddComment,
  onDeleteComment,
  onExpedite,
  onClose 
}) => {
  const [comment, setComment] = useState('');
  const [progress, setProgress] = useState(task.completionPercentage);
  const [isEditing, setIsEditing] = useState(false);
  const [showExpediteForm, setShowExpediteForm] = useState(false);
  const [expediteMessage, setExpediteMessage] = useState('');
  const [editData, setEditData] = useState({
    title: task.title,
    description: task.description,
    category: task.category,
    status: task.status,
    dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
  });

  // Format date for display
  const formatDate = (date: Date | null) => {
    if (!date) return 'No due date';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Format time for display
  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800';
      case 'DELAYED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Handle comment submission
  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    
    await onAddComment(task.id, comment);
    setComment('');
  };

  // Handle progress update
  const handleProgressUpdate = async () => {
    if (progress === task.completionPercentage) return;
    
    await onUpdate(task.id, {
      completionPercentage: progress,
      comment: `Progress updated from ${task.completionPercentage}% to ${progress}%`,
    });
  };

  // Handle task edit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onUpdate(task.id, editData);
    setIsEditing(false);
  };

  // Check if user can edit task
  const canEditTask = () => {
    if (!currentUser) return false;
    
    return (
      currentUser.role === 'ADMIN' ||
      currentUser.role === 'MANAGER' ||
      task.createdBy.id === currentUser.id ||
      task.assignedTo?.id === currentUser.id
    );
  };

  // Check if user can delete comment
  const canDeleteComment = (comment: { user: { id: string } }) => {
    if (!currentUser) return false;
    
    return (
      currentUser.role === 'ADMIN' ||
      currentUser.role === 'MANAGER' ||
      comment.user.id === currentUser.id
    );
  };

  // Check if user can expedite the task
  const canExpediteTask = () => {
    return (
      currentUser.role === 'ADMIN' ||
      currentUser.role === 'MANAGER'
    );
  };

  // Handle expedite submission
  const handleExpediteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expediteMessage.trim() || !onExpedite) return;
    
    await onExpedite(task.id, expediteMessage);
    setExpediteMessage('');
    setShowExpediteForm(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
      {/* Header with close button */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">{isEditing ? 'Edit Task' : task.title}</h2>
        <button 
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
        >
          &times;
        </button>
      </div>

      {isEditing ? (
        /* Edit Form */
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Title</label>
            <input
              type="text"
              value={editData.title}
              onChange={(e) => setEditData({ ...editData, title: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={editData.description}
              onChange={(e) => setEditData({ ...editData, description: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              rows={4}
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Category</label>
              <select
                value={editData.category}
                onChange={(e) => setEditData({ ...editData, category: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="DEVELOPMENT">Development</option>
                <option value="DESIGN">Design</option>
                <option value="RESEARCH">Research</option>
                <option value="MARKETING">Marketing</option>
                <option value="OPERATIONS">Operations</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <select
                value={editData.status}
                onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="PENDING">Pending</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="DELAYED">Delayed</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Due Date</label>
              <input
                type="date"
                value={editData.dueDate}
                onChange={(e) => setEditData({ ...editData, dueDate: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              Save Changes
            </button>
          </div>
        </form>
      ) : (
        /* Task Details View */
        <div className="space-y-6">
          {/* Task Info */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">Description</h3>
                <p className="text-gray-600 mt-1">{task.description}</p>
              </div>
              
              <div className="flex items-center">
                <Calendar className="h-5 w-5 text-gray-500 mr-2" />
                <span className="text-gray-700">
                  Due: {formatDate(task.dueDate)}
                </span>
              </div>
              
              <div className="flex items-center">
                <UserIcon className="h-5 w-5 text-gray-500 mr-2" />
                <span className="text-gray-700">
                  Assigned to: {task.assignedTo ? task.assignedTo.username : 'Unassigned'}
                </span>
              </div>
              
              <div className="flex items-center">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                  {task.status.replace('_', ' ')}
                </span>
                <span className="ml-4 text-gray-700">
                  Category: {task.category}
                </span>
              </div>
            </div>
            
            <div className="space-y-4">
              {/* Progress Bar */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <h3 className="text-lg font-semibold">Progress</h3>
                  <span className="text-sm font-medium text-gray-700">{task.completionPercentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full" 
                    style={{ width: `${task.completionPercentage}%` }}
                  ></div>
                </div>
              </div>
              
              {/* Update Progress (if allowed) */}
              {canEditTask() && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Update Progress
                  </label>
                  <div className="flex items-center">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={progress}
                      onChange={(e) => setProgress(parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700 w-10">
                      {progress}%
                    </span>
                  </div>
                  <button
                    onClick={handleProgressUpdate}
                    disabled={progress === task.completionPercentage}
                    className="mt-2 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Update
                  </button>
                </div>
              )}
              
              {/* Created Info */}
              <div className="mt-4 text-sm text-gray-500">
                <p>Created by {task.createdBy.username}</p>
                <p>Created on {formatDate(task.createdAt)} at {formatTime(task.createdAt)}</p>
                <p>Last updated: {formatDate(task.updatedAt)} at {formatTime(task.updatedAt)}</p>
              </div>
              
              {/* Edit Button */}
              {canEditTask() && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="mt-4 flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit Task
                </button>
              )}
              
              {/* Expedite Button - Only for Managers and Admins */}
              {canExpediteTask() && onExpedite && (
                <button
                  onClick={() => setShowExpediteForm(true)}
                  className="mt-4 flex items-center px-3 py-2 bg-orange-100 text-orange-700 rounded hover:bg-orange-200"
                >
                  <AlertOctagon className="h-4 w-4 mr-1" />
                  Expedite Task
                </button>
              )}
            </div>
          </div>
          
          {/* Expedite Form */}
          {showExpediteForm && (
            <div className="mt-4 bg-orange-50 p-4 rounded-md border border-orange-200">
              <h4 className="font-medium text-orange-700 flex items-center mb-2">
                <AlertOctagon className="h-4 w-4 mr-1" />
                Request Task Expedition
              </h4>
              <form onSubmit={handleExpediteSubmit}>
                <textarea
                  placeholder="Explain why this task needs to be expedited..."
                  value={expediteMessage}
                  onChange={(e) => setExpediteMessage(e.target.value)}
                  className="w-full p-2 border border-orange-300 rounded focus:ring-orange-500 focus:border-orange-500"
                  rows={3}
                  required
                />
                <div className="mt-2 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowExpediteForm(false)}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!expediteMessage.trim()}
                    className="px-3 py-1 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50"
                  >
                    Send Urgent Request
                  </button>
                </div>
              </form>
            </div>
          )}
          
          {/* Progress History */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold flex items-center mb-4">
              <BarChart2 className="h-5 w-5 mr-2" />
              Progress History
            </h3>
            
            {task.progressHistory.length > 0 ? (
              <div className="space-y-3">
                {task.progressHistory.map((history) => (
                  <div key={history.id} className="flex items-start border-l-2 border-blue-500 pl-3">
                    <div>
                      <div className="flex items-center">
                        <span className="font-medium">
                          {history.previousPercentage}% → {history.newPercentage}%
                        </span>
                        <span className="ml-2 text-xs text-gray-500">
                          {formatDate(history.createdAt)} at {formatTime(history.createdAt)}
                        </span>
                      </div>
                      {history.comment && (
                        <p className="text-gray-600 text-sm mt-1">{history.comment}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No progress updates yet.</p>
            )}
          </div>
          
          {/* Comments Section */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold flex items-center mb-4">
              <MessageSquare className="h-5 w-5 mr-2" />
              Comments
            </h3>
            
            {/* Comment Form */}
            <form onSubmit={handleCommentSubmit} className="mb-6">
              <div className="flex">
                <input
                  type="text"
                  placeholder="Add a comment..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="flex-grow rounded-l-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  disabled={!comment.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </form>
            
            {/* Comments List */}
            {task.comments.length > 0 ? (
              <div className="space-y-4">
                {task.comments.map((comment) => (
                  <div key={comment.id} className="bg-gray-50 p-3 rounded">
                    <div className="flex justify-between">
                      <div className="font-medium">{comment.user.username}</div>
                      <div className="text-xs text-gray-500">
                        {formatDate(comment.createdAt)} at {formatTime(comment.createdAt)}
                      </div>
                    </div>
                    <p className="mt-1 text-gray-700">{comment.content}</p>
                    
                    {/* Delete Comment Button */}
                    {canDeleteComment(comment) && (
                      <button
                        onClick={() => onDeleteComment(comment.id)}
                        className="mt-1 text-xs text-red-600 hover:text-red-800 flex items-center"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No comments yet.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskDetail;
