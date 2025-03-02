import { useState, useCallback } from 'react';

interface ToastProps {
  title: string;
  description: string;
  variant?: 'default' | 'destructive';
}

interface Toast extends ToastProps {
  id: string;
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback(
    ({ title, description, variant = 'default' }: ToastProps) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast = { id, title, description, variant };
      
      setToasts((prevToasts) => [...prevToasts, newToast]);
      
      // Auto-dismiss after 5 seconds
      setTimeout(() => {
        setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
      }, 5000);
      
      return id;
    },
    []
  );

  const dismiss = useCallback((id: string) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  }, []);

  // Component to render toasts
  const ToastContainer = () => (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`p-4 rounded-md shadow-md max-w-sm ${
            toast.variant === 'destructive' ? 'bg-red-600 text-white' : 'bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100'
          }`}
        >
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-medium">{toast.title}</h3>
              <p className="text-sm">{toast.description}</p>
            </div>
            <button
              onClick={() => dismiss(toast.id)}
              className="ml-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  return { toast, dismiss, ToastContainer };
}
