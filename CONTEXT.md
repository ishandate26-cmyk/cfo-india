# CFO India - Project Context

## What This Is
AI-powered CFO assistant for Indian SMBs - "Sapien but for India". MVP prototype to test PMF.

## Project Location
`/Users/ishandate/Documents/CFO/cfo-india`

## GitHub
https://github.com/ishandate26-cmyk/cfo-india

## Tech Stack
- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Database**: Supabase (PostgreSQL) - was SQLite for local dev
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
- [x] Sample data seeder (260 transactions)
- [x] Supabase integration (client + schema)
- [x] PostHog analytics integration
- [x] Sentry error tracking (config ready)
- [x] Vercel config (vercel.json)

## What's Left (Optional)
- [ ] Transactions page with CSV import (`/transactions`)
- [ ] Reports page - P&L, Cash Flow (`/reports`)
- [ ] TDS tracker page
- [ ] Auth (Supabase Auth) - login/signup
- [ ] Connect real data to Supabase (currently using local SQLite)

---

## Vercel Deployment

Add these env vars in Vercel:
```
NEXT_PUBLIC_SUPABASE_URL = https://koebimyyskzqmstigvvv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = sb_publishable_UV7Dam3isa9d31RBgv5yEw_tp--DrKs
NEXT_PUBLIC_POSTHOG_KEY = phc_SYveyiPeV02dw8toGkVpjwKwoJM8KT3anjoXqtXaF4Y
```

---

## Key Files
| File | Purpose |
|------|---------|
| `src/app/dashboard/page.tsx` | Dashboard with charts |
| `src/app/gst/page.tsx` | GST summary page |
| `src/app/chat/page.tsx` | AI chat interface |
| `src/lib/supabase.ts` | Supabase client |
| `src/lib/posthog.ts` | Analytics |
| `supabase-schema.sql` | DB schema (already run in Supabase) |
| `prisma/seed.ts` | Sample data generator |

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
