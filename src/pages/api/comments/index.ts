import type { NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { withAuth, AuthenticatedRequest } from '../../../utils/authMiddleware';

const prisma = new PrismaClient();

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  const { method } = req;

  switch (method) {
    case 'POST':
      return createComment(req, res);
    default:
      res.setHeader('Allow', ['POST']);
      return res.status(405).json({ message: `Method ${method} Not Allowed` });
  }
}

// Create a new comment
async function createComment(req: AuthenticatedRequest, res: NextApiResponse) {
  try {
    const { content, taskId } = req.body;

    // Validate input
    if (!content || !taskId) {
      return res.status(400).json({ message: 'Content and taskId are required' });
    }

    // Check if task exists
    const task = await prisma.task.findUnique({
      where: { id: taskId },
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

    // Create comment
    const newComment = await prisma.comment.create({
      data: {
        content,
        taskId,
        userId: req.user?.userId || '',
      },
      include: {
        user: {
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
        action: 'CREATE',
        entity: 'COMMENT',
        entityId: newComment.id,
        userId: req.user?.userId || '',
        taskId,
        details: `Comment added to task "${task.title}" by ${req.user?.email}`,
      },
    });

    return res.status(201).json(newComment);
  } catch (error) {
    console.error('Error creating comment:', error);
    return res.status(500).json({ message: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
}

// Export the handler with authentication middleware
export default withAuth(handler);
