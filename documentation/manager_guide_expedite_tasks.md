# Manager's Guide: How to Expedite Tasks

This guide explains how managers and administrators can expedite tasks in the FreeMind task management system.

## What is Task Expedition?

Task expedition is a feature that allows managers and administrators to flag tasks as urgent, sending special notifications to the task assignee and creator. This helps ensure that critical tasks receive immediate attention.

## Who Can Expedite Tasks?

Only users with the following roles can expedite tasks:
- Administrators
- Managers

Regular users cannot access this feature.

## How to Expedite a Task

1. **Navigate to the Task Detail Page**
   - Go to the Tasks page
   - Click on the task you want to expedite to open its details

2. **Click the "Expedite Task" Button**
   - Look for the orange "Expedite Task" button in the task details
   - This button is only visible to managers and administrators

   ![Expedite Button](../public/images/docs/expedite-button.png)

3. **Provide an Expedite Message**
   - A form will appear where you can explain why the task needs to be expedited
   - Be clear and specific about:
     - Why the task is urgent
     - When it needs to be completed
     - Any additional context that will help the assignee understand the urgency

   ![Expedite Form](../public/images/docs/expedite-form.png)

4. **Submit the Request**
   - Click the "Send Urgent Request" button
   - The system will:
     - Add a comment to the task with your message (prefixed with a warning symbol ⚠️)
     - Send urgent notifications to the task assignee and creator
     - Create an audit log entry recording your action

## What Happens After Expediting?

When you expedite a task:

1. **Notifications**: The task assignee and creator receive urgent notifications with:
   - A "WARNING" priority level
   - A distinct "URGENT" title
   - Your expedite message
   - Your role (Admin or Manager)

2. **Task Comment**: A comment is automatically added to the task with:
   - A warning symbol (⚠️)
   - Your expedite message
   - This ensures the urgency is visible in the task history

3. **Audit Log**: The system records:
   - Who requested the expedition
   - When it was requested
   - The message provided

## Best Practices for Task Expedition

1. **Use Sparingly**: Reserve the expedite feature for genuinely urgent tasks to maintain its effectiveness
2. **Be Specific**: Clearly explain why the task is urgent and when it needs to be completed
3. **Follow Up**: After expediting, consider direct communication with the assignee for critical tasks
4. **Provide Resources**: If possible, offer additional resources to help complete the expedited task

## Technical Notes

- The expedite feature uses the `/api/tasks/expedite/[id]` endpoint
- Only users with ADMIN or MANAGER roles can access this endpoint
- Expedite requests are tracked in the audit log with the action type "EXPEDITE"
