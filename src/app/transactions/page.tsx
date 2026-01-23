'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Upload, X, FileSpreadsheet, Trash2, Plus } from 'lucide-react'
import { formatINR } from '@/components/KPICard'
import { trackEvent } from '@/lib/posthog'

interface Transaction {
  id: string
  date: string
  description: string
  amount: number
  type: 'income' | 'expense'
  category: string
  partyName?: string
  gstRate?: number
}

interface CSVRow {
  [key: string]: string
}

interface ColumnMapping {
  date: string
  description: string
  amount: string
  type: string
  category: string
  partyName: string
}

const CATEGORIES = [
  'Sales',
  'Services',
  'Salary',
  'Rent',
  'Utilities',
  'Software',
  'Marketing',
  'Travel',
  'Office Supplies',
  'Professional Fees',
  'Insurance',
  'Bank Charges',
  'GST Payment',
  'Other Income',
  'Other Expense',
]

const AUTO_CATEGORY_RULES: Array<{ pattern: RegExp; category: string; type: 'income' | 'expense' }> = [
  { pattern: /salary|wages|payroll/i, category: 'Salary', type: 'expense' },
  { pattern: /rent|lease/i, category: 'Rent', type: 'expense' },
  { pattern: /electric|water|gas|utility|bill/i, category: 'Utilities', type: 'expense' },
  { pattern: /software|saas|subscription|aws|azure|google cloud/i, category: 'Software', type: 'expense' },
  { pattern: /marketing|ads|advertisement|google ads|facebook/i, category: 'Marketing', type: 'expense' },
  { pattern: /travel|flight|hotel|uber|ola|cab/i, category: 'Travel', type: 'expense' },
  { pattern: /office|stationery|supplies/i, category: 'Office Supplies', type: 'expense' },
  { pattern: /legal|accounting|consultant|professional/i, category: 'Professional Fees', type: 'expense' },
  { pattern: /insurance/i, category: 'Insurance', type: 'expense' },
  { pattern: /bank charge|bank fee|transaction fee/i, category: 'Bank Charges', type: 'expense' },
  { pattern: /gst payment|gst challan/i, category: 'GST Payment', type: 'expense' },
  { pattern: /invoice|payment received|client payment|sales/i, category: 'Sales', type: 'income' },
  { pattern: /service fee|consulting fee|project/i, category: 'Services', type: 'income' },
  { pattern: /interest received|dividend|refund/i, category: 'Other Income', type: 'income' },
]

function autoCategorizeTxn(description: string): { category: string; type: 'income' | 'expense' } {
  for (const rule of AUTO_CATEGORY_RULES) {
    if (rule.pattern.test(description)) {
      return { category: rule.category, type: rule.type }
    }
  }
  return { category: 'Other Expense', type: 'expense' }
}

