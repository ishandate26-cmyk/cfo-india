'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from 'recharts'
import { KPICard, formatINR } from '@/components/KPICard'

interface GSTData {
  summary: {
    totalOutputGST: number
    totalInputGST: number
    totalNetLiability: number
    currentMonth: {
      outputCGST: number
      outputSGST: number
      outputIGST: number
      inputCGST: number
      inputSGST: number
      inputIGST: number
      netLiability: number
    }
  }
  gstByRate: Array<{ rate: string; output: number; input: number; net: number }>
  monthlyTrend: Array<{ month: string; output: number; input: number; liability: number }>
  recentTransactions: Array<{
    id: string
    date: string
    description: string
    partyName: string | null
    partyGstin: string | null
    amount: number
    gstRate: number | null
    gstType: string | null
    gstAmount: number
    type: string
  }>
  filing: {
    gstr3bDue: string
    gstr1Due: string
  }
}

export default function GSTPage() {
  const [data, setData] = useState<GSTData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/gst')
      .then((res) => res.json())
      .then((data) => {
        setData(data)
        setLoading(false)
      })
      .catch((err) => {
        console.error('Failed to fetch GST data:', err)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-500 dark:text-gray-400">Loading GST data...</div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-red-500">Failed to load GST data</div>
      </div>
    )
  }

  const daysUntilGSTR3B = Math.ceil(
    (new Date(data.filing.gstr3bDue).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  )

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
              <Link href="/dashboard" className="text-gray-600 hover:text-blue-600 dark:text-gray-300">
                Dashboard
              </Link>
              <Link href="/transactions" className="text-gray-600 hover:text-blue-600 dark:text-gray-300">
                Transactions
              </Link>
              <Link href="/gst" className="text-blue-600 dark:text-blue-400 font-medium">
                GST
              </Link>
              <Link href="/reports" className="text-gray-600 hover:text-blue-600 dark:text-gray-300">
                Reports
              </Link>
              <Link href="/chat" className="text-gray-600 hover:text-blue-600 dark:text-gray-300">
                AI Chat
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">GST Summary</h1>

        {/* Filing Alert */}
        <div className={`rounded-xl p-4 mb-8 ${
          daysUntilGSTR3B <= 5
            ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
            : 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className={`font-medium ${daysUntilGSTR3B <= 5 ? 'text-red-800 dark:text-red-200' : 'text-blue-800 dark:text-blue-200'}`}>
                GSTR-3B Due: {new Date(data.filing.gstr3bDue).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </h3>
              <p className={`text-sm ${daysUntilGSTR3B <= 5 ? 'text-red-600 dark:text-red-300' : 'text-blue-600 dark:text-blue-300'}`}>
                {daysUntilGSTR3B} days remaining • Liability: {formatINR(data.summary.currentMonth.netLiability)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 dark:text-gray-400">GSTR-1 Due</p>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {new Date(data.filing.gstr1Due).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
              </p>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <KPICard
            title="Output GST (Collected)"
            value={data.summary.currentMonth.outputCGST + data.summary.currentMonth.outputSGST + data.summary.currentMonth.outputIGST}
            trend="up"
            subtitle="This month"
          />
          <KPICard
            title="Input GST (Paid)"
            value={data.summary.currentMonth.inputCGST + data.summary.currentMonth.inputSGST + data.summary.currentMonth.inputIGST}
            trend="down"
            subtitle="This month"
          />
          <KPICard
            title="Net GST Liability"
            value={data.summary.currentMonth.netLiability}
            trend={data.summary.currentMonth.netLiability > 0 ? 'down' : 'up'}
            subtitle="Payable this month"
          />
          <KPICard
            title="YTD Net Liability"
            value={data.summary.totalNetLiability}
            trend="neutral"
            subtitle="Year to date"
          />
        </div>

        {/* CGST/SGST/IGST Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              This Month&apos;s Breakdown
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-sm font-medium text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 pb-2">
                <div>Type</div>
                <div className="text-right">Output (Collected)</div>
                <div className="text-right">Input (Credit)</div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-gray-900 dark:text-white font-medium">CGST</div>
                <div className="text-right text-green-600 dark:text-green-400">
                  {formatINR(data.summary.currentMonth.outputCGST)}
                </div>
                <div className="text-right text-blue-600 dark:text-blue-400">
                  {formatINR(data.summary.currentMonth.inputCGST)}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-gray-900 dark:text-white font-medium">SGST</div>
                <div className="text-right text-green-600 dark:text-green-400">
                  {formatINR(data.summary.currentMonth.outputSGST)}
                </div>
                <div className="text-right text-blue-600 dark:text-blue-400">
                  {formatINR(data.summary.currentMonth.inputSGST)}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-gray-900 dark:text-white font-medium">IGST</div>
                <div className="text-right text-green-600 dark:text-green-400">
                  {formatINR(data.summary.currentMonth.outputIGST)}
                </div>
                <div className="text-right text-blue-600 dark:text-blue-400">
                  {formatINR(data.summary.currentMonth.inputIGST)}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 border-t border-gray-200 dark:border-gray-700 pt-4 font-bold">
                <div className="text-gray-900 dark:text-white">Total</div>
                <div className="text-right text-green-600 dark:text-green-400">
                  {formatINR(
                    data.summary.currentMonth.outputCGST +
                      data.summary.currentMonth.outputSGST +
                      data.summary.currentMonth.outputIGST
                  )}
                </div>
                <div className="text-right text-blue-600 dark:text-blue-400">
                  {formatINR(
                    data.summary.currentMonth.inputCGST +
                      data.summary.currentMonth.inputSGST +
                      data.summary.currentMonth.inputIGST
                  )}
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mt-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-300">Net Liability (Payable)</span>
                  <span className={`text-xl font-bold ${
                    data.summary.currentMonth.netLiability > 0
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-green-600 dark:text-green-400'
                  }`}>
                    {formatINR(data.summary.currentMonth.netLiability)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* GST by Rate */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              GST by Rate
            </h2>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data.gstByRate} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                <XAxis
                  type="number"
                  tickFormatter={(value) => `₹${(value / 100000).toFixed(0)}L`}
                  tick={{ fontSize: 12 }}
                  stroke="#9ca3af"
                />
                <YAxis type="category" dataKey="rate" tick={{ fontSize: 12 }} stroke="#9ca3af" width={50} />
                <Tooltip formatter={(value: number) => formatINR(value)} />
                <Legend />
                <Bar dataKey="output" fill="#10b981" name="Output GST" radius={[0, 4, 4, 0]} />
                <Bar dataKey="input" fill="#3b82f6" name="Input GST" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Trend */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Monthly GST Trend
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#9ca3af" />
              <YAxis
                tickFormatter={(value) => `₹${(value / 100000).toFixed(0)}L`}
                tick={{ fontSize: 12 }}
                stroke="#9ca3af"
              />
              <Tooltip formatter={(value: number) => formatINR(value)} />
              <Legend />
              <Line type="monotone" dataKey="output" stroke="#10b981" name="Output GST" strokeWidth={2} />
              <Line type="monotone" dataKey="input" stroke="#3b82f6" name="Input GST" strokeWidth={2} />
              <Line type="monotone" dataKey="liability" stroke="#ef4444" name="Net Liability" strokeWidth={2} strokeDasharray="5 5" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Recent GST Transactions */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Recent GST Transactions
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">
                  <th className="pb-3">Date</th>
                  <th className="pb-3">Party</th>
                  <th className="pb-3">GSTIN</th>
                  <th className="pb-3">Type</th>
                  <th className="pb-3 text-right">Amount</th>
                  <th className="pb-3 text-right">GST</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {data.recentTransactions.map((t) => (
                  <tr key={t.id}>
                    <td className="py-3 text-gray-500 dark:text-gray-400">
                      {new Date(t.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                    </td>
                    <td className="py-3 text-gray-900 dark:text-white">{t.partyName || '-'}</td>
                    <td className="py-3 text-gray-500 dark:text-gray-400 font-mono text-xs">
                      {t.partyGstin ? `${t.partyGstin.slice(0, 4)}...` : '-'}
                    </td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        t.type === 'income'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                      }`}>
                        {t.type === 'income' ? 'Output' : 'Input'} @ {t.gstRate}%
                      </span>
                    </td>
                    <td className="py-3 text-right text-gray-900 dark:text-white">
                      {formatINR(t.amount)}
                    </td>
                    <td className={`py-3 text-right font-medium ${
                      t.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'
                    }`}>
                      {formatINR(t.gstAmount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
