-- Diagnosed 2026-09-05: Alex reported contact-form and waitlist emails never
-- arriving in Resend, with no way to tell why after the fact — Vercel's
-- runtime log retention on the Hobby plan is only 1 hour, and:
--   - api/contact.js never logged anything anywhere; a Resend failure (or
--     missing RESEND_API_KEY/CONTACT_NOTIFY_EMAIL) was completely invisible.
--   - api/waitlist.js only called logWaitlistSubmission() on the success
--     path; if subscribeToWaitlist() threw, the request 502'd and nothing
--     was ever recorded, successful or not.
-- Both flows now always log to Supabase regardless of the Resend outcome,
-- with resend_ok/resend_error captured so a failure is queryable later
-- instead of disappearing with the function's log line.

alter table public.waitlist_submissions
  add column resend_ok boolean,
  add column resend_error text;

create table public.contact_submissions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  message text not null,
  resend_ok boolean,
  resend_error text,
  created_at timestamptz not null default now()
);

alter table public.contact_submissions enable row level security;

-- Same posture as waitlist_submissions: anon can only insert, never read
-- back (no service role in client code — see README's Security section).
create policy "Allow public insert" on public.contact_submissions
  for insert
  to anon, authenticated
  with check (true);
