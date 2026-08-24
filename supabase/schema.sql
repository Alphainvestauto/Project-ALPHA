-- Portfolio Tracker schema
-- Run this once in the Supabase SQL Editor (see setup guide, step "Create the database tables").

create extension if not exists "pgcrypto";

create table if not exists public.holdings (
  id uuid primary key default gen_random_uuid(),
  ticker text not null,
  name text,
  sector text,
  quantity numeric not null check (quantity > 0),
  cost_basis numeric not null check (cost_basis >= 0), -- average price paid per share
  purchase_date date,
  dividend_yield numeric, -- annual dividend yield as a percent, e.g. 2.5 = 2.5%
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists holdings_ticker_idx on public.holdings (ticker);

-- Keep updated_at current on every edit.
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists holdings_set_updated_at on public.holdings;
create trigger holdings_set_updated_at
  before update on public.holdings
  for each row
  execute function public.set_updated_at();

-- Row Level Security: everyone who is logged in with the shared account
-- can read and write every holding (this is a shared household portfolio,
-- not a multi-tenant app).
alter table public.holdings enable row level security;

drop policy if exists "Authenticated users can manage holdings" on public.holdings;
create policy "Authenticated users can manage holdings"
  on public.holdings
  for all
  to authenticated
  using (true)
  with check (true);
