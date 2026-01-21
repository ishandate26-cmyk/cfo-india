import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    // Get all GST summaries
    const gstSummaries = await prisma.gSTSummary.findMany({
      orderBy: { period: 'desc' },
    })

    // Get current month's transactions with GST
    const now = new Date()
    const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

    // Get all transactions for detailed breakdown
    const transactions = await prisma.transaction.findMany({
      where: {
        gstRate: { not: null },
      },
      orderBy: { date: 'desc' },
    })

    // Calculate totals
    const totalOutputGST = gstSummaries.reduce(
      (sum, s) => sum + s.outputCGST + s.outputSGST + s.outputIGST,
      0
    )
    const totalInputGST = gstSummaries.reduce(
      (sum, s) => sum + s.inputCGST + s.inputSGST + s.inputIGST,
      0
    )
    const totalNetLiability = gstSummaries.reduce((sum, s) => sum + s.netLiability, 0)

    // Current month summary
    const currentMonthSummary = gstSummaries.find((s) => s.period === currentPeriod)

    // GST by rate breakdown (for pie chart)
    const gstByRate = new Map<number, { output: number; input: number }>()
    transactions.forEach((t) => {
      if (!t.gstRate) return
      const existing = gstByRate.get(t.gstRate) || { output: 0, input: 0 }
      const gstAmount = (t.amount * t.gstRate) / (100 + t.gstRate)

      if (t.type === 'income') {
        existing.output += gstAmount
      } else {
        existing.input += gstAmount
      }
      gstByRate.set(t.gstRate, existing)
    })

    const gstByRateArray = Array.from(gstByRate.entries())
      .map(([rate, amounts]) => ({
        rate: `${rate}%`,
        output: amounts.output,
        input: amounts.input,
        net: amounts.output - amounts.input,
      }))
      .sort((a, b) => parseInt(b.rate) - parseInt(a.rate))

    // Monthly trend for chart
    const monthlyTrend = gstSummaries
      .slice(0, 12)
      .reverse()
      .map((s) => {
        const [year, month] = s.period.split('-')
        const date = new Date(parseInt(year), parseInt(month) - 1)
        return {
          month: date.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }),
          output: s.outputCGST + s.outputSGST + s.outputIGST,
          input: s.inputCGST + s.inputSGST + s.inputIGST,
          liability: s.netLiability,
        }
      })

    // Recent GST transactions
    const recentGSTTransactions = transactions.slice(0, 15).map((t) => {
      const gstAmount = t.gstRate ? (t.amount * t.gstRate) / (100 + t.gstRate) : 0
      return {
        id: t.id,
        date: t.date,
        description: t.description,
        partyName: t.partyName,
        partyGstin: t.partyGstin,
        amount: t.amount,
        gstRate: t.gstRate,
        gstType: t.gstType,
        gstAmount,
        type: t.type,
      }
    })

    // Filing due dates (simplified - actual dates depend on turnover)
    const getNextFilingDate = () => {
      const now = new Date()
      // GSTR-3B is due on 20th of next month for most businesses
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 20)
      return nextMonth
    }

    return NextResponse.json({
      summary: {
        totalOutputGST,
        totalInputGST,
        totalNetLiability,
        currentMonth: currentMonthSummary || {
          outputCGST: 0,
          outputSGST: 0,
          outputIGST: 0,
          inputCGST: 0,
          inputSGST: 0,
          inputIGST: 0,
          netLiability: 0,
        },
      },
      gstByRate: gstByRateArray,
      monthlyTrend,
      recentTransactions: recentGSTTransactions,
      filing: {
        gstr3bDue: getNextFilingDate(),
        gstr1Due: new Date(now.getFullYear(), now.getMonth() + 1, 11), // 11th of next month
      },
    })
  } catch (error) {
    console.error('GST API error:', error)
    return NextResponse.json({ error: 'Failed to fetch GST data' }, { status: 500 })
  }
}
