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
    // Get insights based on task data
    const insights = await generateInsights();
    
    return res.status(200).json(insights);
  } catch (error) {
    console.error('Error generating insights:', error);
    return res.status(500).json({ message: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
}

// Generate insights based on task data
async function generateInsights() {
  // Get task statistics
  const totalTasks = await prisma.task.count();
  
  const tasksByStatus = await prisma.task.groupBy({
    by: ['status'],
    _count: {
      id: true,
    },
  });
  
  const tasksByCategory = await prisma.task.groupBy({
    by: ['category'],
    _count: {
      id: true,
    },
  });

  // Get delayed tasks
  const delayedTasks = await prisma.task.count({
    where: {
      status: 'DELAYED',
    },
  });

  // Get tasks due soon (in the next 7 days)
  const now = new Date();
  const nextWeek = new Date(now);
  nextWeek.setDate(now.getDate() + 7);
  
  const tasksDueSoon = await prisma.task.count({
    where: {
      dueDate: {
        gte: now,
        lte: nextWeek,
      },
      status: {
        not: 'COMPLETED',
      },
    },
  });

  // Get overdue tasks
  const overdueTasks = await prisma.task.count({
    where: {
      dueDate: {
        lt: now,
      },
      status: {
        not: 'COMPLETED',
      },
    },
  });

  // Get average completion time
  const completedTasks = await prisma.task.findMany({
    where: {
      status: 'COMPLETED',
    },
    select: {
      createdAt: true,
      updatedAt: true,
    },
  });

  let averageCompletionTime = 0;
  if (completedTasks.length > 0) {
    const totalCompletionTime = completedTasks.reduce((total, task) => {
      const completionTime = task.updatedAt.getTime() - task.createdAt.getTime();
      return total + completionTime;
    }, 0);
    
    averageCompletionTime = totalCompletionTime / completedTasks.length;
  }

  // Get average completion time in days
  const averageCompletionDays = Math.round(averageCompletionTime / (1000 * 60 * 60 * 24) * 10) / 10;

  // Get top performers (users with most completed tasks)
  const topPerformers = await prisma.task.groupBy({
    by: ['assignedToId'],
    where: {
      status: 'COMPLETED',
      assignedToId: {
        not: null,
      },
    },
    _count: {
      id: true,
    },
    orderBy: {
      _count: {
        id: 'desc',
      },
    },
    take: 5,
  });

  // Get user details for top performers
  const topPerformersWithDetails = await Promise.all(
    topPerformers.map(async (performer) => {
      if (!performer.assignedToId) return null;
      
      const user = await prisma.user.findUnique({
        where: { id: performer.assignedToId },
        select: {
          id: true,
          username: true,
          email: true,
        },
      });
      
      return {
        user,
        completedTasks: performer._count.id,
      };
    })
  );

  // Generate AI-like insights
  const insights = {
    summary: {
      totalTasks,
      completedTasks: tasksByStatus.find(t => t.status === 'COMPLETED')?._count.id || 0,
      inProgressTasks: tasksByStatus.find(t => t.status === 'IN_PROGRESS')?._count.id || 0,
      pendingTasks: tasksByStatus.find(t => t.status === 'PENDING')?._count.id || 0,
      delayedTasks,
      tasksDueSoon,
      overdueTasks,
    },
    taskDistribution: {
      byStatus: tasksByStatus.map(item => ({
        status: item.status,
        count: item._count.id,
        percentage: Math.round((item._count.id / totalTasks) * 100),
      })),
      byCategory: tasksByCategory.map(item => ({
        category: item.category,
        count: item._count.id,
        percentage: Math.round((item._count.id / totalTasks) * 100),
      })),
    },
    performance: {
      averageCompletionDays,
      topPerformers: topPerformersWithDetails.filter(Boolean),
    },
    recommendations: generateRecommendations({
      delayedTasks,
      overdueTasks,
      tasksDueSoon,
      averageCompletionDays,
      totalTasks,
      completedTasks: tasksByStatus.find(t => t.status === 'COMPLETED')?._count.id || 0,
    }),
  };

  return insights;
}

// Generate recommendations based on task data
function generateRecommendations(data: {
  delayedTasks: number;
  overdueTasks: number;
  tasksDueSoon: number;
  averageCompletionDays: number;
  totalTasks: number;
  completedTasks: number;
}) {
  const recommendations = [];

  // Check for delayed tasks
  if (data.delayedTasks > 0) {
    recommendations.push({
      type: 'warning',
      message: `You have ${data.delayedTasks} delayed tasks. Consider reassigning or breaking them down into smaller tasks.`,
    });
  }

  // Check for overdue tasks
  if (data.overdueTasks > 0) {
    recommendations.push({
      type: 'danger',
      message: `${data.overdueTasks} tasks are overdue. Prioritize these tasks to avoid further delays.`,
    });
  }

  // Check for tasks due soon
  if (data.tasksDueSoon > 0) {
    recommendations.push({
      type: 'info',
      message: `${data.tasksDueSoon} tasks are due in the next 7 days. Plan your resources accordingly.`,
    });
  }

  // Check completion rate
  const completionRate = (data.completedTasks / data.totalTasks) * 100;
  if (completionRate < 30) {
    recommendations.push({
      type: 'warning',
      message: `Your task completion rate is low (${Math.round(completionRate)}%). Consider reviewing your task assignment strategy.`,
    });
  } else if (completionRate > 80) {
    recommendations.push({
      type: 'success',
      message: `Great job! Your team has a high task completion rate (${Math.round(completionRate)}%).`,
    });
  }

  // Check average completion time
  if (data.averageCompletionDays > 14) {
    recommendations.push({
      type: 'info',
      message: `Tasks take an average of ${data.averageCompletionDays} days to complete. Consider breaking down tasks into smaller, more manageable pieces.`,
    });
  }

  // Add a general recommendation if there are no specific ones
  if (recommendations.length === 0) {
    recommendations.push({
      type: 'success',
      message: 'Your project is on track. Keep up the good work!',
    });
  }

  return recommendations;
}

// Export the handler with authentication middleware
export default withAuth(handler);
