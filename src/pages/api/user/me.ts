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
      // Get user details without password
      const userDetails = await prisma.user.findUnique({
        where: { id: user.id },
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!userDetails) {
        return res.status(404).json({ error: 'User not found' });
      }

      return res.status(200).json(userDetails);
    } catch (error) {
      console.error('Error fetching user details:', error);
      return res.status(500).json({ error: 'Failed to fetch user details' });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

export default authMiddleware(handler);
