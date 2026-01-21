# CFO India - Fix Plan

## High Priority (Core MVP)

### Phase 1: Foundation
- [ ] Initialize Next.js 14 project with TypeScript and Tailwind
- [ ] Set up SQLite database with Prisma ORM
- [ ] Create Transaction data model and schema
- [ ] Seed sample Indian business data (invoices, expenses, GST transactions)

### Phase 2: Data Import
- [ ] Build CSV upload component with drag-and-drop
- [ ] Create CSV parser that maps columns to Transaction fields
- [ ] Add manual transaction entry form
- [ ] Validate GST rates and TDS sections on import

### Phase 3: Dashboard
- [ ] Create main dashboard layout with sidebar navigation
- [ ] Build KPI cards component (Revenue, Expenses, Net Profit, Cash)
- [ ] Add Revenue vs Expenses bar chart (last 12 months)
- [ ] Add Cash balance trend line chart
- [ ] Add Top 5 expense categories pie chart

### Phase 4: GST Module (India-specific)
- [ ] Calculate CGST, SGST, IGST from transactions
- [ ] Build GST summary dashboard with Input vs Output comparison
- [ ] Show monthly GST liability with payment due dates
- [ ] Add GST filing threshold indicator

### Phase 5: Reports
- [ ] Build P&L statement with auto-categorization
- [ ] Add period comparison (vs last month/quarter/year)
- [ ] Build Cash Flow statement (Operating/Investing/Financing)
- [ ] Calculate and display cash runway

### Phase 6: AI Chat
- [ ] Set up Claude API integration
- [ ] Build chat interface component
- [ ] Create system prompt with financial context
- [ ] Implement query handler that fetches relevant data
- [ ] Add suggested questions based on current view

## Medium Priority

### Phase 7: TDS Tracker
- [ ] Track TDS deductions by section (194C, 194J, etc.)
- [ ] Build TDS summary view
- [ ] Add TDS payment due date reminders

### Phase 8: Polish
- [ ] Add dark mode toggle
- [ ] Implement Indian number formatting (Lakhs/Crores)
- [ ] Add PDF export for P&L and GST summary
- [ ] Mobile responsive improvements

## Low Priority
- [ ] Upcoming payments calendar view
- [ ] Budget vs Actual comparison
- [ ] Vendor/Customer ledger view

## Completed
- [x] Project initialization
- [x] Requirements defined in specs/

## Notes
- Focus on getting dashboard + GST working first (core India value prop)
- AI chat is a differentiator - make it work well
- Use realistic Indian sample data (GST rates, vendor names, etc.)
- All amounts in INR, dates in DD/MM/YYYY format
