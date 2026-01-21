import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Sample Indian business names for realistic demo data
const vendors = [
  { name: 'Tata Steel Ltd', gstin: '27AAACT2727Q1ZV' },
  { name: 'Reliance Industries', gstin: '27AABCR1234A1Z5' },
  { name: 'Infosys Technologies', gstin: '29AABCI1234F1ZB' },
  { name: 'Wipro Ltd', gstin: '29AABCW1234L1ZN' },
  { name: 'ABC Suppliers', gstin: '27AABCS5678K1Z3' },
  { name: 'XYZ Services', gstin: '27AABCX9012M1Z7' },
  { name: 'Mumbai Electricals', gstin: '27AABCM3456P1Z1' },
  { name: 'Delhi Transport Co', gstin: '07AABCD7890T1ZY' },
  { name: 'Bangalore IT Solutions', gstin: '29AABCB2345I1ZW' },
  { name: 'Chennai Logistics', gstin: '33AABCC6789L1ZQ' },
]

const customers = [
  { name: 'Hindustan Unilever', gstin: '27AABCH1234U1ZB' },
  { name: 'Mahindra & Mahindra', gstin: '27AABCM4567M1ZN' },
  { name: 'Godrej Industries', gstin: '27AABCG8901G1ZK' },
  { name: 'Larsen & Toubro', gstin: '27AABCL2345L1ZJ' },
  { name: 'Asian Paints', gstin: '27AABCA6789A1ZH' },
]

// Default categories for Indian businesses
const defaultCategories = [
  // Income categories
  { name: 'Sales', type: 'income', description: 'Revenue from sale of goods', isDefault: true },
  { name: 'Services', type: 'income', description: 'Revenue from services rendered', isDefault: true },
  { name: 'Interest Income', type: 'income', description: 'Interest earned on deposits/investments', isDefault: true },
  { name: 'Other Income', type: 'income', description: 'Miscellaneous income', isDefault: true },

  // Expense categories
  { name: 'Salaries & Wages', type: 'expense', description: 'Employee salaries and wages', isDefault: true },
  { name: 'Rent', type: 'expense', description: 'Office/warehouse rent', isDefault: true },
  { name: 'Professional Fees', type: 'expense', description: 'CA, lawyer, consultant fees', isDefault: true },
  { name: 'Raw Materials', type: 'expense', description: 'Purchase of raw materials', isDefault: true },
  { name: 'Utilities', type: 'expense', description: 'Electricity, water, internet', isDefault: true },
  { name: 'Marketing', type: 'expense', description: 'Advertising and marketing expenses', isDefault: true },
  { name: 'Travel', type: 'expense', description: 'Business travel expenses', isDefault: true },
  { name: 'Office Supplies', type: 'expense', description: 'Stationery, consumables', isDefault: true },
  { name: 'Software', type: 'expense', description: 'Software subscriptions and licenses', isDefault: true },
  { name: 'Other Expenses', type: 'expense', description: 'Miscellaneous expenses', isDefault: true },
]

