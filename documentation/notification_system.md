# FreeMind Notification System

This document outlines the notification system implemented in the FreeMind task management application.

## Overview

The notification system provides real-time updates to users about important events related to their tasks. Notifications are stored in the database and can be viewed through the notification panel in the application.

## Notification Types

Notifications in FreeMind can be of the following types:

1. `INFO` - General informational notifications
2. `WARNING` - Notifications that require attention
3. `ERROR` - Error notifications
4. `SUCCESS` - Success notifications

## Automatic Notification Events

The system automatically generates notifications for the following events:

### 1. Task Assignment

When a user is assigned to a task, they receive a notification. This happens in two scenarios:
- When a new task is created with an assignee
- When an existing task's assignee is changed

### 2. Task Status Changes

When a task's status changes (e.g., from "PENDING" to "IN_PROGRESS" or "COMPLETED"), notifications are sent to:
- The task creator (if they're not the one making the change)
- The task assignee (if they're not the one making the change)

### 3. Due Date Approaching

The system checks for tasks with approaching due dates and sends notifications to the assigned users:
- 3 days before the due date
- 1 day before the due date
- On the due date (overdue notification)

This is handled by a scheduled job that runs daily at 9:00 AM.

### 4. New Comments

When a user adds a comment to a task, notifications are sent to:
- The task creator (if they're not the one commenting)
- The task assignee (if they're not the one commenting)

Comments from managers or administrators are highlighted with special "Important" notifications to ensure they receive proper attention. These notifications:
- Have a "WARNING" priority level
- Include a distinct title indicating management involvement
- Clearly identify whether the comment is from a Manager or Admin

### 5. Task Expedite Requests

When a manager or administrator requests to expedite a task, urgent notifications are sent to:
- The task assignee
- The task creator (if different from the assignee and requester)

These urgent notifications:
- Have a "WARNING" priority level
- Include a distinct "URGENT" title
- Display the expedite message
- Identify the role of the person requesting expedition (Admin or Manager)

Additionally, a comment with the expedite message is automatically added to the task with a warning symbol (⚠️).

### 6. Completion Percentage Updates

When a task's completion percentage is updated, notifications are sent to:
- The task creator (if they're not the one updating)
- The task assignee (if they're not the one updating)

## Manual Notification Creation

Administrators and managers can also manually create notifications through the API:
- For a specific user
- For all users in the system

## Technical Implementation

The notification system consists of:

1. **Database Model**: The `Notification` model in the Prisma schema
2. **Utility Functions**: Helper functions in `src/utils/notificationUtils.ts`
3. **API Endpoints**: Endpoints for retrieving, creating, and managing notifications
4. **UI Components**: Components for displaying notifications to users
5. **Scheduled Jobs**: For checking due dates and sending notifications

## Notification Lifecycle

1. **Creation**: Notifications are created automatically by system events or manually by admins/managers
2. **Delivery**: Notifications appear in the user's notification panel
3. **Reading**: Users can mark notifications as read
4. **Deletion**: Users can delete notifications they no longer need

## Future Enhancements

Potential future enhancements to the notification system:
- Email notifications for important events
- Push notifications for mobile users
- Notification preferences to allow users to customize which notifications they receive
- Real-time notifications using WebSockets
