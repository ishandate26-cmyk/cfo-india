import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001'

// Mock AI responses based on query patterns
// In production, this would call Claude API
async function generateMockResponse(query: string): Promise<{ response: string; data?: unknown }> {
  const lowerQuery = query.toLowerCase()

  // Fetch data from Supabase
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const { data: transactions } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', DEMO_USER_ID)
    .order('date', { ascending: false })

  const txns = transactions || []

  const thisMonthTransactions = txns.filter(
    (t) => new Date(t.date) >= startOfMonth
  )

  const thisMonthRevenue = thisMonthTransactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)

  const thisMonthExpenses = thisMonthTransactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)

  const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const { data: gstSummary } = await supabase
    .from('gst_summaries')
    .select('*')
    .eq('period', currentPeriod)
    .eq('user_id', DEMO_USER_ID)
    .single()

  // Pattern matching for mock responses
  if (lowerQuery.includes('biggest expense') || lowerQuery.includes('top expense') || lowerQuery.includes('largest expense')) {
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

    if (topExpenses.length === 0) {
      return {
        response: "You don't have any expense data yet. Import some transactions to see your expense breakdown.",
      }
    }

    const formatted = topExpenses
      .map(([cat, amt], i) => `${i + 1}. ${cat}: ₹${(amt / 100000).toFixed(2)} Lakhs`)
      .join('\n')

    return {
      response: `Your top ${topExpenses.length} expense categories are:\n\n${formatted}\n\n${topExpenses[0][0]} is your biggest expense, accounting for ₹${(topExpenses[0][1] / 100000).toFixed(2)} Lakhs.`,
      data: topExpenses,
    }
  }

  if (lowerQuery.includes('gst') && (lowerQuery.includes('owe') || lowerQuery.includes('liability') || lowerQuery.includes('payable'))) {
    const liability = gstSummary?.net_liability || 0
    const formattedLiability = `₹${(liability / 1000).toFixed(2)}K`

    if (liability > 0) {
      return {
        response: `Your GST liability for this month is **${formattedLiability}**.\n\nBreakdown:\n- Output GST (collected): ₹${((gstSummary?.output_cgst || 0) + (gstSummary?.output_sgst || 0) + (gstSummary?.output_igst || 0)).toFixed(0)}\n- Input GST (credit): ₹${((gstSummary?.input_cgst || 0) + (gstSummary?.input_sgst || 0) + (gstSummary?.input_igst || 0)).toFixed(0)}\n\nGSTR-3B is due on the 20th of next month.`,
        data: gstSummary,
      }
    } else if (liability < 0) {
      return {
        response: `You have no GST liability this month. In fact, you have an input credit of ₹${Math.abs(liability).toFixed(0)} that can be carried forward.`,
        data: gstSummary,
      }
    } else {
      return {
        response: `No GST transactions recorded for this month yet. Import transactions with GST information to track your liability.`,
      }
    }
  }

  if (lowerQuery.includes('revenue') && lowerQuery.includes('trend')) {
    const monthlyRevenue = []
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)
      const monthName = monthStart.toLocaleDateString('en-IN', { month: 'short' })

      const revenue = txns
        .filter((t) => {
          const date = new Date(t.date)
          return date >= monthStart && date <= monthEnd && t.type === 'income'
        })
        .reduce((sum, t) => sum + t.amount, 0)

      monthlyRevenue.push({ month: monthName, revenue })
    }

    if (monthlyRevenue.every(m => m.revenue === 0)) {
      return {
        response: "No revenue data available yet. Import your transactions to see revenue trends.",
      }
    }

    const firstNonZero = monthlyRevenue.find(m => m.revenue > 0)?.revenue || 1
    const trend = monthlyRevenue[5].revenue > firstNonZero ? 'increasing' : 'decreasing'
    const changePercent = ((monthlyRevenue[5].revenue - firstNonZero) / firstNonZero * 100).toFixed(1)

    return {
      response: `Your revenue has been **${trend}** over the last 6 months.\n\nMonthly breakdown:\n${monthlyRevenue.map(m => `- ${m.month}: ₹${(m.revenue / 100000).toFixed(2)}L`).join('\n')}\n\nOverall change: ${changePercent}%`,
      data: monthlyRevenue,
    }
  }

  if (lowerQuery.includes('profitable') || lowerQuery.includes('profit')) {
    if (thisMonthRevenue === 0 && thisMonthExpenses === 0) {
      return {
        response: "No financial data available for this month yet. Import your transactions to see profitability analysis.",
      }
    }

    const netProfit = thisMonthRevenue - thisMonthExpenses
    const isProfitable = netProfit > 0

    return {
      response: isProfitable
        ? `Yes! You are **profitable** this month with a net profit of ₹${(netProfit / 100000).toFixed(2)} Lakhs.\n\n- Revenue: ₹${(thisMonthRevenue / 100000).toFixed(2)}L\n- Expenses: ₹${(thisMonthExpenses / 100000).toFixed(2)}L\n- Profit margin: ${((netProfit / thisMonthRevenue) * 100).toFixed(1)}%`
        : `This month shows a net loss of ₹${(Math.abs(netProfit) / 100000).toFixed(2)} Lakhs.\n\n- Revenue: ₹${(thisMonthRevenue / 100000).toFixed(2)}L\n- Expenses: ₹${(thisMonthExpenses / 100000).toFixed(2)}L\n\nConsider reviewing your expense categories for optimization opportunities.`,
      data: { revenue: thisMonthRevenue, expenses: thisMonthExpenses, profit: netProfit },
    }
  }

  if (lowerQuery.includes('cash') && (lowerQuery.includes('balance') || lowerQuery.includes('position'))) {
    const totalIncome = txns
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)
    const totalExpenses = txns
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)
    const cashBalance = totalIncome - totalExpenses

    if (totalIncome === 0 && totalExpenses === 0) {
      return {
        response: "No transaction data available yet. Import your transactions to see your cash position.",
      }
    }

    const avgMonthlyExpense = totalExpenses / 12 || 1
    const runway = Math.floor(cashBalance / avgMonthlyExpense)

    return {
      response: `Your current cash position is **₹${(cashBalance / 100000).toFixed(2)} Lakhs**.\n\nBased on your average monthly expenses of ₹${(avgMonthlyExpense / 100000).toFixed(2)}L, you have approximately **${runway} months of runway**.`,
      data: { cashBalance, avgMonthlyExpense, runway },
    }
  }

  if (lowerQuery.includes('tds')) {
    const tdsTransactions = txns.filter((t) => t.tds_section)
    const tdsBySection = new Map<string, number>()

    tdsTransactions.forEach((t) => {
      if (!t.tds_section || !t.tds_rate) return
      const tdsAmount = (t.amount * t.tds_rate) / 100
      const current = tdsBySection.get(t.tds_section) || 0
      tdsBySection.set(t.tds_section, current + tdsAmount)
    })

    const formatted = Array.from(tdsBySection.entries())
      .map(([section, amount]) => `- Section ${section}: ₹${amount.toFixed(0)}`)
      .join('\n')

    return {
      response: `Your TDS deductions breakdown:\n\n${formatted || 'No TDS deductions recorded.'}\n\nRemember to deposit TDS by the 7th of the following month.`,
      data: Object.fromEntries(tdsBySection),
    }
  }

  // Default response
  if (txns.length === 0) {
    return {
      response: `Welcome! It looks like you haven't imported any transactions yet.\n\nGo to **Transactions** page and upload a CSV to get started. Once you have data, I can help you with:\n- "What are my biggest expenses?"\n- "How much GST do I owe?"\n- "Show me revenue trend"\n- "Am I profitable this month?"\n- "What's my cash position?"`,
    }
  }

  return {
    response: `I understand you're asking about "${query}". Here's a summary of your current financial position:\n\n- This month's revenue: ₹${(thisMonthRevenue / 100000).toFixed(2)} Lakhs\n- This month's expenses: ₹${(thisMonthExpenses / 100000).toFixed(2)} Lakhs\n- Net profit: ₹${((thisMonthRevenue - thisMonthExpenses) / 100000).toFixed(2)} Lakhs\n- GST liability: ₹${((gstSummary?.net_liability || 0) / 1000).toFixed(2)}K\n\nTry asking specific questions like:\n- "What are my biggest expenses?"\n- "How much GST do I owe?"\n- "Show me revenue trend"\n- "Am I profitable this month?"`,
  }
}

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json()

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    const result = await generateMockResponse(message)

    return NextResponse.json({
      message: result.response,
      data: result.data,
      isMock: true,
    })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json({ error: 'Failed to process message' }, { status: 500 })
  }
}
