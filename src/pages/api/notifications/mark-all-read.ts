import type { NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { withAuth, AuthenticatedRequest } from '../../../utils/authMiddleware';

const prisma = new PrismaClient();

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
    res.setHeader('Allow', ['PUT']);
    return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }

  try {
    console.log('Marking all notifications as read for user:', req.user?.id);
    
    // Mark all notifications as read for the current user
    const result = await prisma.notification.updateMany({
      where: {
        userId: req.user?.id,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    console.log(`Marked ${result.count} notifications as read`);

    return res.status(200).json({ 
      message: 'All notifications marked as read',
      count: result.count,
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return res.status(500).json({ message: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
}

// Export the handler with authentication middleware
export default withAuth(handler);
