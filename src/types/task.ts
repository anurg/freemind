/**
 * Task interface representing a task in the system
 */
export interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  category?: string;
  completionPercentage?: number;
  dueDate?: string;
  assignedTo?: {
    id: string;
    username: string;
    email?: string;
  };
  createdBy?: {
    id: string;
    username: string;
    email?: string;
  };
  createdAt: string;
  updatedAt: string;
}
