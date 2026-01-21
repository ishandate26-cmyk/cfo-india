'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">₹</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">CFO India</h1>
            </div>
            <nav className="hidden md:flex items-center space-x-6">
              <Link href="/dashboard" className="text-gray-600 hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400 transition-colors">
                Dashboard
              </Link>
              <Link href="/transactions" className="text-gray-600 hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400 transition-colors">
                Transactions
              </Link>
              <Link href="/gst" className="text-gray-600 hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400 transition-colors">
                GST
              </Link>
              <Link href="/reports" className="text-gray-600 hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400 transition-colors">
                Reports
              </Link>
              <Link href="/chat" className="text-gray-600 hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400 transition-colors">
                AI Chat
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-6">
            Your AI-Powered <span className="text-primary-600">CFO</span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8">
            Understand your business finances with natural language. Built for Indian SMBs with GST & TDS compliance built-in.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/dashboard"
              className="px-8 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors shadow-lg"
            >
              View Dashboard
            </Link>
            <Link
              href="/transactions/import"
              className="px-8 py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-600"
            >
              Import Data
            </Link>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="mt-20 grid md:grid-cols-3 gap-8">
          <FeatureCard
            title="GST Compliance"
            description="Automatic CGST, SGST, IGST calculation with monthly liability estimates and filing reminders."
            icon="📊"
          />
          <FeatureCard
            title="AI Chat"
            description="Ask questions in plain English. 'What were my biggest expenses?' 'How much GST do I owe?'"
            icon="💬"
          />
          <FeatureCard
            title="TDS Tracking"
            description="Track TDS deductions by section (194C, 194J, etc.) with due date reminders."
            icon="📋"
          />
        </div>

        {/* Quick Stats Preview */}
        <div className="mt-20 bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Quick Overview</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard label="Revenue (This Month)" value="₹0" trend="neutral" />
            <StatCard label="Expenses (This Month)" value="₹0" trend="neutral" />
            <StatCard label="GST Liability" value="₹0" trend="neutral" />
            <StatCard label="Net Profit" value="₹0" trend="neutral" />
          </div>
          <p className="text-center text-gray-500 dark:text-gray-400 mt-6">
            Import your transactions to see real data
          </p>
        </div>
      </div>
    </main>
  )
}

function FeatureCard({ title, description, icon }: { title: string; description: string; icon: string }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
      <p className="text-gray-600 dark:text-gray-300">{description}</p>
    </div>
  )
}

function StatCard({ label, value, trend }: { label: string; value: string; trend: 'up' | 'down' | 'neutral' }) {
  const trendColors = {
    up: 'text-green-500',
    down: 'text-red-500',
    neutral: 'text-gray-500'
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${trendColors[trend]} dark:text-white`}>{value}</p>
    </div>
  )
}
