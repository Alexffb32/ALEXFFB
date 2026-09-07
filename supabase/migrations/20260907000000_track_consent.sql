-- Adds legal pages (Privacy/Cookies/Terms) and a required consent checkbox
-- on every form, per data-protection compliance for a site that collects
-- name/email/message. Records that consent was actually given at
-- submission time, for accountability (GDPR Art. 7(1)), alongside the
-- existing resend_ok/resend_error outcome tracking.

alter table public.waitlist_submissions
  add column consent boolean not null default false;

alter table public.contact_submissions
  add column consent boolean not null default false;
