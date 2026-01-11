/**
 * Toast notification store for programmatic triggering
 * Manages a stack of toast notifications with auto-dismiss and manual dismiss capabilities
 */

// Toast variant types
export type ToastVariant = 'success' | 'warning' | 'error' | 'info';

// Toast interface
export interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
  duration: number; // Auto-dismiss duration in milliseconds
}

// Toast options for creating new toasts
export interface ToastOptions {
  message: string;
  variant?: ToastVariant;
  duration?: number;
}

// Default auto-dismiss duration (4 seconds)
const DEFAULT_DURATION = 4000;

// Store for toast notifications (using a simple array with reactive updates)
let toasts: Toast[] = $state([]);
let listeners: Array<(toasts: Toast[]) => void> = [];

/**
 * Generate unique ID for each toast
 */
function generateId(): string {
  return `toast-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Notify all listeners of toast state changes
 */
function notifyListeners(): void {
  listeners.forEach(listener => listener([...toasts]));
}

/**
 * Subscribe to toast changes
 */
export function subscribeToasts(callback: (toasts: Toast[]) => void): () => void {
  listeners.push(callback);
  // Immediately call with current state
  callback([...toasts]);

  // Return unsubscribe function
  return () => {
    listeners = listeners.filter(l => l !== callback);
  };
}

/**
 * Get current toasts (snapshot)
 */
export function getToasts(): Toast[] {
  return [...toasts];
}

/**
 * Add a new toast notification
 */
export function addToast(options: ToastOptions): string {
  const id = generateId();
  const toast: Toast = {
    id,
    message: options.message,
    variant: options.variant || 'info',
    duration: options.duration ?? DEFAULT_DURATION
  };

  toasts = [...toasts, toast];
  notifyListeners();

  // Set up auto-dismiss if duration > 0
  if (toast.duration > 0) {
    setTimeout(() => {
      dismissToast(id);
    }, toast.duration);
  }

  return id;
}

/**
 * Dismiss a specific toast by ID
 */
export function dismissToast(id: string): void {
  toasts = toasts.filter(t => t.id !== id);
  notifyListeners();
}

/**
 * Dismiss all toasts
 */
export function dismissAllToasts(): void {
  toasts = [];
  notifyListeners();
}

// Convenience functions for each toast variant

/**
 * Show a success toast (green)
 */
export function showSuccess(message: string, duration?: number): string {
  return addToast({ message, variant: 'success', duration });
}

/**
 * Show a warning toast (amber)
 */
export function showWarning(message: string, duration?: number): string {
  return addToast({ message, variant: 'warning', duration });
}

/**
 * Show an error toast (red)
 */
export function showError(message: string, duration?: number): string {
  return addToast({ message, variant: 'error', duration });
}

/**
 * Show an info toast (blue)
 */
export function showInfo(message: string, duration?: number): string {
  return addToast({ message, variant: 'info', duration });
}
