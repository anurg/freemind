import { NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { withAuth, AuthenticatedRequest } from '../../../utils/authMiddleware';

const prisma = new PrismaClient();

// Main handler function
async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  const { method } = req;
  const { id } = req.query;

  console.log('Notification API request:', {
    method,
    id,
    url: req.url,
    userId: req.user?.id,
    userRole: req.user?.role
  });

  if (!id || typeof id !== 'string') {
    console.log('Invalid notification ID:', id);
    return res.status(400).json({ message: 'Invalid notification ID' });
  }

  switch (method) {
    case 'PUT':
      return updateNotification(req, res, id);
    case 'DELETE':
      return deleteNotification(req, res, id);
    default:
      res.setHeader('Allow', ['PUT', 'DELETE']);
      console.log(`Method ${method} Not Allowed`);
      return res.status(405).json({ message: `Method ${method} Not Allowed` });
  }
}

// Update a notification
async function updateNotification(req: AuthenticatedRequest, res: NextApiResponse, id: string) {
  try {
    // Check if notification exists
    const existingNotification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!existingNotification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    // Check if user owns this notification
    if (existingNotification.userId !== req.user?.id) {
      return res.status(403).json({ message: 'Forbidden: You do not have permission to update this notification' });
    }

    // Update the notification
    const updatedNotification = await prisma.notification.update({
      where: { id },
      data: { ...req.body },
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
    console.log('Delete notification request:', {
      notificationId: id,
      userId: req.user?.id,
      userRole: req.user?.role
    });
    
    // Check if notification exists
    const existingNotification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!existingNotification) {
      console.log('Notification not found:', id);
      return res.status(404).json({ message: 'Notification not found' });
    }

    console.log('Found notification:', {
      id: existingNotification.id,
      userId: existingNotification.userId,
      title: existingNotification.title
    });

    // Check if user owns this notification or is an admin
    if (existingNotification.userId !== req.user?.id && req.user?.role !== 'ADMIN') {
      console.log('Permission denied:', {
        notificationUserId: existingNotification.userId,
        requestUserId: req.user?.id,
        userRole: req.user?.role
      });
      return res.status(403).json({ message: 'Forbidden: You do not have permission to delete this notification' });
    }

    // Delete the notification
    await prisma.notification.delete({
      where: { id },
    });

    console.log('Notification deleted successfully:', id);
    return res.status(200).json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error(`Error deleting notification ${id}:`, error);
    return res.status(500).json({ message: 'Internal server error', error: String(error) });
  } finally {
    await prisma.$disconnect();
  }
}

// Export the handler with authentication
export default withAuth(handler);
