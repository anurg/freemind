import type { NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { withAuth, AuthenticatedRequest } from '../../../utils/authMiddleware';

const prisma = new PrismaClient();

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  const { method } = req;
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ message: 'Invalid comment ID' });
  }

  switch (method) {
    case 'PUT':
      return updateComment(req, res, id);
    case 'DELETE':
      return deleteComment(req, res, id);
    default:
      res.setHeader('Allow', ['PUT', 'DELETE']);
      return res.status(405).json({ message: `Method ${method} Not Allowed` });
  }
}

// Update a comment
async function updateComment(req: AuthenticatedRequest, res: NextApiResponse, id: string) {
  try {
    const { content } = req.body;

    // Validate input
    if (!content) {
      return res.status(400).json({ message: 'Content is required' });
    }

    // Check if comment exists
    const existingComment = await prisma.comment.findUnique({
      where: { id },
      include: {
        task: true,
      },
    });

    if (!existingComment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Only the comment author, admins, or managers can update comments
    if (req.user?.role !== 'ADMIN' && req.user?.role !== 'MANAGER' && existingComment.userId !== req.user?.userId) {
      return res.status(403).json({ message: 'Forbidden: You do not have permission to update this comment' });
    }

    // Update comment
    const updatedComment = await prisma.comment.update({
      where: { id },
      data: {
        content,
        updatedAt: new Date(),
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
        action: 'UPDATE',
        entity: 'COMMENT',
        entityId: id,
        userId: req.user?.userId || '',
        taskId: existingComment.taskId,
        details: `Comment updated on task "${existingComment.task.title}" by ${req.user?.email}`,
      },
    });

    return res.status(200).json(updatedComment);
  } catch (error) {
    console.error(`Error updating comment ${id}:`, error);
    return res.status(500).json({ message: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
}

// Delete a comment
async function deleteComment(req: AuthenticatedRequest, res: NextApiResponse, id: string) {
  try {
    // Check if comment exists
    const existingComment = await prisma.comment.findUnique({
      where: { id },
      include: {
        task: true,
      },
    });

    if (!existingComment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Only the comment author, admins, or managers can delete comments
    if (req.user?.role !== 'ADMIN' && req.user?.role !== 'MANAGER' && existingComment.userId !== req.user?.userId) {
      return res.status(403).json({ message: 'Forbidden: You do not have permission to delete this comment' });
    }

    // Delete the comment
    await prisma.comment.delete({
      where: { id },
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        action: 'DELETE',
        entity: 'COMMENT',
        entityId: id,
        userId: req.user?.userId || '',
        taskId: existingComment.taskId,
        details: `Comment deleted from task "${existingComment.task.title}" by ${req.user?.email}`,
      },
    });

    return res.status(200).json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error(`Error deleting comment ${id}:`, error);
    return res.status(500).json({ message: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
}

// Export the handler with authentication middleware
export default withAuth(handler);
