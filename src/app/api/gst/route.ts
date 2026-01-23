import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001'

export async function GET() {
  try {
    // Get all GST summaries from Supabase
    const { data: gstSummaries, error: gstError } = await supabase
      .from('gst_summaries')
      .select('*')
      .eq('user_id', DEMO_USER_ID)
      .order('period', { ascending: false })

    if (gstError) throw gstError

    const summaries = gstSummaries || []

    // Get all transactions with GST
    const { data: transactions, error: txnError } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', DEMO_USER_ID)
      .not('gst_rate', 'is', null)
      .order('date', { ascending: false })

    if (txnError) throw txnError

    const txns = transactions || []

    // Current month period
    const now = new Date()
    const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

    // Calculate totals
    const totalOutputGST = summaries.reduce(
      (sum, s) => sum + (s.output_cgst || 0) + (s.output_sgst || 0) + (s.output_igst || 0),
      0
    )
    const totalInputGST = summaries.reduce(
      (sum, s) => sum + (s.input_cgst || 0) + (s.input_sgst || 0) + (s.input_igst || 0),
      0
    )
    const totalNetLiability = summaries.reduce((sum, s) => sum + (s.net_liability || 0), 0)

    // Current month summary
    const currentMonthSummary = summaries.find((s) => s.period === currentPeriod)

    // GST by rate breakdown (for pie chart)
    const gstByRate = new Map<number, { output: number; input: number }>()
    txns.forEach((t) => {
      if (!t.gst_rate) return
      const existing = gstByRate.get(t.gst_rate) || { output: 0, input: 0 }
      const gstAmount = (t.amount * t.gst_rate) / (100 + t.gst_rate)

      if (t.type === 'income') {
        existing.output += gstAmount
      } else {
        existing.input += gstAmount
      }
      gstByRate.set(t.gst_rate, existing)
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
    const monthlyTrend = summaries
      .slice(0, 12)
      .reverse()
      .map((s) => {
        const [year, month] = s.period.split('-')
        const date = new Date(parseInt(year), parseInt(month) - 1)
        return {
          month: date.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }),
          output: (s.output_cgst || 0) + (s.output_sgst || 0) + (s.output_igst || 0),
          input: (s.input_cgst || 0) + (s.input_sgst || 0) + (s.input_igst || 0),
          liability: s.net_liability || 0,
        }
      })

    // Recent GST transactions
    const recentGSTTransactions = txns.slice(0, 15).map((t) => {
      const gstAmount = t.gst_rate ? (t.amount * t.gst_rate) / (100 + t.gst_rate) : 0
      return {
        id: t.id,
        date: t.date,
        description: t.description,
        partyName: t.party_name,
        partyGstin: t.party_gstin,
        amount: t.amount,
        gstRate: t.gst_rate,
        gstType: t.gst_type,
        gstAmount,
        type: t.type,
      }
    })

    // Filing due dates
    const getNextFilingDate = () => {
      const now = new Date()
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 20)
      return nextMonth
    }

    return NextResponse.json({
      summary: {
        totalOutputGST,
        totalInputGST,
        totalNetLiability,
        currentMonth: currentMonthSummary
          ? {
              outputCGST: currentMonthSummary.output_cgst || 0,
              outputSGST: currentMonthSummary.output_sgst || 0,
              outputIGST: currentMonthSummary.output_igst || 0,
              inputCGST: currentMonthSummary.input_cgst || 0,
              inputSGST: currentMonthSummary.input_sgst || 0,
              inputIGST: currentMonthSummary.input_igst || 0,
              netLiability: currentMonthSummary.net_liability || 0,
            }
          : {
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
        gstr1Due: new Date(now.getFullYear(), now.getMonth() + 1, 11),
      },
    })
  } catch (error) {
    console.error('GST API error:', error)
    return NextResponse.json({ error: 'Failed to fetch GST data' }, { status: 500 })
  }
}
