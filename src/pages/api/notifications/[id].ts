import type { NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { withAuth, AuthenticatedRequest } from '../../../utils/authMiddleware';

const prisma = new PrismaClient();

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  const { method } = req;
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ message: 'Invalid notification ID' });
  }

  switch (method) {
    case 'PUT':
      return updateNotification(req, res, id);
    case 'DELETE':
      return deleteNotification(req, res, id);
    default:
      res.setHeader('Allow', ['PUT', 'DELETE']);
      return res.status(405).json({ message: `Method ${method} Not Allowed` });
  }
}

// Update a notification (mark as read/unread)
async function updateNotification(req: AuthenticatedRequest, res: NextApiResponse, id: string) {
  try {
    const { isRead } = req.body;

    // Validate input
    if (isRead === undefined) {
      return res.status(400).json({ message: 'isRead field is required' });
    }

    // Check if notification exists
    const existingNotification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!existingNotification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    // Check if user owns this notification
    if (existingNotification.userId !== req.user?.userId) {
      return res.status(403).json({ message: 'Forbidden: You do not have permission to update this notification' });
    }

    // Update notification
    const updatedNotification = await prisma.notification.update({
      where: { id },
      data: {
        isRead,
      },
    });

    return res.status(200).json(updatedNotification);
  } catch (error) {
    console.error(`Error updating notification ${id}:`, error);
    return res.status(500).json({ message: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
}

// Delete a notification
async function deleteNotification(req: AuthenticatedRequest, res: NextApiResponse, id: string) {
  try {
    // Check if notification exists
    const existingNotification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!existingNotification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    // Check if user owns this notification or is an admin
    if (existingNotification.userId !== req.user?.userId && req.user?.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Forbidden: You do not have permission to delete this notification' });
    }

    // Delete the notification
    await prisma.notification.delete({
      where: { id },
    });

    return res.status(200).json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error(`Error deleting notification ${id}:`, error);
    return res.status(500).json({ message: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
}

// Export the handler with authentication middleware
export default withAuth(handler);
