import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Utility function to merge Tailwind CSS classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a number as Indian Rupees with proper formatting
 * Uses the Indian numbering system (lakhs, crores)
 */
export function formatINR(amount: number, options?: { useLakhCrore?: boolean }): string {
  const { useLakhCrore = false } = options || {}

  if (useLakhCrore) {
    return formatLakhCrore(amount)
  }

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

/**
 * Format number in Indian Lakh/Crore notation
 * e.g., 10,00,000 = 10L, 1,00,00,000 = 1Cr
 */
export function formatLakhCrore(amount: number): string {
  const absAmount = Math.abs(amount)
  const sign = amount < 0 ? '-' : ''

  if (absAmount >= 10000000) {
    // Crores (1 Cr = 10,000,000)
    return `${sign}₹${(absAmount / 10000000).toFixed(2)} Cr`
  } else if (absAmount >= 100000) {
    // Lakhs (1 L = 100,000)
    return `${sign}₹${(absAmount / 100000).toFixed(2)} L`
  } else if (absAmount >= 1000) {
    // Thousands
    return `${sign}₹${(absAmount / 1000).toFixed(2)} K`
  }

  return `${sign}₹${absAmount.toFixed(2)}`
}

/**
 * Format a date in Indian format (DD/MM/YYYY)
 */
export function formatDateIN(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

/**
 * Format a date as a readable string
 */
export function formatDateLong(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/**
 * Parse an Indian date format (DD/MM/YYYY) to Date object
 */
export function parseDateIN(dateStr: string): Date | null {
  const parts = dateStr.split('/')
  if (parts.length !== 3) return null

  const day = parseInt(parts[0], 10)
  const month = parseInt(parts[1], 10) - 1 // JS months are 0-indexed
  const year = parseInt(parts[2], 10)

  const date = new Date(year, month, day)
  if (isNaN(date.getTime())) return null

  return date
}

/**
 * Calculate percentage change between two values
 */
export function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return ((current - previous) / Math.abs(previous)) * 100
}

/**
 * Get the current financial year in India (April - March)
 */
export function getCurrentFinancialYear(): { start: Date; end: Date; label: string } {
  const now = new Date()
  const currentMonth = now.getMonth() // 0-indexed
  const currentYear = now.getFullYear()

  // Financial year in India runs from April 1 to March 31
  const startYear = currentMonth >= 3 ? currentYear : currentYear - 1
  const endYear = startYear + 1

  return {
    start: new Date(startYear, 3, 1), // April 1
    end: new Date(endYear, 2, 31), // March 31
    label: `FY ${startYear}-${endYear.toString().slice(-2)}`,
  }
}

/**
 * GST rates in India
 */
export const GST_RATES = [0, 5, 12, 18, 28] as const
export type GSTRate = (typeof GST_RATES)[number]

/**
 * GST types
 */
export type GSTType = 'cgst_sgst' | 'igst'

/**
 * TDS sections commonly used in India
 */
export const TDS_SECTIONS = {
  '194A': { name: 'Interest', rate: 10 },
  '194C': { name: 'Contractor', rate: 1 }, // 1% for individual, 2% for others
  '194H': { name: 'Commission', rate: 5 },
  '194I': { name: 'Rent', rate: 10 },
  '194J': { name: 'Professional Fees', rate: 10 },
  '194Q': { name: 'Purchase of Goods', rate: 0.1 },
} as const

export type TDSSection = keyof typeof TDS_SECTIONS

/**
 * Calculate GST components from total amount
 */
export function calculateGSTComponents(
  totalAmount: number,
  gstRate: GSTRate,
  gstType: GSTType
): {
  baseAmount: number
  cgst: number
  sgst: number
  igst: number
  totalGST: number
} {
  const gstMultiplier = gstRate / 100
  const baseAmount = totalAmount / (1 + gstMultiplier)
  const totalGST = totalAmount - baseAmount

  if (gstType === 'igst') {
    return {
      baseAmount,
      cgst: 0,
      sgst: 0,
      igst: totalGST,
      totalGST,
    }
  }

  // For CGST/SGST, each is half of the total GST
  const halfGST = totalGST / 2
  return {
    baseAmount,
    cgst: halfGST,
    sgst: halfGST,
    igst: 0,
    totalGST,
  }
}
