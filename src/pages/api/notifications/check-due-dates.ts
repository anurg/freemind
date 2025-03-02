import type { NextApiRequest, NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '../../../utils/authMiddleware';
import { checkDueDatesAndNotify } from '../../../utils/notificationUtils';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  const { method } = req;

  // Only allow POST requests
  if (method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: `Method ${method} Not Allowed` });
  }

  // Only allow admins and managers to trigger this endpoint
  if (req.user?.role !== 'ADMIN' && req.user?.role !== 'MANAGER') {
    return res.status(403).json({ message: 'Forbidden: Only admins and managers can check due dates' });
  }

  try {
    const notificationsCreated = await checkDueDatesAndNotify();
    
    return res.status(200).json({ 
      message: `Due date check completed successfully`,
      notificationsCreated
    });
  } catch (error) {
    console.error('Error checking due dates:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

export default withAuth(handler);
