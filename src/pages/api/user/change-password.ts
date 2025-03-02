import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../../../utils/authMiddleware';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Get the authenticated user from the middleware
  const user = req.user;
  
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'POST') {
    try {
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Current password and new password are required' });
      }

      // Get the user with their current password
      const userWithPassword = await prisma.user.findUnique({
        where: { id: user.id },
      });

      if (!userWithPassword) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Verify current password
      const isPasswordValid = await bcrypt.compare(currentPassword, userWithPassword.password);
      if (!isPasswordValid) {
        return res.status(400).json({ error: 'Current password is incorrect' });
      }

      // Validate new password (e.g., minimum length)
      if (newPassword.length < 8) {
        return res.status(400).json({ error: 'New password must be at least 8 characters long' });
      }

      // Hash the new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update the user's password
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      });

      // Log the action
      await prisma.auditLog.create({
        data: {
          action: 'UPDATE',
          entity: 'User',
          entityId: user.id,
          userId: user.id,
          details: 'User changed their password',
        },
      });

      return res.status(200).json({ message: 'Password updated successfully' });
    } catch (error) {
      console.error('Error changing password:', error);
      return res.status(500).json({ error: 'Failed to change password' });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

export default authMiddleware(handler);
