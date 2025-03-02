import type { NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { withAuth, AuthenticatedRequest } from '../../../../utils/authMiddleware';
import { createTaskExpediteNotification } from '../../../../utils/notificationUtils';

const prisma = new PrismaClient();

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  const { method } = req;
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ message: 'Invalid task ID' });
  }

  // Only allow POST requests
  if (method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: `Method ${method} Not Allowed` });
  }

  // Only managers and admins can expedite tasks
  if (req.user?.role !== 'ADMIN' && req.user?.role !== 'MANAGER') {
    return res.status(403).json({ message: 'Forbidden: Only managers and admins can expedite tasks' });
  }

  try {
    // Check if task exists
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        assignedTo: true,
        createdBy: true,
      },
    });

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ message: 'Expedite message is required' });
    }

    // Add a comment about the expedite request
    const comment = await prisma.comment.create({
      data: {
        content: `⚠️ URGENT: ${message}`,
        taskId: id,
        userId: req.user.userId,
      },
    });

    // Create an audit log entry
    await prisma.auditLog.create({
      data: {
        action: 'EXPEDITE',
        entity: 'TASK',
        entityId: id,
        userId: req.user.userId,
        taskId: id,
        details: `Task "${task.title}" expedite requested by ${req.user.email}: "${message}"`,
      },
    });

    // Send notifications
    const notificationPromises = [];

    // Notify the assignee if there is one
    if (task.assignedToId) {
      notificationPromises.push(
        createTaskExpediteNotification(
          id,
          task.title,
          message,
          req.user.userId,
          task.assignedToId
        )
      );
    }

    // Notify the creator if they're not the one expediting and not the assignee
    if (task.createdById !== req.user.userId && task.createdById !== task.assignedToId) {
      notificationPromises.push(
        createTaskExpediteNotification(
          id,
          task.title,
          message,
          req.user.userId,
          task.createdById
        )
      );
    }

    await Promise.all(notificationPromises);

    return res.status(200).json({ 
      message: 'Task expedite request sent successfully',
      comment
    });
  } catch (error) {
    console.error(`Error expediting task ${id}:`, error);
    return res.status(500).json({ message: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
}

export default withAuth(handler);
