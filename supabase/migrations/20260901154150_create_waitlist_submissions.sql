-- Baseline migration, written to match the schema that was already applied
-- directly against the project (via the Supabase dashboard/MCP) before
-- this repo tracked any migrations. Recorded here so the schema has a
-- version-controlled history going forward — this file is NOT re-applied,
-- it documents what already exists in production.
create table public.waitlist_submissions (
  id uuid primary key default gen_random_uuid(),
  list text not null check (list in ('comunidade', 'merch')),
  name text not null,
  email text not null,
  locale text,
  created_at timestamptz not null default now()
);

alter table public.waitlist_submissions enable row level security;

-- Write-only from the app's anon/publishable key: anyone can insert a
-- signup, nobody can read them back except via the dashboard/service role.
create policy "Allow public insert" on public.waitlist_submissions
  for insert
  to anon, authenticated
  with check (true);
