-- Widens the list CHECK constraint to include 'newsletter'. The app's own
-- validation (api/_lib/validation.js) has accepted 'newsletter' since the
-- Newsletter waitlist page shipped, but this table's constraint was
-- created before that and never updated — every Newsletter signup's
-- best-effort Supabase backup log (api/_lib/supabase.js) has been
-- silently failing the insert ever since (logged to console, never
-- surfaced to the visitor, so nobody noticed).
alter table public.waitlist_submissions
  drop constraint waitlist_submissions_list_check;

alter table public.waitlist_submissions
  add constraint waitlist_submissions_list_check
  check (list in ('comunidade', 'merch', 'newsletter'));

-- The Newsletter page's own signup form only collects an email address
-- (see the comment on the optional `name` field in
-- api/_lib/validation.js) — name being NOT NULL made every one of those
-- inserts fail for that reason too, independent of the check above.
alter table public.waitlist_submissions
  alter column name drop not null;
