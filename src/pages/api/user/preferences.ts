import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../../../utils/authMiddleware';

const prisma = new PrismaClient();

async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Get the authenticated user from the middleware
  const user = req.user;
  
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    try {
      // Get user preferences or create default if not exists
      let preferences = await prisma.userPreferences.findUnique({
        where: { userId: user.id },
      });

      if (!preferences) {
        // Create default preferences if not found
        preferences = await prisma.userPreferences.create({
          data: {
            userId: user.id,
            // Default values are set in the schema
          },
        });
      }

      return res.status(200).json(preferences);
    } catch (error) {
      console.error('Error fetching user preferences:', error);
      return res.status(500).json({ error: 'Failed to fetch user preferences' });
    }
  } else if (req.method === 'PUT') {
    try {
      const {
        darkMode,
        emailNotifications,
        taskAssignmentNotify,
        taskDeadlineNotify,
        taskCompletionNotify,
        digestFrequency,
        defaultDashboardView,
      } = req.body;

      // Update or create user preferences
      const preferences = await prisma.userPreferences.upsert({
        where: { userId: user.id },
        update: {
          darkMode,
          emailNotifications,
          taskAssignmentNotify,
          taskDeadlineNotify,
          taskCompletionNotify,
          digestFrequency,
          defaultDashboardView,
        },
        create: {
          userId: user.id,
          darkMode,
          emailNotifications,
          taskAssignmentNotify,
          taskDeadlineNotify,
          taskCompletionNotify,
          digestFrequency,
          defaultDashboardView,
        },
      });

      // Log the action
      await prisma.auditLog.create({
        data: {
          action: 'UPDATE',
          entity: 'UserPreferences',
          entityId: preferences.id,
          userId: user.id,
          details: 'User updated their preferences',
        },
      });

      return res.status(200).json(preferences);
    } catch (error) {
      console.error('Error updating user preferences:', error);
      return res.status(500).json({ error: 'Failed to update user preferences' });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

export default authMiddleware(handler);
