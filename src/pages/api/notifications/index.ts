import type { NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { withAuth, AuthenticatedRequest } from '../../../utils/authMiddleware';

const prisma = new PrismaClient();

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  const { method } = req;

  switch (method) {
    case 'GET':
      return getNotifications(req, res);
    case 'POST':
      return createNotification(req, res);
    default:
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).json({ message: `Method ${method} Not Allowed` });
  }
}

// Get notifications for the current user
async function getNotifications(req: AuthenticatedRequest, res: NextApiResponse) {
  try {
    const { 
      unreadOnly = 'false',
      page = '1',
      limit = '10',
    } = req.query;

    // Parse pagination parameters
    const pageNumber = parseInt(page as string, 10);
    const limitNumber = parseInt(limit as string, 10);
    const skip = (pageNumber - 1) * limitNumber;
    const showUnreadOnly = unreadOnly === 'true';

    // Build filter conditions
    const where: any = {
      userId: req.user?.id,
    };
    
    if (showUnreadOnly) {
      where.isRead = false;
    }

    // Count total notifications for pagination
    const totalNotifications = await prisma.notification.count({ where });

    // Get notifications with pagination
    const notifications = await prisma.notification.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limitNumber,
    });

    // Return notifications with pagination metadata
    return res.status(200).json({
      notifications,
      pagination: {
        total: totalNotifications,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(totalNotifications / limitNumber),
      },
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return res.status(500).json({ message: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
}

// Create a new notification (admin or manager only)
async function createNotification(req: AuthenticatedRequest, res: NextApiResponse) {
  try {
    const { 
      title, 
      message, 
      type = 'INFO',
      userId, 
      taskId,
      sendToAll = false
    } = req.body;

    // Validate input
    if (!title || !message) {
      return res.status(400).json({ message: 'Title and message are required' });
    }

    if (!sendToAll && !userId) {
      return res.status(400).json({ message: 'Either userId or sendToAll must be provided' });
    }

    // If sending to all users
    if (sendToAll) {
      // Get all active users
      const users = await prisma.user.findMany({
        where: { isActive: true },
        select: { id: true },
      });

      // Create notifications for all users
      const notificationPromises = users.map(user => 
        prisma.notification.create({
          data: {
            title,
            message,
            type: type as 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS',
            userId: user.id,
            taskId,
          },
        })
      );

      await Promise.all(notificationPromises);

      // Log the action
      await prisma.auditLog.create({
        data: {
          action: 'CREATE',
          entity: 'NOTIFICATION',
          userId: req.user?.userId || '',
          taskId,
          details: `Notification "${title}" sent to all users by ${req.user?.email}`,
        },
      });

      return res.status(201).json({ message: `Notification sent to ${users.length} users` });
    } 
    // If sending to a specific user
    else {
      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user || !user.isActive) {
        return res.status(400).json({ message: 'User not found or inactive' });
      }

      // Create notification
      const newNotification = await prisma.notification.create({
        data: {
          title,
          message,
          type: type as 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS',
          userId,
          taskId,
        },
      });

      // Log the action
      await prisma.auditLog.create({
        data: {
          action: 'CREATE',
          entity: 'NOTIFICATION',
          entityId: newNotification.id,
          userId: req.user?.userId || '',
          taskId,
          details: `Notification "${title}" sent to user ${user.username} by ${req.user?.email}`,
        },
      });

      return res.status(201).json(newNotification);
    }
  } catch (error) {
    console.error('Error creating notification:', error);
    return res.status(500).json({ message: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
}

// Export the handler with authentication middleware
// Only admins and managers can create notifications for all users
export default withAuth(handler);
