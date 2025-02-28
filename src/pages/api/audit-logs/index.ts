import type { NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { withAuth, AuthenticatedRequest } from '../../../utils/authMiddleware';

const prisma = new PrismaClient();

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }

  try {
    // Only admins can access audit logs
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
    }

    const { 
      entity, 
      action,
      userId,
      taskId,
      startDate,
      endDate,
      page = '1',
      limit = '20',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Parse pagination parameters
    const pageNumber = parseInt(page as string, 10);
    const limitNumber = parseInt(limit as string, 10);
    const skip = (pageNumber - 1) * limitNumber;

    // Build filter conditions
    const where: any = {};
    
    if (entity) where.entity = entity;
    if (action) where.action = action;
    if (userId) where.userId = userId;
    if (taskId) where.taskId = taskId;
    
    // Date range filter
    if (startDate || endDate) {
      where.createdAt = {};
      
      if (startDate) {
        where.createdAt.gte = new Date(startDate as string);
      }
      
      if (endDate) {
        where.createdAt.lte = new Date(endDate as string);
      }
    }

    // Count total audit logs for pagination
    const totalLogs = await prisma.auditLog.count({ where });

    // Get audit logs with pagination and sorting
    const auditLogs = await prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        task: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: {
        [sortBy as string]: sortOrder,
      },
      skip,
      take: limitNumber,
    });

    // Return audit logs with pagination metadata
    return res.status(200).json({
      auditLogs,
      pagination: {
        total: totalLogs,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(totalLogs / limitNumber),
      },
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return res.status(500).json({ message: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
}

// Export the handler with authentication middleware
export default withAuth(handler, ['ADMIN']);
