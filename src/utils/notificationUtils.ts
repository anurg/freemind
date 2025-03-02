import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Creates a notification for a specific user
 */
export async function createUserNotification(
  userId: string,
  title: string,
  message: string,
  type: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS' = 'INFO',
  taskId?: string
) {
  try {
    return await prisma.notification.create({
      data: {
        title,
        message,
        type,
        userId,
        taskId,
      },
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
}

/**
 * Creates a notification for task assignment
 */
export async function createTaskAssignmentNotification(
  taskId: string,
  taskTitle: string,
  assignedToId: string,
  assignedByUserId: string
) {
  try {
    const assignedBy = await prisma.user.findUnique({
      where: { id: assignedByUserId },
      select: { username: true },
    });

    return await createUserNotification(
      assignedToId,
      'New Task Assignment',
      `You have been assigned to task "${taskTitle}" by ${assignedBy?.username || 'a manager'}`,
      'INFO',
      taskId
    );
  } catch (error) {
    console.error('Error creating task assignment notification:', error);
  }
}

/**
 * Creates a notification for task status change
 */
export async function createTaskStatusChangeNotification(
  taskId: string,
  taskTitle: string,
  newStatus: string,
  userId: string,
  changedByUserId: string
) {
  try {
    const changedBy = await prisma.user.findUnique({
      where: { id: changedByUserId },
      select: { username: true },
    });

    return await createUserNotification(
      userId,
      'Task Status Updated',
      `Task "${taskTitle}" status has been changed to ${newStatus} by ${changedBy?.username || 'a team member'}`,
      'INFO',
      taskId
    );
  } catch (error) {
    console.error('Error creating task status change notification:', error);
  }
}

/**
 * Creates a notification for task due date approaching
 */
export async function createDueDateNotification(
  taskId: string,
  taskTitle: string,
  dueDate: Date,
  userId: string
) {
  try {
    const daysRemaining = Math.ceil(
      (dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );

    let message = '';
    let type: 'INFO' | 'WARNING' = 'INFO';

    if (daysRemaining <= 0) {
      message = `Task "${taskTitle}" is overdue!`;
      type = 'WARNING';
    } else if (daysRemaining === 1) {
      message = `Task "${taskTitle}" is due tomorrow!`;
      type = 'WARNING';
    } else if (daysRemaining <= 3) {
      message = `Task "${taskTitle}" is due in ${daysRemaining} days.`;
      type = 'WARNING';
    } else {
      message = `Task "${taskTitle}" is due in ${daysRemaining} days.`;
    }

    return await createUserNotification(
      userId,
      'Due Date Reminder',
      message,
      type,
      taskId
    );
  } catch (error) {
    console.error('Error creating due date notification:', error);
  }
}

/**
 * Creates a notification for new comment on a task
 */
export async function createCommentNotification(
  taskId: string,
  taskTitle: string,
  commentContent: string,
  commentByUserId: string,
  notifyUserId: string
) {
  try {
    const commentBy = await prisma.user.findUnique({
      where: { id: commentByUserId },
      select: { username: true, role: true },
    });

    // Don't notify the user who made the comment
    if (commentByUserId === notifyUserId) {
      return null;
    }

    const previewContent = commentContent.length > 50
      ? `${commentContent.substring(0, 50)}...`
      : commentContent;

    // Check if comment is from a manager or admin
    const isFromManagerOrAdmin = commentBy?.role === 'MANAGER' || commentBy?.role === 'ADMIN';
    
    // Create different notification based on commenter's role
    if (isFromManagerOrAdmin) {
      return await createUserNotification(
        notifyUserId,
        'Important: Management Comment on Task',
        `${commentBy.role === 'ADMIN' ? 'Admin' : 'Manager'} ${commentBy?.username || 'Someone'} commented on task "${taskTitle}": "${previewContent}"`,
        'WARNING', // Use WARNING type to highlight importance
        taskId
      );
    } else {
      return await createUserNotification(
        notifyUserId,
        'New Comment on Task',
        `${commentBy?.username || 'Someone'} commented on task "${taskTitle}": "${previewContent}"`,
        'INFO',
        taskId
      );
    }
  } catch (error) {
    console.error('Error creating comment notification:', error);
  }
}

/**
 * Creates a notification for task progress update
 */
export async function createProgressUpdateNotification(
  taskId: string,
  taskTitle: string,
  previousPercentage: number,
  newPercentage: number,
  updatedByUserId: string,
  notifyUserId: string
) {
  try {
    // Don't notify the user who updated the progress
    if (updatedByUserId === notifyUserId) {
      return null;
    }

    const updatedBy = await prisma.user.findUnique({
      where: { id: updatedByUserId },
      select: { username: true, role: true },
    });

    let type: 'INFO' | 'SUCCESS' = 'INFO';
    let title = 'Task Progress Updated';
    
    if (newPercentage === 100) {
      type = 'SUCCESS';
      title = 'Task Completed';
    }

    return await createUserNotification(
      notifyUserId,
      title,
      `${updatedBy?.username || 'Someone'} updated progress on task "${taskTitle}" from ${previousPercentage}% to ${newPercentage}%`,
      type,
      taskId
    );
  } catch (error) {
    console.error('Error creating progress update notification:', error);
  }
}

/**
 * Creates an urgent notification for a task that needs to be expedited
 */
export async function createTaskExpediteNotification(
  taskId: string,
  taskTitle: string,
  message: string,
  requestedByUserId: string,
  notifyUserId: string
) {
  try {
    const requestedBy = await prisma.user.findUnique({
      where: { id: requestedByUserId },
      select: { username: true, role: true },
    });

    // Don't notify the user who is requesting expedition
    if (requestedByUserId === notifyUserId) {
      return null;
    }

    const roleTitle = requestedBy?.role === 'ADMIN' ? 'Admin' : 
                     requestedBy?.role === 'MANAGER' ? 'Manager' : 'User';

    return await createUserNotification(
      notifyUserId,
      'URGENT: Task Needs Immediate Attention',
      `${roleTitle} ${requestedBy?.username || 'Someone'} has requested to expedite task "${taskTitle}": "${message}"`,
      'WARNING',
      taskId
    );
  } catch (error) {
    console.error('Error creating task expedite notification:', error);
  }
}

/**
 * Check for tasks with approaching due dates and create notifications
 * This function should be called by a scheduled job
 */
export async function checkDueDatesAndNotify() {
  try {
    const today = new Date();
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(today.getDate() + 3);
    
    // Find tasks due in the next 3 days that haven't been completed
    const tasks = await prisma.task.findMany({
      where: {
        dueDate: {
          gte: today,
          lte: threeDaysFromNow,
        },
        status: {
          not: 'COMPLETED',
        },
      },
      include: {
        assignedTo: true,
      },
    });

    // Create notifications for each task
    for (const task of tasks) {
      if (task.assignedTo && task.dueDate) {
        await createDueDateNotification(
          task.id,
          task.title,
          task.dueDate,
          task.assignedTo.id
        );
      }
    }

    return tasks.length;
  } catch (error) {
    console.error('Error checking due dates and notifying:', error);
    return 0;
  }
}
