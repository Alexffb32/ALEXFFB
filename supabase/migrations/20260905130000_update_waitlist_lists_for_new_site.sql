-- The site was rebuilt from a new template (2026-09-05) with 4 pillars —
-- merch, comunidade, produtos-digitais, apps — replacing the old
-- comunidade/merch/newsletter set. Widen the `list` CHECK to match.
alter table public.waitlist_submissions
  drop constraint waitlist_submissions_list_check;

alter table public.waitlist_submissions
  add constraint waitlist_submissions_list_check
  check (list in ('merch', 'comunidade', 'produtos-digitais', 'apps'));
