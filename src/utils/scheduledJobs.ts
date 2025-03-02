import { createNotification } from './api';

/**
 * Checks for tasks with approaching due dates and sends notifications
 * This function should be called by a scheduled job or cron task
 */
export async function checkDueDates() {
  try {
    // Call the API endpoint to check due dates
    const response = await fetch('/api/notifications/check-due-dates', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to check due dates');
    }

    const data = await response.json();
    console.log('Due date check completed:', data);
    return data;
  } catch (error) {
    console.error('Error in scheduled due date check:', error);
  }
}

/**
 * Sets up scheduled jobs to run at specified intervals
 */
export function setupScheduledJobs() {
  // Check for due dates once a day at 9:00 AM
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  tomorrow.setHours(9, 0, 0, 0);
  
  // Calculate milliseconds until 9:00 AM tomorrow
  const msUntil9AM = tomorrow.getTime() - now.getTime();
  
  // Schedule the first check
  setTimeout(() => {
    // Run the check
    checkDueDates();
    
    // Then set up a daily interval
    setInterval(checkDueDates, 24 * 60 * 60 * 1000);
  }, msUntil9AM);
  
  console.log(`Scheduled due date check to run at ${tomorrow.toLocaleTimeString()} and daily thereafter`);
}
