'use client'

import { cn } from '@/lib/utils'

interface KPICardProps {
  title: string
  value: number
  format?: 'currency' | 'number'
  trend?: 'up' | 'down' | 'neutral'
  subtitle?: string
  className?: string
}

export function formatINR(amount: number): string {
  const absAmount = Math.abs(amount)

  if (absAmount >= 10000000) {
    // Crores
    return `${amount < 0 ? '-' : ''}₹${(absAmount / 10000000).toFixed(2)} Cr`
  } else if (absAmount >= 100000) {
    // Lakhs
    return `${amount < 0 ? '-' : ''}₹${(absAmount / 100000).toFixed(2)} L`
  } else {
    // Regular formatting
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount)
  }
}

export function KPICard({ title, value, format = 'currency', trend = 'neutral', subtitle, className }: KPICardProps) {
  const trendColors = {
    up: 'text-green-600 dark:text-green-400',
    down: 'text-red-600 dark:text-red-400',
    neutral: 'text-gray-600 dark:text-gray-400',
  }

  const trendIcons = {
    up: '↑',
    down: '↓',
    neutral: '',
  }

  const displayValue = format === 'currency' ? formatINR(value) : value.toLocaleString('en-IN')

  return (
    <div className={cn(
      'bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6',
      className
    )}>
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{title}</p>
      <p className={cn('text-2xl font-bold', trendColors[trend])}>
        {trendIcons[trend]} {displayValue}
      </p>
      {subtitle && (
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{subtitle}</p>
      )}
    </div>
  )
}
