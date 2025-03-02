import { Task } from '../types/task';

/**
 * Exports tasks to a CSV file
 * @param tasks Array of task objects to export
 */
export const exportTasksToCSV = (tasks: Task[]) => {
  // Define CSV headers
  const headers = [
    'ID',
    'Title',
    'Description',
    'Status',
    'Priority',
    'Category',
    'Assigned To',
    'Created At',
    'Updated At',
    'Due Date'
  ];

  // Convert tasks to CSV rows
  const rows = tasks.map(task => [
    task.id,
    task.title,
    task.description || '',
    task.status,
    task.priority,
    task.category || '',
    task.assignedTo?.username || '',
    formatDate(task.createdAt),
    formatDate(task.updatedAt),
    task.dueDate ? formatDate(task.dueDate) : ''
  ]);

  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map(row => 
      row.map(cell => 
        // Escape quotes and wrap in quotes if contains comma or quotes
        typeof cell === 'string' && (cell.includes(',') || cell.includes('"')) 
          ? `"${cell.replace(/"/g, '""')}"` 
          : cell
      ).join(',')
    )
  ].join('\n');

  // Create and download the file
  downloadFile(csvContent, 'tasks.csv', 'text/csv');
};

/**
 * Exports tasks to an Excel file (using CSV format with .xlsx extension)
 * @param tasks Array of task objects to export
 */
export const exportTasksToExcel = (tasks: Task[]) => {
  // For simplicity, we're using the same CSV format but with .xlsx extension
  // In a production app, you might want to use a proper Excel library
  const csvContent = generateCSVContent(tasks);
  downloadFile(csvContent, 'tasks.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
};

/**
 * Exports tasks to a PDF file using HTML and browser printing
 * @param tasks Array of task objects to export
 * @param filters Current filter settings applied to the tasks
 */
export const exportTasksToPDF = async (tasks: Task[], filters?: any) => {
  try {
    console.log('Starting PDF generation with HTML approach...');
    
    // Create a simple HTML table from the tasks
    let htmlContent = `
      <html>
        <head>
          <title>Tasks Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background-color: #4285f4; color: white; font-weight: bold; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            tr:nth-child(even) { background-color: #f2f2f2; }
            h1 { color: #333; }
            .filters { margin: 20px 0; padding: 10px; background-color: #f9f9f9; border: 1px solid #ddd; }
            .filters h3 { margin-top: 0; }
          </style>
        </head>
        <body>
          <h1>Tasks Report</h1>
          <p>Generated on: ${new Date().toLocaleDateString()}</p>
    `;
    
    // Add filter information if available
    if (filters) {
      htmlContent += `<div class="filters"><h3>Applied Filters:</h3><ul>`;
      
      if (filters.status) {
        htmlContent += `<li>Status: ${filters.status}</li>`;
      }
      
      if (filters.priority) {
        htmlContent += `<li>Priority: ${filters.priority}</li>`;
      }
      
      if (filters.category) {
        htmlContent += `<li>Category: ${filters.category}</li>`;
      }
      
      if (filters.assignedToId) {
        htmlContent += `<li>Assigned To: ${filters.assignedToId}</li>`;
      }
      
      if (filters.sortBy) {
        htmlContent += `<li>Sort By: ${filters.sortBy} (${filters.sortOrder || 'asc'})</li>`;
      }
      
      htmlContent += `</ul></div>`;
    }
    
    // Add table
    htmlContent += `
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Title</th>
            <th>Status</th>
            <th>Priority</th>
            <th>Assigned To</th>
            <th>Due Date</th>
          </tr>
        </thead>
        <tbody>
    `;
    
    // Add rows
    tasks.forEach((task, index) => {
      htmlContent += `
        <tr>
          <td>${index + 1}</td>
          <td>${task.title}</td>
          <td>${task.status}</td>
          <td>${task.priority}</td>
          <td>${task.assignedTo?.username || 'Unassigned'}</td>
          <td>${task.dueDate ? formatDate(task.dueDate) : 'N/A'}</td>
        </tr>
      `;
    });
    
    // Close table and HTML
    htmlContent += `
        </tbody>
      </table>
      </body>
      </html>
    `;
    
    // Create a Blob with the HTML content
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    // Open the HTML in a new window for printing
    const printWindow = window.open(url, '_blank');
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
        setTimeout(() => {
          URL.revokeObjectURL(url);
        }, 100);
      };
    } else {
      console.error('Could not open print window');
      alert('Please allow pop-ups to print the PDF');
      URL.revokeObjectURL(url);
      throw new Error('Could not open print window');
    }
    
    console.log('PDF generation completed successfully');
    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('There was an error generating the PDF. Please try again.');
    throw new Error('Failed to generate PDF');
  }
};

/**
 * Helper function to generate CSV content
 * @param tasks Array of task objects
 * @returns CSV content as string
 */
const generateCSVContent = (tasks: Task[]): string => {
  // Define CSV headers
  const headers = [
    'ID',
    'Title',
    'Description',
    'Status',
    'Priority',
    'Category',
    'Assigned To',
    'Created At',
    'Updated At',
    'Due Date'
  ];

  // Convert tasks to CSV rows
  const rows = tasks.map(task => [
    task.id,
    task.title,
    task.description || '',
    task.status,
    task.priority,
    task.category || '',
    task.assignedTo?.username || '',
    formatDate(task.createdAt),
    formatDate(task.updatedAt),
    task.dueDate ? formatDate(task.dueDate) : ''
  ]);

  // Combine headers and rows
  return [
    headers.join(','),
    ...rows.map(row => 
      row.map(cell => 
        // Escape quotes and wrap in quotes if contains comma or quotes
        typeof cell === 'string' && (cell.includes(',') || cell.includes('"')) 
          ? `"${cell.replace(/"/g, '""')}"` 
          : cell
      ).join(',')
    )
  ].join('\n');
};

/**
 * Helper function to format dates
 * @param dateString Date string to format
 * @returns Formatted date string
 */
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString();
};

/**
 * Helper function to download a file
 * @param content File content
 * @param fileName Name of the file to download
 * @param contentType MIME type of the file
 */
const downloadFile = (content: string, fileName: string, contentType: string): void => {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
