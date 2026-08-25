# Portfolio Tracker

A shared portfolio tracker for a small group (family/friends) with a single
shared login, manual and CSV holding entry, a live dashboard, and basic
concentration/dividend insights. Not financial advice.

## Stack

- **Next.js** (App Router) — frontend + API routes
- **Supabase** — shared-login auth + Postgres database for holdings
- **Finnhub** — free-tier market data (price quotes, sector, dividend yield)
- **Vercel** — hosting

## Local setup

1. Copy `.env.example` to `.env.local` and fill in your Supabase and Finnhub
   values (see the setup guide for where to find them).
2. Run the SQL in `supabase/schema.sql` once in your Supabase project's SQL
   Editor to create the `holdings` table.
3. In Supabase, create one shared user under Authentication → Users — this
   is the single username/password everyone in the group uses to sign in.
4. Install and run:

   ```bash
   npm install
   npm run dev
   ```

5. Open http://localhost:3000 and sign in with the shared user.

## Features

- Dashboard: total value, today's change, total gain/loss, holdings table,
  sector allocation chart
- Insights: stock/sector concentration flags, dividend yield per holding and
  portfolio-weighted average, with a "not financial advice" disclaimer
- Add holdings manually or import a CSV (`ticker,quantity,cost_basis,purchase_date,sector,dividend_yield`)
- Sector and dividend yield are auto-detected from Finnhub when left blank

## Deployment

See the step-by-step guide provided alongside this project for creating the
Supabase project, getting a Finnhub API key, and deploying to Vercel.