function parseCSV(text: string): CSVRow[] {
  const lines = text.trim().split('\n')
  if (lines.length < 2) return []

  const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''))
  const rows: CSVRow[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/^["']|["']$/g, ''))
    const row: CSVRow = {}
    headers.forEach((header, index) => {
      row[header] = values[index] || ''
    })
    rows.push(row)
  }

  return rows
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showMappingModal, setShowMappingModal] = useState(false)
  const [csvData, setCsvData] = useState<CSVRow[]>([])
  const [csvHeaders, setCsvHeaders] = useState<string[]>([])
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({
    date: '',
    description: '',
    amount: '',
    type: '',
    category: '',
    partyName: '',
  })
  const [dragActive, setDragActive] = useState(false)
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchTransactions()
  }, [])

  const fetchTransactions = async () => {
    try {
      const res = await fetch('/api/transactions')
      const data = await res.json()
      setTransactions(data.transactions || [])
    } catch (error) {
      console.error('Failed to fetch transactions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }, [])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  const handleFile = (file: File) => {
    if (!file.name.endsWith('.csv')) {
      alert('Please upload a CSV file')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const rows = parseCSV(text)
      if (rows.length === 0) {
        alert('No data found in CSV')
        return
      }

      const headers = Object.keys(rows[0])
      setCsvHeaders(headers)
      setCsvData(rows)
      trackEvent('csv_file_uploaded', { rows: rows.length, headers })

      // Auto-detect column mapping
      const autoMapping: ColumnMapping = {
        date: headers.find(h => /date|time|txn.*date/i.test(h)) || '',
        description: headers.find(h => /desc|narration|particular|detail|remark/i.test(h)) || '',
        amount: headers.find(h => /amount|value|sum|debit|credit/i.test(h)) || '',
        type: headers.find(h => /type|dr.*cr|debit.*credit/i.test(h)) || '',
        category: headers.find(h => /category|cat|type/i.test(h)) || '',
        partyName: headers.find(h => /party|vendor|customer|name/i.test(h)) || '',
      }
      setColumnMapping(autoMapping)

      setShowUploadModal(false)
      setShowMappingModal(true)
    }
    reader.readAsText(file)
  }

  const processImport = async () => {
    if (!columnMapping.date || !columnMapping.description || !columnMapping.amount) {
      alert('Please map Date, Description, and Amount columns')
      return
    }

    const newTransactions: Omit<Transaction, 'id'>[] = csvData.map(row => {
      const description = row[columnMapping.description] || ''
      const amountStr = row[columnMapping.amount] || '0'
      const amount = Math.abs(parseFloat(amountStr.replace(/[^0-9.-]/g, '')) || 0)

      // Determine type from column or auto-detect
      let type: 'income' | 'expense' = 'expense'
      if (columnMapping.type && row[columnMapping.type]) {
        const typeVal = row[columnMapping.type].toLowerCase()
        type = typeVal.includes('cr') || typeVal.includes('income') || typeVal.includes('receipt')
          ? 'income'
          : 'expense'
      } else if (amountStr.startsWith('-')) {
        type = 'expense'
      } else {
        const auto = autoCategorizeTxn(description)
        type = auto.type
      }

      // Determine category
      let category = 'Other Expense'
      if (columnMapping.category && row[columnMapping.category]) {
        category = row[columnMapping.category]
      } else {
        category = autoCategorizeTxn(description).category
      }

      return {
        date: row[columnMapping.date] || new Date().toISOString().split('T')[0],
        description,
        amount,
        type,
        category,
        partyName: columnMapping.partyName ? row[columnMapping.partyName] : undefined,
      }
    }).filter(t => t.amount > 0)

    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactions: newTransactions }),
      })

      if (res.ok) {
        trackEvent('csv_import_success', { count: newTransactions.length })
        setShowMappingModal(false)
        setCsvData([])
        setCsvHeaders([])
        fetchTransactions()
      } else {
        trackEvent('csv_import_failed')
        alert('Failed to import transactions')
      }
    } catch (error) {
      console.error('Import error:', error)
      trackEvent('csv_import_failed')
      alert('Failed to import transactions')
    }
  }

  const deleteTransaction = async (id: string) => {
    if (!confirm('Delete this transaction?')) return

    try {
      await fetch(`/api/transactions?id=${id}`, { method: 'DELETE' })
      setTransactions(prev => prev.filter(t => t.id !== id))
    } catch (error) {
      console.error('Delete error:', error)
    }
  }

  const filteredTransactions = transactions.filter(t => {
    const matchesFilter = filter === 'all' || t.type === filter
    const matchesSearch = !searchQuery ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const totalIncome = filteredTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const totalExpense = filteredTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Link href="/" className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">₹</span>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">CFO India</h1>
              </Link>
            </div>
            <nav className="hidden md:flex items-center space-x-6">
              <Link href="/dashboard" className="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition-colors">
                Dashboard
              </Link>
              <Link href="/transactions" className="text-blue-600 dark:text-blue-400 font-medium">
                Transactions
              </Link>
              <Link href="/gst" className="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition-colors">
                GST
              </Link>
              <Link href="/reports" className="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition-colors">
                Reports
              </Link>
              <Link href="/chat" className="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition-colors">
                AI Chat
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Transactions</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              {transactions.length} transactions total
            </p>
          </div>
          <button
            onClick={() => setShowUploadModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Upload size={18} />
            Import CSV
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Income</p>
            <p className="text-xl font-bold text-green-600 dark:text-green-400">{formatINR(totalIncome)}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Expenses</p>
            <p className="text-xl font-bold text-red-600 dark:text-red-400">{formatINR(totalExpense)}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">Net</p>
            <p className={`text-xl font-bold ${totalIncome - totalExpense >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {formatINR(totalIncome - totalExpense)}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <input
            type="text"
            placeholder="Search transactions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <div className="flex gap-2">
            {(['all', 'income', 'expense'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === f
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">Loading transactions...</div>
          ) : filteredTransactions.length === 0 ? (
            <div className="p-8 text-center">
              <FileSpreadsheet className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500 dark:text-gray-400 mb-4">No transactions yet</p>
              <button
                onClick={() => setShowUploadModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Upload size={18} />
                Import your first CSV
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr className="text-left text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <th className="px-6 py-3">Date</th>
                    <th className="px-6 py-3">Description</th>
                    <th className="px-6 py-3">Category</th>
                    <th className="px-6 py-3 text-right">Amount</th>
                    <th className="px-6 py-3 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredTransactions.map((t) => (
                    <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {new Date(t.date).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white max-w-xs truncate">
                        {t.description}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                          {t.category}
                        </span>
                      </td>
                      <td className={`px-6 py-4 text-sm text-right font-medium whitespace-nowrap ${
                        t.type === 'income'
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {t.type === 'income' ? '+' : '-'}{formatINR(t.amount)}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => deleteTransaction(t.id)}
                          className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Import CSV</h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X size={20} />
              </button>
            </div>

            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                dragActive
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-300 dark:border-gray-600'
              }`}
            >
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-600 dark:text-gray-300 mb-2">
                Drag and drop your CSV file here
              </p>
              <p className="text-gray-400 text-sm mb-4">or</p>
              <label className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer">
                <Plus size={18} />
                Browse Files
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileInput}
                  className="hidden"
                />
              </label>
            </div>

            <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
              <p className="font-medium mb-1">Supported formats:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Bank statement exports (HDFC, ICICI, SBI, etc.)</li>
                <li>Tally exports</li>
                <li>Any CSV with Date, Description, Amount columns</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Column Mapping Modal */}
      {showMappingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Map CSV Columns</h3>
              <button
                onClick={() => setShowMappingModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X size={20} />
              </button>
            </div>

            <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
              Found {csvData.length} rows. Map your CSV columns to import correctly.
            </p>

            <div className="space-y-4 mb-6">
              {[
                { key: 'date', label: 'Date', required: true },
                { key: 'description', label: 'Description', required: true },
                { key: 'amount', label: 'Amount', required: true },
                { key: 'type', label: 'Type (Income/Expense)', required: false },
                { key: 'category', label: 'Category', required: false },
                { key: 'partyName', label: 'Party Name', required: false },
              ].map(({ key, label, required }) => (
                <div key={key} className="flex items-center gap-4">
                  <label className="w-40 text-sm text-gray-700 dark:text-gray-300">
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  <select
                    value={columnMapping[key as keyof ColumnMapping]}
                    onChange={(e) => setColumnMapping(prev => ({ ...prev, [key]: e.target.value }))}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  >
                    <option value="">-- Select column --</option>
                    {csvHeaders.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            {/* Preview */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Preview (first 3 rows)</h4>
              <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th className="px-3 py-2 text-left text-gray-500">Date</th>
                      <th className="px-3 py-2 text-left text-gray-500">Description</th>
                      <th className="px-3 py-2 text-right text-gray-500">Amount</th>
                      <th className="px-3 py-2 text-left text-gray-500">Category</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {csvData.slice(0, 3).map((row, i) => {
                      const desc = columnMapping.description ? row[columnMapping.description] : '-'
                      const auto = autoCategorizeTxn(desc)
                      return (
                        <tr key={i}>
                          <td className="px-3 py-2 text-gray-600 dark:text-gray-400">
                            {columnMapping.date ? row[columnMapping.date] : '-'}
                          </td>
                          <td className="px-3 py-2 text-gray-900 dark:text-white truncate max-w-[200px]">
                            {desc}
                          </td>
                          <td className="px-3 py-2 text-right text-gray-600 dark:text-gray-400">
                            {columnMapping.amount ? row[columnMapping.amount] : '-'}
                          </td>
                          <td className="px-3 py-2 text-gray-600 dark:text-gray-400">
                            {columnMapping.category ? row[columnMapping.category] : auto.category}
                            <span className="text-gray-400 ml-1">(auto)</span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowMappingModal(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={processImport}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Import {csvData.length} Transactions
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
