import type { NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { withAuth, AuthenticatedRequest } from '../../../../utils/authMiddleware';

const prisma = new PrismaClient();

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  const { method } = req;
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ message: 'Invalid user ID' });
  }

  // Check if user has access to this data
  if (req.user?.id !== id) {
    return res.status(403).json({ message: 'Forbidden: You do not have access to this data' });
  }

  switch (method) {
    case 'GET':
      return getUserInsights(req, res, id);
    default:
      res.setHeader('Allow', ['GET']);
      return res.status(405).json({ message: `Method ${method} Not Allowed` });
  }
}

// Get insights for a specific user
async function getUserInsights(req: AuthenticatedRequest, res: NextApiResponse, userId: string) {
  try {
    // Get date range (default to last 30 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get task counts by status
    const tasksByStatus = await prisma.task.groupBy({
      by: ['status'],
      where: {
        OR: [
          { createdById: userId },
          { assignedToId: userId }
        ]
      },
      _count: true,
    });

    // Calculate total tasks
    const totalTasks = tasksByStatus.reduce((sum, item) => sum + item._count, 0);

    // Get completed tasks in the date range
    const completedTasksInRange = await prisma.task.count({
      where: {
        OR: [
          { createdById: userId },
          { assignedToId: userId }
        ],
        status: 'COMPLETED',
        updatedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // Get average completion time for tasks
    const completedTasks = await prisma.task.findMany({
      where: {
        OR: [
          { createdById: userId },
          { assignedToId: userId }
        ],
        status: 'COMPLETED',
        completedAt: { not: null },
      },
      select: {
        createdAt: true,
        completedAt: true,
      },
    });

    let averageCompletionDays = 0;
    if (completedTasks.length > 0) {
      const totalDays = completedTasks.reduce((sum, task) => {
        const createdDate = new Date(task.createdAt);
        const completedDate = new Date(task.completedAt!);
        const days = (completedDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
        return sum + days;
      }, 0);
      averageCompletionDays = Math.round((totalDays / completedTasks.length) * 10) / 10;
    }

    // Get tasks by category
    const tasksByCategory = await prisma.task.groupBy({
      by: ['category'],
      where: {
        OR: [
          { createdById: userId },
          { assignedToId: userId }
        ]
      },
      _count: true,
    });

    // Get tasks created per month for the last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const tasksCreatedMonthly = await prisma.$queryRaw`
      SELECT DATE_TRUNC('month', "createdAt") as month, COUNT(*) as count
      FROM "Task"
      WHERE ("createdById" = ${userId} OR "assignedToId" = ${userId})
        AND "createdAt" >= ${sixMonthsAgo}
      GROUP BY DATE_TRUNC('month', "createdAt")
      ORDER BY month ASC
    `;

    // Format the insights data
    const insights = {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      taskStats: {
        total: totalTasks,
        byStatus: tasksByStatus.map(item => ({
          status: item.status,
          count: item._count,
          percentage: totalTasks ? Math.round((item._count / totalTasks) * 100) : 0,
        })),
        byCategory: tasksByCategory.map(item => ({
          category: item.category || 'Uncategorized',
          count: item._count,
          percentage: totalTasks ? Math.round((item._count / totalTasks) * 100) : 0,
        })),
      },
      performance: {
        completedTasksLast30Days: completedTasksInRange,
        averageCompletionDays,
        totalCompletedTasks: completedTasks.length,
      },
      activity: {
        monthlyTasks: tasksCreatedMonthly,
      },
    };

    return res.status(200).json(insights);
  } catch (error) {
    console.error(`Error fetching insights for user ${userId}:`, error);
    return res.status(500).json({ message: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
}

export default withAuth(handler);
