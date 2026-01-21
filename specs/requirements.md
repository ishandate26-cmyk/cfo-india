# CFO India - Product Requirements

## Overview
An AI-powered CFO assistant for Indian SMBs. Think "Sapien but for India" - helps business owners understand their finances through natural language, with built-in India-specific compliance.

## Target User
- Indian SMB owners (10-500 employees)
- Currently using Tally, Zoho Books, or spreadsheets
- Wants quick answers about their business finances without being an accountant

## Tech Stack
- **Frontend**: Next.js 14 with TypeScript, Tailwind CSS
- **Backend**: Next.js API routes
- **Database**: SQLite (simple for prototype)
- **AI**: Claude API for natural language queries
- **Charts**: Recharts for visualizations

## MVP Features (Prototype Scope)

### 1. Data Import
- [ ] CSV upload for transactions (bank statements, Tally exports)
- [ ] Manual transaction entry form
- [ ] Sample data seeder for demo purposes

### 2. Dashboard
- [ ] Revenue vs Expenses chart (last 12 months)
- [ ] Cash balance trend
- [ ] Top 5 expense categories
- [ ] Key metrics cards: Revenue, Expenses, Net Profit, Cash Balance

### 3. GST Summary (India-specific)
- [ ] CGST, SGST, IGST breakdown
- [ ] Input vs Output GST comparison
- [ ] Monthly GST liability estimate
- [ ] GST filing reminder (based on turnover threshold)

### 4. P&L Statement
- [ ] Auto-categorized Income & Expenses
- [ ] Monthly/Quarterly/Yearly views
- [ ] Compare with previous period
- [ ] Export to PDF

### 5. Cash Flow
- [ ] Operating/Investing/Financing breakdown
- [ ] Cash runway calculation ("X months of runway left")
- [ ] Upcoming payments calendar

### 6. AI Chat Interface
- [ ] Natural language questions about finances
- [ ] Example queries:
  - "What were my biggest expenses last month?"
  - "How much GST do I owe this quarter?"
  - "Show me revenue trend"
  - "Am I profitable this year?"
- [ ] **Use mock responses for now** (no real API calls - just realistic placeholder responses based on the data)
- [ ] Context-aware responses with data from the system
- [ ] Suggested follow-up questions

### 7. TDS Tracker (India-specific)
- [ ] Track TDS deducted on payments
- [ ] TDS payable summary by section (194C, 194J, etc.)
- [ ] Due date reminders

## Data Model

### Transaction
```typescript
{
  id: string
  date: Date
  description: string
  amount: number
  type: 'income' | 'expense'
  category: string
  gstRate: number | null  // 0, 5, 12, 18, 28
  gstType: 'cgst_sgst' | 'igst' | null
  tdsSection: string | null
  tdsRate: number | null
  partyName: string | null
  partyGstin: string | null
}
```

### Categories (Pre-defined for India)
- Income: Sales, Services, Interest, Other Income
- Expenses: Salaries, Rent, Professional Fees, Raw Materials, Utilities, Marketing, Travel, Office Supplies, Software, Other Expenses

## UI/UX Guidelines
- Clean, minimal interface
- Mobile-responsive
- Dark mode support
- Indian Rupee (₹) formatting throughout
- Indian date format (DD/MM/YYYY)
- Lakh/Crore number formatting option

## Non-Goals (Out of Scope for MVP)
- Direct Tally/Zoho integration (CSV only for now)
- Multi-company support
- User authentication (single user prototype)
- Actual GST filing
- Bank account sync
- Invoice generation
- Payroll management

## Success Metrics
- User can upload data and see dashboard in < 2 minutes
- AI can answer 80% of basic finance questions accurately
- GST summary matches manual calculation
