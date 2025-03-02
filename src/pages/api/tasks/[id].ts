import type { NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { withAuth, AuthenticatedRequest } from '../../../utils/authMiddleware';
import {
  createTaskAssignmentNotification,
  createTaskStatusChangeNotification,
  createCommentNotification,
  createProgressUpdateNotification
} from '../../../utils/notificationUtils';

const prisma = new PrismaClient();

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  const { method } = req;
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ message: 'Invalid task ID' });
  }

  switch (method) {
    case 'GET':
      return getTask(req, res, id);
    case 'PUT':
      return updateTask(req, res, id);
    case 'DELETE':
      return deleteTask(req, res, id);
    default:
      res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
      return res.status(405).json({ message: `Method ${method} Not Allowed` });
  }
}

// Get a specific task with its comments and progress history
async function getTask(req: AuthenticatedRequest, res: NextApiResponse, id: string) {
  try {
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        assignedTo: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        progressHistory: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if user has access to this task
    if (req.user?.role !== 'ADMIN' && req.user?.role !== 'MANAGER') {
      if (task.createdById !== req.user?.userId && task.assignedToId !== req.user?.userId) {
        return res.status(403).json({ message: 'Forbidden: You do not have access to this task' });
      }
    }

    return res.status(200).json(task);
  } catch (error) {
    console.error(`Error fetching task ${id}:`, error);
    return res.status(500).json({ message: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
}

// Update a task
async function updateTask(req: AuthenticatedRequest, res: NextApiResponse, id: string) {
  try {
    // Check if task exists
    const existingTask = await prisma.task.findUnique({
      where: { id },
      include: {
        assignedTo: true,
        createdBy: true,
      }
    });

    if (!existingTask) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if user has access to update this task
    if (req.user?.role !== 'ADMIN' && req.user?.role !== 'MANAGER') {
      if (existingTask.createdById !== req.user?.userId && existingTask.assignedToId !== req.user?.userId) {
        return res.status(403).json({ message: 'Forbidden: You do not have permission to update this task' });
      }
    }

    const { 
      title, 
      description, 
      category, 
      status,
      completionPercentage,
      dueDate,
      assignedToId,
      comment 
    } = req.body;

    // Prepare update data
    const updateData: any = {};
    
    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (category) updateData.category = category;
    if (status) updateData.status = status;
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
    if (assignedToId !== undefined) updateData.assignedToId = assignedToId || null;

    // Track notification tasks
    const notificationTasks: Promise<any>[] = [];

    // Handle task assignment notification
    if (assignedToId && assignedToId !== existingTask.assignedToId) {
      notificationTasks.push(
        createTaskAssignmentNotification(
          id,
          existingTask.title,
          assignedToId,
          req.user?.userId || ''
        )
      );
    }

    // Handle status change notification
    if (status && status !== existingTask.status) {
      // Notify task creator if they're not the one updating the status
      if (existingTask.createdById !== req.user?.userId) {
        notificationTasks.push(
          createTaskStatusChangeNotification(
            id,
            existingTask.title,
            status,
            existingTask.createdById,
            req.user?.userId || ''
          )
        );
      }

      // Notify assignee if they're not the one updating the status
      if (existingTask.assignedToId && existingTask.assignedToId !== req.user?.userId) {
        notificationTasks.push(
          createTaskStatusChangeNotification(
            id,
            existingTask.title,
            status,
            existingTask.assignedToId,
            req.user?.userId || ''
          )
        );
      }
    }

    // Handle completion percentage update and progress history
    if (completionPercentage !== undefined) {
      // Validate completion percentage
      if (completionPercentage < 0 || completionPercentage > 100) {
        return res.status(400).json({ message: 'Completion percentage must be between 0 and 100' });
      }

      // Only create progress history if the percentage has changed
      if (completionPercentage !== existingTask.completionPercentage) {
        // Create progress history entry
        await prisma.progressHistory.create({
          data: {
            taskId: id,
            previousPercentage: existingTask.completionPercentage,
            newPercentage: completionPercentage,
            comment: comment || `Progress updated from ${existingTask.completionPercentage}% to ${completionPercentage}%`,
          },
        });

        updateData.completionPercentage = completionPercentage;
        
        // Auto-update status based on completion percentage
        if (completionPercentage === 100 && existingTask.status !== 'COMPLETED') {
          updateData.status = 'COMPLETED';
        } else if (completionPercentage > 0 && completionPercentage < 100 && existingTask.status === 'PENDING') {
          updateData.status = 'IN_PROGRESS';
        }

        // Notify task creator if they're not the one updating the progress
        if (existingTask.createdById !== req.user?.userId) {
          notificationTasks.push(
            createProgressUpdateNotification(
              id,
              existingTask.title,
              existingTask.completionPercentage,
              completionPercentage,
              req.user?.userId || '',
              existingTask.createdById
            )
          );
        }

        // Notify assignee if they're not the one updating the progress
        if (existingTask.assignedToId && existingTask.assignedToId !== req.user?.userId) {
          notificationTasks.push(
            createProgressUpdateNotification(
              id,
              existingTask.title,
              existingTask.completionPercentage,
              completionPercentage,
              req.user?.userId || '',
              existingTask.assignedToId
            )
          );
        }
      }
    }

    // Add comment if provided
    if (comment) {
      const newComment = await prisma.comment.create({
        data: {
          content: comment,
          taskId: id,
          userId: req.user?.userId || '',
        },
      });

      // Notify task creator if they're not the one commenting
      if (existingTask.createdById !== req.user?.userId) {
        notificationTasks.push(
          createCommentNotification(
            id,
            existingTask.title,
            comment,
            req.user?.userId || '',
            existingTask.createdById
          )
        );
      }

      // Notify assignee if they're not the one commenting
      if (existingTask.assignedToId && existingTask.assignedToId !== req.user?.userId) {
        notificationTasks.push(
          createCommentNotification(
            id,
            existingTask.title,
            comment,
            req.user?.userId || '',
            existingTask.assignedToId
          )
        );
      }
    }

    // Update task
    const updatedTask = await prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        assignedTo: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        action: 'UPDATE',
        entity: 'TASK',
        entityId: id,
        userId: req.user?.userId || '',
        taskId: id,
        details: `Task "${updatedTask.title}" updated by ${req.user?.email}`,
      },
    });

    // Process all notification tasks in parallel
    await Promise.all(notificationTasks);

    return res.status(200).json(updatedTask);
  } catch (error) {
    console.error(`Error updating task ${id}:`, error);
    return res.status(500).json({ message: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
}

// Delete a task
async function deleteTask(req: AuthenticatedRequest, res: NextApiResponse, id: string) {
  try {
    // Check if task exists
    const existingTask = await prisma.task.findUnique({
      where: { id },
    });

    if (!existingTask) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Only admins, managers, or the task creator can delete tasks
    if (req.user?.role !== 'ADMIN' && req.user?.role !== 'MANAGER' && existingTask.createdById !== req.user?.userId) {
      return res.status(403).json({ message: 'Forbidden: You do not have permission to delete this task' });
    }

    // Delete related records first (to avoid foreign key constraints)
    await prisma.progressHistory.deleteMany({
      where: { taskId: id },
    });

    await prisma.comment.deleteMany({
      where: { taskId: id },
    });

    await prisma.auditLog.deleteMany({
      where: { taskId: id },
    });

    // Delete the task
    await prisma.task.delete({
      where: { id },
    });

    // Log the action (in a separate table since we deleted the task-related audit logs)
    await prisma.auditLog.create({
      data: {
        action: 'DELETE',
        entity: 'TASK',
        entityId: id,
        userId: req.user?.userId || '',
        details: `Task "${existingTask.title}" deleted by ${req.user?.email}`,
      },
    });

    return res.status(200).json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error(`Error deleting task ${id}:`, error);
    return res.status(500).json({ message: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
}

// Export the handler with authentication middleware
export default withAuth(handler);