// Generate sample transactions for the last 12 months
function generateSampleTransactions() {
  const transactions: Array<{
    date: Date
    description: string
    amount: number
    type: 'income' | 'expense'
    category: string
    gstRate: number | null
    gstType: 'cgst_sgst' | 'igst' | null
    tdsSection: string | null
    tdsRate: number | null
    partyName: string | null
    partyGstin: string | null
  }> = []

  const now = new Date()
  const startDate = new Date(now.getFullYear(), now.getMonth() - 11, 1)

  // Generate transactions for each month
  for (let monthOffset = 0; monthOffset < 12; monthOffset++) {
    const monthDate = new Date(startDate.getFullYear(), startDate.getMonth() + monthOffset, 1)
    const daysInMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate()

    // Generate 15-25 transactions per month
    const numTransactions = 15 + Math.floor(Math.random() * 11)

    for (let i = 0; i < numTransactions; i++) {
      const day = 1 + Math.floor(Math.random() * daysInMonth)
      const date = new Date(monthDate.getFullYear(), monthDate.getMonth(), day)

      // 40% income, 60% expenses (realistic for most businesses)
      const isIncome = Math.random() < 0.4

      if (isIncome) {
        const customer = customers[Math.floor(Math.random() * customers.length)]
        const category = Math.random() < 0.8 ? 'Sales' : 'Services'
        const amount = 50000 + Math.floor(Math.random() * 500000) // 50K to 5.5L

        // Most B2B transactions have GST
        const hasGst = Math.random() < 0.9
        const gstRate = hasGst ? [5, 12, 18][Math.floor(Math.random() * 3)] : null
        const gstType = hasGst ? (Math.random() < 0.7 ? 'cgst_sgst' : 'igst') : null

        transactions.push({
          date,
          description: `${category} to ${customer.name}`,
          amount,
          type: 'income',
          category,
          gstRate,
          gstType: gstType as 'cgst_sgst' | 'igst' | null,
          tdsSection: null,
          tdsRate: null,
          partyName: customer.name,
          partyGstin: customer.gstin,
        })
      } else {
        // Expense transaction
        const expenseTypes = [
          { category: 'Salaries & Wages', minAmount: 30000, maxAmount: 200000, hasTds: true, tdsSection: '194J', tdsRate: 10 },
          { category: 'Rent', minAmount: 50000, maxAmount: 150000, hasTds: true, tdsSection: '194I', tdsRate: 10 },
          { category: 'Professional Fees', minAmount: 10000, maxAmount: 100000, hasTds: true, tdsSection: '194J', tdsRate: 10 },
          { category: 'Raw Materials', minAmount: 20000, maxAmount: 300000, hasTds: false, tdsSection: null, tdsRate: null },
          { category: 'Utilities', minAmount: 5000, maxAmount: 30000, hasTds: false, tdsSection: null, tdsRate: null },
          { category: 'Marketing', minAmount: 10000, maxAmount: 80000, hasTds: false, tdsSection: null, tdsRate: null },
          { category: 'Travel', minAmount: 5000, maxAmount: 50000, hasTds: false, tdsSection: null, tdsRate: null },
          { category: 'Office Supplies', minAmount: 2000, maxAmount: 20000, hasTds: false, tdsSection: null, tdsRate: null },
          { category: 'Software', minAmount: 5000, maxAmount: 50000, hasTds: false, tdsSection: null, tdsRate: null },
        ]

        const expenseType = expenseTypes[Math.floor(Math.random() * expenseTypes.length)]
        const vendor = vendors[Math.floor(Math.random() * vendors.length)]
        const amount = expenseType.minAmount + Math.floor(Math.random() * (expenseType.maxAmount - expenseType.minAmount))

        // Most expenses have GST
        const hasGst = Math.random() < 0.85
        const gstRate = hasGst ? [5, 12, 18][Math.floor(Math.random() * 3)] : null
        const gstType = hasGst ? (Math.random() < 0.7 ? 'cgst_sgst' : 'igst') : null

        transactions.push({
          date,
          description: `${expenseType.category} - ${vendor.name}`,
          amount,
          type: 'expense',
          category: expenseType.category,
          gstRate,
          gstType: gstType as 'cgst_sgst' | 'igst' | null,
          tdsSection: expenseType.hasTds && amount > 30000 ? expenseType.tdsSection : null,
          tdsRate: expenseType.hasTds && amount > 30000 ? expenseType.tdsRate : null,
          partyName: vendor.name,
          partyGstin: vendor.gstin,
        })
      }
    }
  }

  return transactions.sort((a, b) => a.date.getTime() - b.date.getTime())
}

async function main() {
  console.log('🌱 Starting database seed...')

  // Clear existing data
  await prisma.transaction.deleteMany()
  await prisma.category.deleteMany()
  await prisma.gSTSummary.deleteMany()
  await prisma.tDSSummary.deleteMany()

  console.log('📝 Creating default categories...')
  for (const category of defaultCategories) {
    await prisma.category.create({
      data: category,
    })
  }

  console.log('💰 Generating sample transactions...')
  const transactions = generateSampleTransactions()

  for (const transaction of transactions) {
    await prisma.transaction.create({
      data: transaction,
    })
  }

  console.log(`✅ Created ${transactions.length} sample transactions`)

  // Calculate and store GST summaries
  console.log('📊 Calculating GST summaries...')
  const gstSummaries = new Map<string, {
    outputCGST: number
    outputSGST: number
    outputIGST: number
    inputCGST: number
    inputSGST: number
    inputIGST: number
  }>()

  for (const t of transactions) {
    if (!t.gstRate || !t.gstType) continue

    const period = `${t.date.getFullYear()}-${String(t.date.getMonth() + 1).padStart(2, '0')}`
    const existing = gstSummaries.get(period) || {
      outputCGST: 0,
      outputSGST: 0,
      outputIGST: 0,
      inputCGST: 0,
      inputSGST: 0,
      inputIGST: 0,
    }

    const gstAmount = (t.amount * t.gstRate) / (100 + t.gstRate)

    if (t.type === 'income') {
      if (t.gstType === 'igst') {
        existing.outputIGST += gstAmount
      } else {
        existing.outputCGST += gstAmount / 2
        existing.outputSGST += gstAmount / 2
      }
    } else {
      if (t.gstType === 'igst') {
        existing.inputIGST += gstAmount
      } else {
        existing.inputCGST += gstAmount / 2
        existing.inputSGST += gstAmount / 2
      }
    }

    gstSummaries.set(period, existing)
  }

  for (const [period, summary] of gstSummaries) {
    const netLiability =
      summary.outputCGST +
      summary.outputSGST +
      summary.outputIGST -
      summary.inputCGST -
      summary.inputSGST -
      summary.inputIGST

    await prisma.gSTSummary.create({
      data: {
        period,
        ...summary,
        netLiability,
      },
    })
  }

  console.log('✅ Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
