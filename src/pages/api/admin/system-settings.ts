import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../../../utils/authMiddleware';

const prisma = new PrismaClient();

async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Get the authenticated user from the middleware
  const user = req.user;
  
  if (!user || user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden: Admin access required' });
  }

  if (req.method === 'GET') {
    try {
      // Get system settings or create default if not exists
      let settings = await prisma.systemSettings.findFirst();

      if (!settings) {
        // Create default settings if not found
        settings = await prisma.systemSettings.create({
          data: {
            organizationName: 'FreeMind',
            defaultCategories: ['Work', 'Personal', 'Urgent'],
            // Other defaults are set in the schema
          },
        });
      }

      return res.status(200).json(settings);
    } catch (error) {
      console.error('Error fetching system settings:', error);
      return res.status(500).json({ error: 'Failed to fetch system settings' });
    }
  } else if (req.method === 'PUT') {
    try {
      const {
        smtpHost,
        smtpPort,
        smtpUser,
        smtpPassword,
        smtpSecure,
        organizationName,
        defaultCategories,
        auditLogRetention,
      } = req.body;

      // Get existing settings ID or create new
      let existingSettings = await prisma.systemSettings.findFirst();
      
      let settings;
      if (existingSettings) {
        // Update existing settings
        settings = await prisma.systemSettings.update({
          where: { id: existingSettings.id },
          data: {
            smtpHost,
            smtpPort,
            smtpUser,
            smtpPassword: smtpPassword || existingSettings.smtpPassword, // Don't overwrite if not provided
            smtpSecure,
            organizationName,
            defaultCategories,
            auditLogRetention,
          },
        });
      } else {
        // Create new settings
        settings = await prisma.systemSettings.create({
          data: {
            smtpHost,
            smtpPort,
            smtpUser,
            smtpPassword,
            smtpSecure,
            organizationName,
            defaultCategories,
            auditLogRetention,
          },
        });
      }

      // Log the action
      await prisma.auditLog.create({
        data: {
          action: 'UPDATE',
          entity: 'SystemSettings',
          entityId: settings.id,
          userId: user.id,
          details: 'Admin updated system settings',
        },
      });

      return res.status(200).json({
        ...settings,
        smtpPassword: settings.smtpPassword ? '********' : null, // Mask password in response
      });
    } catch (error) {
      console.error('Error updating system settings:', error);
      return res.status(500).json({ error: 'Failed to update system settings' });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

export default authMiddleware(handler);
