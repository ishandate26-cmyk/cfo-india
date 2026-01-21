# CFO India - Project Context

## What This Is
An AI-powered CFO assistant for Indian SMBs - "Sapien but for India". Simple prototype to test PMF.

## Project Location
`/Users/ishandate/Documents/CFO/cfo-india`

## Tech Stack
- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Database**: SQLite with Prisma ORM
- **Charts**: Recharts
- **AI Chat**: Mock responses for now (no API costs)

## Key Features (MVP)
1. **Dashboard** - Revenue/Expenses charts, KPI cards, cash balance
2. **GST Module** - CGST/SGST/IGST breakdown, liability calculator, filing reminders
3. **P&L Statement** - Auto-categorized, period comparisons
4. **Cash Flow** - Runway calculation
5. **AI Chat** - Natural language questions (mock responses)
6. **TDS Tracker** - Track deductions by section
7. **CSV Import** - Upload transactions

## India-Specific Features
- GST rates: 0%, 5%, 12%, 18%, 28%
- GST types: CGST+SGST (intra-state), IGST (inter-state)
- TDS sections: 194C, 194J, etc.
- INR formatting with Lakhs/Crores option
- DD/MM/YYYY date format

## Files Created So Far
- `package.json` - Dependencies (Next.js, Prisma, Recharts, etc.)
- `prisma/schema.prisma` - Database schema with Transaction, GSTSummary, TDSSummary models
- `prisma/seed.ts` - Sample data seeder
- `src/app/page.tsx` - Landing page with navigation
- `src/app/layout.tsx` - Root layout
- `src/lib/db.ts` - Database connection
- `src/lib/utils.ts` - Utility functions
- `specs/requirements.md` - Full requirements doc
- `@fix_plan.md` - Task list

## What's Done
- [x] npm install
- [x] Prisma setup (schema, generate, db push)
- [x] Sample data seeded (260 transactions)
- [x] Dashboard page with charts (`/dashboard`)
- [x] KPI cards (Revenue, Expenses, Net Profit, Cash Balance)
- [x] Dashboard API route

## What Still Needs Building
1. GST summary page (`/gst`) - CGST/SGST/IGST breakdown
2. Transactions page with CSV import (`/transactions`)
3. AI Chat page (`/chat`) - mock responses
4. Reports page (`/reports`) - P&L, Cash Flow
5. TDS tracker

## To Resume This Project
```bash
cd /Users/ishandate/Documents/CFO/cfo-india
# If dependencies not installed:
npm install
npx prisma generate
npx prisma db push
npm run db:seed

# To run:
npm run dev
# Open http://localhost:3000
```

## GitHub
Repository: https://github.com/ishandate26-cmyk/cfo-india

## Commands for Claude
When resuming, tell Claude:
"Continue building CFO India. Read CONTEXT.md and @fix_plan.md for current status."
