import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const transactions = await prisma.transaction.findMany({
      orderBy: { date: 'desc' },
    })

    return NextResponse.json({
      transactions: transactions.map(t => ({
        id: t.id,
        date: t.date,
        description: t.description,
        amount: t.amount,
        type: t.type,
        category: t.category,
        partyName: t.partyName,
        gstRate: t.gstRate,
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
        date: parsedDate,
        description: t.description?.toString().slice(0, 500) || 'No description',
        amount: Math.abs(parseFloat(t.amount) || 0),
        type: t.type === 'income' ? 'income' : 'expense',
        category: t.category?.toString() || 'Other',
        partyName: t.partyName?.toString() || null,
        gstRate: t.gstRate ? parseFloat(t.gstRate) : null,
        gstType: null,
        tdsSection: null,
        tdsRate: null,
        partyGstin: null,
      }
    }).filter(t => t.amount > 0)

    // Create transactions in batches
    const created = await prisma.transaction.createMany({
      data: validTransactions,
    })

    // Update GST summaries
    await updateGSTSummaries()

    return NextResponse.json({
      success: true,
      count: created.count,
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

    await prisma.transaction.delete({
      where: { id },
    })

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
    const transactions = await prisma.transaction.findMany()

    // Group by month
    const monthlySummaries = new Map<string, {
      outputCGST: number
      outputSGST: number
      outputIGST: number
      inputCGST: number
      inputSGST: number
      inputIGST: number
    }>()

    for (const t of transactions) {
      if (!t.gstRate || t.gstRate === 0) continue

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
      const gstAmount = (t.amount * t.gstRate) / 100

      if (t.type === 'income') {
        // Output GST (collected on sales)
        if (t.gstType === 'igst') {
          summary.outputIGST += gstAmount
        } else {
          // Default to CGST + SGST (split equally)
          summary.outputCGST += gstAmount / 2
          summary.outputSGST += gstAmount / 2
        }
      } else {
        // Input GST (paid on purchases)
        if (t.gstType === 'igst') {
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

      await prisma.gSTSummary.upsert({
        where: { period },
        update: {
          outputCGST: Math.round(summary.outputCGST),
          outputSGST: Math.round(summary.outputSGST),
          outputIGST: Math.round(summary.outputIGST),
          inputCGST: Math.round(summary.inputCGST),
          inputSGST: Math.round(summary.inputSGST),
          inputIGST: Math.round(summary.inputIGST),
          netLiability: Math.round(netLiability),
        },
        create: {
          period,
          outputCGST: Math.round(summary.outputCGST),
          outputSGST: Math.round(summary.outputSGST),
          outputIGST: Math.round(summary.outputIGST),
          inputCGST: Math.round(summary.inputCGST),
          inputSGST: Math.round(summary.inputSGST),
          inputIGST: Math.round(summary.inputIGST),
          netLiability: Math.round(netLiability),
        },
      })
    }
  } catch (error) {
    console.error('Failed to update GST summaries:', error)
  }
}
