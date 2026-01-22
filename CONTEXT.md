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
- **Database**: Supabase (PostgreSQL)
- **Charts**: Recharts
- **Analytics**: PostHog
- **AI Chat**: Mock responses (no API costs)

---

## Credentials (DO NOT COMMIT)

### Supabase
- URL: `https://koebimyyskzqmstigvvv.supabase.co`
- Anon Key: `sb_publishable_UV7Dam3isa9d31RBgv5yEw_tp--DrKs`

### PostHog
- Key: `phc_SYveyiPeV02dw8toGkVpjwKwoJM8KT3anjoXqtXaF4Y`

---

## What's Done
- [x] Landing page with navigation
- [x] Dashboard (`/dashboard`) - KPI cards, Revenue/Expense charts, Cash trend
- [x] GST Module (`/gst`) - CGST/SGST/IGST breakdown, filing reminders
- [x] AI Chat (`/chat`) - Mock responses for finance questions
- [x] **Transactions (`/transactions`) - CSV import, drag-drop, column mapping, auto-categorization**
- [x] All APIs switched from Prisma/SQLite to Supabase
- [x] Supabase schema created (tables + RLS policies)
- [x] PostHog analytics integration
- [x] Sentry error tracking (config ready)
- [x] Vercel deployment live

## BLOCKER - Fix Before Testing CSV Import
**RLS (Row Level Security) is blocking inserts.** Run this SQL in Supabase SQL Editor:

```sql
-- Disable RLS for demo mode (no auth yet)
alter table transactions disable row level security;
alter table gst_summaries disable row level security;
alter table categories disable row level security;
```

Then try CSV import again at https://cfo-india.vercel.app/transactions

## What's Left (Optional)
- [ ] Reports page - P&L, Cash Flow (`/reports`)
- [ ] TDS tracker page
- [ ] Auth (Supabase Auth) - login/signup
- [ ] Re-enable RLS after adding auth

---

## Key Files
| File | Purpose |
|------|---------|
| `src/app/dashboard/page.tsx` | Dashboard with charts |
| `src/app/gst/page.tsx` | GST summary page |
| `src/app/chat/page.tsx` | AI chat interface |
| `src/app/transactions/page.tsx` | **NEW** - Transactions with CSV import |
| `src/app/api/transactions/route.ts` | Transactions API (Supabase) |
| `src/app/api/dashboard/route.ts` | Dashboard API (Supabase) |
| `src/app/api/gst/route.ts` | GST API (Supabase) |
| `src/app/api/chat/route.ts` | Chat API (Supabase) |
| `src/lib/supabase.ts` | Supabase client |
| `src/lib/posthog.ts` | Analytics |
| `supabase-schema.sql` | DB schema (already run in Supabase) |

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

## Next Steps When You Wake Up
1. Run the SQL above to disable RLS
2. Test CSV import at /transactions
3. Verify data shows in Dashboard and GST pages
4. Optional: Add auth, then re-enable RLS
