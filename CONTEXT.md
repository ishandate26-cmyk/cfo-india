# CFO India - Project Context

## What This Is
AI-powered CFO assistant for Indian SMBs - "Sapien but for India". MVP prototype to test PMF.

## Project Location
`/Users/ishandate/Documents/CFO/cfo-india`

## GitHub
https://github.com/ishandate26-cmyk/cfo-india

## Live URL
https://cfo-india.vercel.app

## Tech Stack
- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Database**: Supabase (PostgreSQL) - RLS disabled for demo
- **Charts**: Recharts
- **Analytics**: PostHog
- **AI Chat**: Mock responses (no API costs)
- **Deployment**: Vercel (auto-deploys from GitHub)

---

## Credentials (DO NOT COMMIT)

### Supabase
- URL: `https://koebimyyskzqmstigvvv.supabase.co`
- Anon Key: `sb_publishable_UV7Dam3isa9d31RBgv5yEw_tp--DrKs`

### PostHog
- Key: `phc_SYveyiPeV02dw8toGkVpjwKwoJM8KT3anjoXqtXaF4Y`

---

## Current Status: WORKING END-TO-END
- CSV import works (Transactions page)
- Data flows to Dashboard (charts populate)
- Data flows to GST page
- AI Chat responds based on real data
- All APIs use Supabase (not SQLite)
- All APIs are dynamic (no stale caching)

## What's Done
- [x] Landing page with navigation
- [x] Dashboard (`/dashboard`) - KPI cards, Revenue/Expense charts, Cash trend, Top expenses pie
- [x] GST Module (`/gst`) - CGST/SGST/IGST breakdown, filing reminders
- [x] AI Chat (`/chat`) - Mock responses based on real Supabase data
- [x] Transactions (`/transactions`) - CSV import, drag-drop, column mapping, auto-categorization
- [x] All APIs on Supabase (dynamic, no caching)
- [x] PostHog analytics integration
- [x] Vercel deployment live and working

## What's Left (Build Next)
- [ ] Reports page - P&L, Cash Flow statements (`/reports`)
- [ ] TDS tracker page
- [ ] Auth (Supabase Auth) - login/signup, then re-enable RLS
- [ ] Connect real Claude API for chat (instead of mock)
- [ ] Mobile responsiveness polish

## Key Technical Decisions
- RLS disabled + foreign key constraints dropped for demo mode (no auth yet)
- Demo user ID: `00000000-0000-0000-0000-000000000001`
- APIs use `force-dynamic` + `revalidate = 0` + no-cache headers
- Auto-categorization uses regex pattern matching on descriptions

---

## Key Files
| File | Purpose |
|------|---------|
| `src/app/transactions/page.tsx` | Transactions with CSV import |
| `src/app/dashboard/page.tsx` | Dashboard with charts |
| `src/app/gst/page.tsx` | GST summary page |
| `src/app/chat/page.tsx` | AI chat interface |
| `src/app/api/transactions/route.ts` | Transactions CRUD (Supabase) |
| `src/app/api/dashboard/route.ts` | Dashboard data (Supabase) |
| `src/app/api/gst/route.ts` | GST data (Supabase) |
| `src/app/api/chat/route.ts` | Chat with mock AI (Supabase) |
| `src/lib/supabase.ts` | Supabase client |
| `supabase-schema.sql` | DB schema |

---

## To Run Locally
```bash
cd /Users/ishandate/Documents/CFO/cfo-india
npm install
npm run dev
# Open http://localhost:3000
```

## To Resume with Claude
Say: "Continue building CFO India. Read CONTEXT.md for status."
