import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// Mock AI responses based on query patterns
// In production, this would call Claude API
async function generateMockResponse(query: string): Promise<{ response: string; data?: unknown }> {
  const lowerQuery = query.toLowerCase()

  // Fetch some real data for context
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const transactions = await prisma.transaction.findMany({
    orderBy: { date: 'desc' },
  })

  const thisMonthTransactions = transactions.filter(
    (t) => new Date(t.date) >= startOfMonth
  )

  const thisMonthRevenue = thisMonthTransactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)

  const thisMonthExpenses = thisMonthTransactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)

  const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const gstSummary = await prisma.gSTSummary.findUnique({
    where: { period: currentPeriod },
  })

  // Pattern matching for mock responses
  if (lowerQuery.includes('biggest expense') || lowerQuery.includes('top expense') || lowerQuery.includes('largest expense')) {
    const expensesByCategory = new Map<string, number>()
    transactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        const current = expensesByCategory.get(t.category) || 0
        expensesByCategory.set(t.category, current + t.amount)
      })

    const topExpenses = Array.from(expensesByCategory.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)

    const formatted = topExpenses
      .map(([cat, amt], i) => `${i + 1}. ${cat}: ₹${(amt / 100000).toFixed(2)} Lakhs`)
      .join('\n')

    return {
      response: `Your top 5 expense categories are:\n\n${formatted}\n\n${topExpenses[0][0]} is your biggest expense, accounting for ₹${(topExpenses[0][1] / 100000).toFixed(2)} Lakhs.`,
      data: topExpenses,
    }
  }

  if (lowerQuery.includes('gst') && (lowerQuery.includes('owe') || lowerQuery.includes('liability') || lowerQuery.includes('payable'))) {
    const liability = gstSummary?.netLiability || 0
    const formattedLiability = `₹${(liability / 1000).toFixed(2)}K`

    if (liability > 0) {
      return {
        response: `Your GST liability for this month is **${formattedLiability}**.\n\nBreakdown:\n- Output GST (collected): ₹${((gstSummary?.outputCGST || 0) + (gstSummary?.outputSGST || 0) + (gstSummary?.outputIGST || 0)).toFixed(0)}\n- Input GST (credit): ₹${((gstSummary?.inputCGST || 0) + (gstSummary?.inputSGST || 0) + (gstSummary?.inputIGST || 0)).toFixed(0)}\n\nGSTR-3B is due on the 20th of next month.`,
        data: gstSummary,
      }
    } else {
      return {
        response: `You have no GST liability this month. In fact, you have an input credit of ₹${Math.abs(liability).toFixed(0)} that can be carried forward.`,
        data: gstSummary,
      }
    }
  }

  if (lowerQuery.includes('revenue') && lowerQuery.includes('trend')) {
    const monthlyRevenue = []
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)
      const monthName = monthStart.toLocaleDateString('en-IN', { month: 'short' })

      const revenue = transactions
        .filter((t) => {
          const date = new Date(t.date)
          return date >= monthStart && date <= monthEnd && t.type === 'income'
        })
        .reduce((sum, t) => sum + t.amount, 0)

      monthlyRevenue.push({ month: monthName, revenue })
    }

    const trend = monthlyRevenue[5].revenue > monthlyRevenue[0].revenue ? 'increasing' : 'decreasing'
    const changePercent = ((monthlyRevenue[5].revenue - monthlyRevenue[0].revenue) / monthlyRevenue[0].revenue * 100).toFixed(1)

    return {
      response: `Your revenue has been **${trend}** over the last 6 months.\n\nMonthly breakdown:\n${monthlyRevenue.map(m => `- ${m.month}: ₹${(m.revenue / 100000).toFixed(2)}L`).join('\n')}\n\nOverall change: ${changePercent}%`,
      data: monthlyRevenue,
    }
  }

  if (lowerQuery.includes('profitable') || lowerQuery.includes('profit')) {
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
    const totalIncome = transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)
    const totalExpenses = transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)
    const cashBalance = totalIncome - totalExpenses

    const avgMonthlyExpense = totalExpenses / 12
    const runway = Math.floor(cashBalance / avgMonthlyExpense)

    return {
      response: `Your current cash position is **₹${(cashBalance / 100000).toFixed(2)} Lakhs**.\n\nBased on your average monthly expenses of ₹${(avgMonthlyExpense / 100000).toFixed(2)}L, you have approximately **${runway} months of runway**.`,
      data: { cashBalance, avgMonthlyExpense, runway },
    }
  }

  if (lowerQuery.includes('tds')) {
    const tdsTransactions = transactions.filter((t) => t.tdsSection)
    const tdsBySection = new Map<string, number>()

    tdsTransactions.forEach((t) => {
      if (!t.tdsSection || !t.tdsRate) return
      const tdsAmount = (t.amount * t.tdsRate) / 100
      const current = tdsBySection.get(t.tdsSection) || 0
      tdsBySection.set(t.tdsSection, current + tdsAmount)
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
  return {
    response: `I understand you're asking about "${query}". Here's a summary of your current financial position:\n\n- This month's revenue: ₹${(thisMonthRevenue / 100000).toFixed(2)} Lakhs\n- This month's expenses: ₹${(thisMonthExpenses / 100000).toFixed(2)} Lakhs\n- Net profit: ₹${((thisMonthRevenue - thisMonthExpenses) / 100000).toFixed(2)} Lakhs\n- GST liability: ₹${((gstSummary?.netLiability || 0) / 1000).toFixed(2)}K\n\nTry asking specific questions like:\n- "What are my biggest expenses?"\n- "How much GST do I owe?"\n- "Show me revenue trend"\n- "Am I profitable this month?"`,
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
      isMock: true, // Flag to indicate this is a mock response
    })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json({ error: 'Failed to process message' }, { status: 500 })
  }
}
