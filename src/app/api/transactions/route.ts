import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001'

export async function GET() {
  try {
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', DEMO_USER_ID)
      .order('date', { ascending: false })

    if (error) throw error

    return NextResponse.json({
      transactions: (transactions || []).map(t => ({
        id: t.id,
        date: t.date,
        description: t.description,
        amount: t.amount,
        type: t.type,
        category: t.category,
        partyName: t.party_name,
        gstRate: t.gst_rate,
      })),
    })
  } catch (error) {
    console.error('Failed to fetch transactions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { transactions } = body

    if (!Array.isArray(transactions) || transactions.length === 0) {
      return NextResponse.json(
        { error: 'No transactions provided' },
        { status: 400 }
      )
    }

    // Validate and transform transactions
    const validTransactions = transactions.map(t => {
      // Parse date - handle various formats
      let parsedDate: Date
      const dateStr = t.date?.toString() || ''

      // Try different date formats
      if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
        // ISO format: 2024-01-15
        parsedDate = new Date(dateStr)
      } else if (/^\d{2}[/-]\d{2}[/-]\d{4}/.test(dateStr)) {
        // DD/MM/YYYY or DD-MM-YYYY
        const parts = dateStr.split(/[/-]/)
        parsedDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]))
      } else if (/^\d{2}[/-]\d{2}[/-]\d{2}/.test(dateStr)) {
        // DD/MM/YY
        const parts = dateStr.split(/[/-]/)
        const year = parseInt(parts[2]) + 2000
        parsedDate = new Date(year, parseInt(parts[1]) - 1, parseInt(parts[0]))
      } else {
        // Fallback to JS Date parsing
        parsedDate = new Date(dateStr)
      }

      // If date is invalid, use current date
      if (isNaN(parsedDate.getTime())) {
        parsedDate = new Date()
      }

      return {
        date: parsedDate.toISOString().split('T')[0],
        description: t.description?.toString().slice(0, 500) || 'No description',
        amount: Math.abs(parseFloat(t.amount) || 0),
        type: t.type === 'income' ? 'income' : 'expense',
        category: t.category?.toString() || 'Other',
        party_name: t.partyName?.toString() || null,
        gst_rate: t.gstRate ? parseFloat(t.gstRate) : null,
        gst_type: null,
        tds_section: null,
        tds_rate: null,
        party_gstin: null,
        user_id: DEMO_USER_ID,
      }
    }).filter(t => t.amount > 0)

    // Insert transactions into Supabase
    const { data, error } = await supabase
      .from('transactions')
      .insert(validTransactions)
      .select()

    if (error) throw error

    // Update GST summaries
    await updateGSTSummaries()

    return NextResponse.json({
      success: true,
      count: data?.length || 0,
    })
  } catch (error) {
    console.error('Failed to create transactions:', error)
    return NextResponse.json(
      { error: 'Failed to create transactions' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Transaction ID required' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)
      .eq('user_id', DEMO_USER_ID)

    if (error) throw error

    // Update GST summaries
    await updateGSTSummaries()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete transaction:', error)
    return NextResponse.json(
      { error: 'Failed to delete transaction' },
      { status: 500 }
    )
  }
}

// Helper function to update GST summaries based on transactions
async function updateGSTSummaries() {
  try {
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', DEMO_USER_ID)

    if (error) throw error

    // Group by month
    const monthlySummaries = new Map<string, {
      outputCGST: number
      outputSGST: number
      outputIGST: number
      inputCGST: number
      inputSGST: number
      inputIGST: number
    }>()

    for (const t of transactions || []) {
      if (!t.gst_rate || t.gst_rate === 0) continue

      const date = new Date(t.date)
      const period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

      if (!monthlySummaries.has(period)) {
        monthlySummaries.set(period, {
          outputCGST: 0,
          outputSGST: 0,
          outputIGST: 0,
          inputCGST: 0,
          inputSGST: 0,
          inputIGST: 0,
        })
      }

      const summary = monthlySummaries.get(period)!
      const gstAmount = (t.amount * t.gst_rate) / 100

      if (t.type === 'income') {
        if (t.gst_type === 'igst') {
          summary.outputIGST += gstAmount
        } else {
          summary.outputCGST += gstAmount / 2
          summary.outputSGST += gstAmount / 2
        }
      } else {
        if (t.gst_type === 'igst') {
          summary.inputIGST += gstAmount
        } else {
          summary.inputCGST += gstAmount / 2
          summary.inputSGST += gstAmount / 2
        }
      }
    }

    // Upsert GST summaries
    for (const [period, summary] of Array.from(monthlySummaries.entries())) {
      const netLiability =
        summary.outputCGST +
        summary.outputSGST +
        summary.outputIGST -
        summary.inputCGST -
        summary.inputSGST -
        summary.inputIGST

      await supabase
        .from('gst_summaries')
        .upsert({
          period,
          output_cgst: Math.round(summary.outputCGST),
          output_sgst: Math.round(summary.outputSGST),
          output_igst: Math.round(summary.outputIGST),
          input_cgst: Math.round(summary.inputCGST),
          input_sgst: Math.round(summary.inputSGST),
          input_igst: Math.round(summary.inputIGST),
          net_liability: Math.round(netLiability),
          user_id: DEMO_USER_ID,
        }, {
          onConflict: 'period,user_id',
        })
    }
  } catch (error) {
    console.error('Failed to update GST summaries:', error)
  }
}
