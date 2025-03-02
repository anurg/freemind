import Router from 'next/router';

// Types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: string;
}

// API request helper with authentication
export async function apiRequest(
  endpoint: string,
  method: string = 'GET',
  data?: any,
  options: RequestInit = {}
) {
  const token = localStorage.getItem('token');
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    method,
    headers,
    ...options,
  };

  if (data) {
    config.body = JSON.stringify(data);
  }

  const response = await fetch(`/api/${endpoint}`, config);

  // Handle unauthorized responses
  if (response.status === 401) {
    // Clear token and redirect to login
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    Router.push('/login');
    throw new Error('Session expired. Please log in again.');
  }

  // Handle other error responses
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error(`API Error (${response.status}):`, errorData);
    throw new Error(errorData.message || `API Error: ${response.status} ${response.statusText}`);
  }

  try {
    // Return JSON response or empty object if no content
    return response.status !== 204 ? await response.json() : {};
  } catch (error) {
    console.error('Error parsing API response:', error);
    throw new Error('Failed to parse API response');
  }
}

// Authentication functions
export async function login(credentials: LoginCredentials) {
  const data = await apiRequest('auth/login', 'POST', credentials);
  
  // Store token and user data
  localStorage.setItem('token', data.token);
  localStorage.setItem('user', JSON.stringify(data.user));
  
  return data;
}

export function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  Router.push('/login');
}

export function getCurrentUser(): User | null {
  if (typeof window === 'undefined') {
    return null;
  }
  
  const userJson = localStorage.getItem('user');
  if (!userJson) {
    return null;
  }
  
  try {
    return JSON.parse(userJson);
  } catch (error) {
    console.error('Error parsing user data:', error);
    return null;
  }
}

export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  
  return !!localStorage.getItem('token');
}

// Task API functions
export async function getTasks(filters: Record<string, any> = {}) {
  const queryParams = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      queryParams.append(key, String(value));
    }
  });
  
  const queryString = queryParams.toString();
  return apiRequest(`tasks${queryString ? `?${queryString}` : ''}`);
}

export async function getTask(id: string) {
  return apiRequest(`tasks/${id}`);
}

export async function createTask(data: any) {
  return apiRequest('tasks', 'POST', data);
}

export async function updateTask(id: string, data: any) {
  return apiRequest(`tasks/${id}`, 'PUT', data);
}

export async function deleteTask(id: string) {
  return apiRequest(`tasks/${id}`, 'DELETE');
}

export async function expediteTask(id: string, message: string) {
  return apiRequest(`tasks/expedite/${id}`, 'POST', { message });
}

// Comment API functions
export async function addComment(taskId: string, content: string) {
  return apiRequest('comments', 'POST', { taskId, content });
}

export async function deleteComment(id: string) {
  return apiRequest(`comments/${id}`, 'DELETE');
}

// User API functions
export async function getUsers() {
  return apiRequest('users');
}

export async function getUser(id: string) {
  return apiRequest(`users/${id}`);
}

export async function getCurrentUserProfile() {
  return apiRequest('users/me');
}

export async function createUser(userData: any) {
  return apiRequest('users', 'POST', userData);
}

export async function updateUser(id: string, userData: any) {
  return apiRequest(`users/${id}`, 'PUT', userData);
}

export async function deactivateUser(id: string) {
  return apiRequest(`users/${id}`, 'DELETE');
}

// Notification API functions
export async function getNotifications(filters: Record<string, any> = {}) {
  const queryParams = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      queryParams.append(key, String(value));
    }
  });
  
  const queryString = queryParams.toString();
  return apiRequest(`notifications${queryString ? `?${queryString}` : ''}`);
}

export async function markNotificationAsRead(id: string) {
  return apiRequest(`notifications/${id}`, 'PUT', { isRead: true });
}

export async function markAllNotificationsAsRead() {
  return apiRequest('notifications/mark-all-read', 'PUT');
}

export async function deleteNotification(id: string) {
  return apiRequest(`notifications/${id}`, 'DELETE');
}

export async function createNotification(data: {
  title: string;
  message: string;
  type?: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS';
  userId?: string;
  taskId?: string;
  sendToAll?: boolean;
}) {
  return apiRequest('notifications', 'POST', data);
}

// Insights API function
export async function getInsights() {
  try {
    return await apiRequest('insights');
  } catch (error) {
    console.error('Error in getInsights:', error);
    throw error;
  }
}

// User-specific insights API function
export async function getUserInsights(userId: string) {
  return apiRequest(`insights/user/${userId}`);
}

// Audit logs API function
export async function getAuditLogs(filters: Record<string, any> = {}) {
  const queryParams = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      queryParams.append(key, String(value));
    }
  });
  
  const queryString = queryParams.toString();
  return apiRequest(`audit-logs${queryString ? `?${queryString}` : ''}`);
}
