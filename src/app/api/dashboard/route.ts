import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001'

export async function GET() {
  try {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfYear = new Date(now.getFullYear(), 0, 1)

    // Get all transactions from Supabase
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', DEMO_USER_ID)
      .order('date', { ascending: false })

    if (error) throw error

    const txns = transactions || []

    // This month's totals
    const thisMonthTransactions = txns.filter(
      (t) => new Date(t.date) >= startOfMonth
    )
    const thisMonthRevenue = thisMonthTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)
    const thisMonthExpenses = thisMonthTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)

    // This year's totals
    const thisYearTransactions = txns.filter(
      (t) => new Date(t.date) >= startOfYear
    )
    const ytdRevenue = thisYearTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)
    const ytdExpenses = thisYearTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)

    // Cash balance (simplified: total income - total expenses)
    const totalIncome = txns
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)
    const totalExpenses = txns
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)
    const cashBalance = totalIncome - totalExpenses

    // Monthly data for charts (last 12 months)
    const monthlyData: Array<{
      month: string
      revenue: number
      expenses: number
    }> = []

    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)
      const monthName = monthStart.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })

      const monthTransactions = txns.filter((t) => {
        const date = new Date(t.date)
        return date >= monthStart && date <= monthEnd
      })

      const revenue = monthTransactions
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0)
      const expenses = monthTransactions
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0)

      monthlyData.push({ month: monthName, revenue, expenses })
    }

    // Top expense categories
    const expensesByCategory = new Map<string, number>()
    txns
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        const current = expensesByCategory.get(t.category) || 0
        expensesByCategory.set(t.category, current + t.amount)
      })

    const topExpenses = Array.from(expensesByCategory.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([category, amount]) => ({ category, amount }))

    // GST liability (current month)
    const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const { data: gstSummary } = await supabase
      .from('gst_summaries')
      .select('*')
      .eq('period', currentPeriod)
      .eq('user_id', DEMO_USER_ID)
      .single()

    const gstLiability = gstSummary?.net_liability || 0

    // Recent transactions
    const recentTransactions = txns.slice(0, 10).map((t) => ({
      id: t.id,
      date: t.date,
      description: t.description,
      amount: t.amount,
      type: t.type,
      category: t.category,
    }))

    return NextResponse.json({
      kpis: {
        thisMonthRevenue,
        thisMonthExpenses,
        netProfit: thisMonthRevenue - thisMonthExpenses,
        cashBalance,
        gstLiability,
        ytdRevenue,
        ytdExpenses,
      },
      monthlyData,
      topExpenses,
      recentTransactions,
    })
  } catch (error) {
    console.error('Dashboard API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}
