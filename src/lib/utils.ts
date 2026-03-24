import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount)
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d)
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    active: 'text-green-600 bg-green-50',
    occupied: 'text-green-600 bg-green-50',
    completed: 'text-green-600 bg-green-50',
    paid: 'text-green-600 bg-green-50',
    functioning: 'text-green-600 bg-green-50',
    open: 'text-blue-600 bg-blue-50',
    draft: 'text-gray-600 bg-gray-50',
    in_progress: 'text-orange-600 bg-orange-50',
    warning: 'text-orange-600 bg-orange-50',
    pending: 'text-orange-600 bg-orange-50',
    vacant: 'text-yellow-600 bg-yellow-50',
    renovation: 'text-yellow-600 bg-yellow-50',
    critical: 'text-red-600 bg-red-50',
    overdue: 'text-red-600 bg-red-50',
    offline: 'text-red-600 bg-red-50',
    defective: 'text-red-600 bg-red-50',
    failed: 'text-red-600 bg-red-50',
    cancelled: 'text-gray-500 bg-gray-50',
    terminated: 'text-gray-500 bg-gray-50',
    expired: 'text-gray-500 bg-gray-50',
  }
  return colors[status] || 'text-gray-600 bg-gray-50'
}

export function getPriorityColor(priority: string): string {
  const colors: Record<string, string> = {
    low: 'text-blue-600 bg-blue-50',
    medium: 'text-yellow-600 bg-yellow-50',
    high: 'text-orange-600 bg-orange-50',
    critical: 'text-red-600 bg-red-50',
  }
  return colors[priority] || 'text-gray-600 bg-gray-50'
}
