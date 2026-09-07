-- Adds the general "newsletter" waitlist (alexffb.com/newsletter),
-- alongside the 4 existing project-specific ones (merch/comunidade/
-- produtos-digitais/apps).

alter table public.waitlist_submissions
  drop constraint waitlist_submissions_list_check;

alter table public.waitlist_submissions
  add constraint waitlist_submissions_list_check
  check (list = any (array['newsletter', 'merch', 'comunidade', 'produtos-digitais', 'apps']));
