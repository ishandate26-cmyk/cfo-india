-- CFO India - Supabase Schema
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New Query)

-- Enable Row Level Security
alter database postgres set timezone to 'Asia/Kolkata';

-- Transactions table
create table if not exists transactions (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  date date not null,
  description text not null,
  amount decimal(15,2) not null,
  type text not null check (type in ('income', 'expense')),
  category text not null,
  gst_rate decimal(5,2),
  gst_type text check (gst_type in ('cgst_sgst', 'igst')),
  tds_section text,
  tds_rate decimal(5,2),
  party_name text,
  party_gstin text,
  user_id uuid references auth.users(id) on delete cascade not null
);

-- GST Summary table (cached calculations)
create table if not exists gst_summaries (
  id uuid default gen_random_uuid() primary key,
  period text not null, -- 'YYYY-MM' format
  output_cgst decimal(15,2) default 0,
  output_sgst decimal(15,2) default 0,
  output_igst decimal(15,2) default 0,
  input_cgst decimal(15,2) default 0,
  input_sgst decimal(15,2) default 0,
  input_igst decimal(15,2) default 0,
  net_liability decimal(15,2) default 0,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  unique(period, user_id)
);

-- Categories table
create table if not exists categories (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  type text not null check (type in ('income', 'expense')),
  description text,
  is_default boolean default false,
  user_id uuid references auth.users(id) on delete cascade
);

-- Row Level Security (RLS) Policies
-- Users can only see their own data

alter table transactions enable row level security;
alter table gst_summaries enable row level security;
alter table categories enable row level security;

-- Transactions policies
create policy "Users can view own transactions"
  on transactions for select
  using (auth.uid() = user_id);

create policy "Users can insert own transactions"
  on transactions for insert
  with check (auth.uid() = user_id);

create policy "Users can update own transactions"
  on transactions for update
  using (auth.uid() = user_id);

create policy "Users can delete own transactions"
  on transactions for delete
  using (auth.uid() = user_id);

-- GST summaries policies
create policy "Users can view own gst_summaries"
  on gst_summaries for select
  using (auth.uid() = user_id);

create policy "Users can insert own gst_summaries"
  on gst_summaries for insert
  with check (auth.uid() = user_id);

create policy "Users can update own gst_summaries"
  on gst_summaries for update
  using (auth.uid() = user_id);

-- Categories policies (allow default categories for all + user's own)
create policy "Users can view categories"
  on categories for select
  using (is_default = true or auth.uid() = user_id);

create policy "Users can insert own categories"
  on categories for insert
  with check (auth.uid() = user_id);

-- Indexes for performance
create index if not exists idx_transactions_user_date on transactions(user_id, date desc);
create index if not exists idx_transactions_user_type on transactions(user_id, type);
create index if not exists idx_gst_summaries_user_period on gst_summaries(user_id, period);

-- Insert default categories (run once)
insert into categories (name, type, description, is_default) values
  ('Sales', 'income', 'Revenue from sale of goods', true),
  ('Services', 'income', 'Revenue from services rendered', true),
  ('Interest Income', 'income', 'Interest earned', true),
  ('Other Income', 'income', 'Miscellaneous income', true),
  ('Salaries & Wages', 'expense', 'Employee salaries', true),
  ('Rent', 'expense', 'Office/warehouse rent', true),
  ('Professional Fees', 'expense', 'CA, lawyer, consultant fees', true),
  ('Raw Materials', 'expense', 'Purchase of raw materials', true),
  ('Utilities', 'expense', 'Electricity, water, internet', true),
  ('Marketing', 'expense', 'Advertising expenses', true),
  ('Travel', 'expense', 'Business travel', true),
  ('Office Supplies', 'expense', 'Stationery, consumables', true),
  ('Software', 'expense', 'Software subscriptions', true),
  ('Other Expenses', 'expense', 'Miscellaneous expenses', true)
on conflict do nothing;
