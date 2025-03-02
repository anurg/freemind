import type { NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { withAuth, AuthenticatedRequest } from '../../../utils/authMiddleware';
import { createTaskAssignmentNotification } from '../../../utils/notificationUtils';

const prisma = new PrismaClient();

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  const { method } = req;

  switch (method) {
    case 'GET':
      return getTasks(req, res);
    case 'POST':
      return createTask(req, res);
    default:
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).json({ message: `Method ${method} Not Allowed` });
  }
}

// Get all tasks with filtering options
async function getTasks(req: AuthenticatedRequest, res: NextApiResponse) {
  try {
    const { 
      status, 
      category, 
      assignedToId, 
      createdById,
      search,
      page = '1',
      limit = '10',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Parse pagination parameters
    const pageNumber = parseInt(page as string, 10);
    const limitNumber = parseInt(limit as string, 10);
    const skip = (pageNumber - 1) * limitNumber;

    // Build filter conditions
    const where: any = {};
    
    if (status) where.status = status;
    if (category) where.category = category;
    if (assignedToId) where.assignedToId = assignedToId;
    
    // For regular users, only show tasks they created or are assigned to
    if (req.user?.role !== 'ADMIN' && req.user?.role !== 'MANAGER') {
      where.OR = [
        { createdById: req.user?.id },
        { assignedToId: req.user?.id }
      ];
    } 
    // For managers or if createdById is specified
    else if (createdById) {
      where.createdById = createdById;
    }

    // Search in title or description
    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    // Count total tasks for pagination
    const totalTasks = await prisma.task.count({ where });

    // Get tasks with pagination, sorting, and relations
    const tasks = await prisma.task.findMany({
      where,
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
      orderBy: {
        [sortBy as string]: sortOrder,
      },
      skip,
      take: limitNumber,
    });

    // Return tasks with pagination metadata
    return res.status(200).json({
      tasks,
      pagination: {
        total: totalTasks,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(totalTasks / limitNumber),
      },
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return res.status(500).json({ message: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
}

// Create a new task
async function createTask(req: AuthenticatedRequest, res: NextApiResponse) {
  try {
    const { 
      title, 
      description, 
      category, 
      status = 'PENDING',
      completionPercentage = 0,
      dueDate,
      assignedToId 
    } = req.body;

    console.log('Creating task with data:', req.body);
    console.log('User from token:', req.user);

    // Validate input
    if (!title || !description || !category) {
      return res.status(400).json({ message: 'Title, description, and category are required' });
    }

    // Validate completion percentage
    if (completionPercentage < 0 || completionPercentage > 100) {
      return res.status(400).json({ message: 'Completion percentage must be between 0 and 100' });
    }

    // If assignedToId is provided, check if the user exists
    if (assignedToId) {
      const assignedUser = await prisma.user.findUnique({
        where: { id: assignedToId },
      });

      if (!assignedUser || !assignedUser.isActive) {
        return res.status(400).json({ message: 'Assigned user not found or inactive' });
      }
    }

    // Ensure we have a valid user ID
    if (!req.user?.id) {
      return res.status(401).json({ message: 'User ID not found in token' });
    }

    // Create task
    const newTask = await prisma.task.create({
      data: {
        title,
        description,
        category,
        status: status as 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'DELAYED',
        completionPercentage,
        dueDate: dueDate ? new Date(dueDate) : null,
        // Only include assignedToId if it's a non-empty string
        ...(assignedToId ? { assignedToId } : {}),
        createdById: req.user.id,
      },
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

    console.log('Task created successfully:', newTask.id);

    // Create initial progress history entry
    await prisma.progressHistory.create({
      data: {
        taskId: newTask.id,
        previousPercentage: 0,
        newPercentage: completionPercentage,
        comment: 'Task created',
      },
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        action: 'CREATE',
        entity: 'TASK',
        entityId: newTask.id,
        userId: req.user.id,
        taskId: newTask.id,
        details: `Task "${newTask.title}" created by ${req.user.email}`,
      },
    });

    // Send notification to assigned user if task is assigned
    if (assignedToId && assignedToId !== req.user.id) {
      await createTaskAssignmentNotification(
        newTask.id,
        title,
        assignedToId,
        req.user.id
      );
    }

    return res.status(201).json(newTask);
  } catch (error) {
    console.error('Error creating task:', error);
    return res.status(500).json({ message: 'Internal server error', error: String(error) });
  } finally {
    await prisma.$disconnect();
  }
}

// Export the handler with authentication middleware
export default withAuth(handler);
