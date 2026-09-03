-- Schema-only scaffold for the long-term "blog/newsletter content" pillar
-- (see projetoalexffbcompleto.md) — no UI reads or writes this table yet.
-- Deliberately generic ("content_blocks", not "blog_posts") so the same
-- table can back short-form updates, long-form articles, or newsletter
-- issue archives without a schema change later; `type` distinguishes them.
create table public.content_blocks (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('article', 'update', 'newsletter_issue')),
  slug text not null unique,
  title text not null,
  excerpt text,
  body text not null,
  locale text not null default 'en' check (locale in ('en', 'pt')),
  published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.content_blocks enable row level security;

-- Public (anon) can read only published rows — drafts stay invisible to
-- anyone without a service-role key. No anon/authenticated write policy
-- at all: until there's a real authoring flow, content is only ever
-- written from the Supabase dashboard or a service-role key, never from
-- client-side code (same "no service role in client code" posture as the
-- rest of this project's Supabase usage — see README's Security section).
create policy "Allow public read of published content" on public.content_blocks
  for select
  to anon, authenticated
  using (published = true);
