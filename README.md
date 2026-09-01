# Alex Bento — Personal Site

Next.js (App Router) rewrite of Alex Bento's personal site / agency portfolio.
This replaces the previous static Framer export (now removed from the repo —
the old HTML/asset dump is still in git history if it's ever needed for
reference) with a proper Next.js codebase: bilingual (PT/EN), with waitlist
pages for the upcoming community and merch, SEO metadata, and basic
hardening.

## Stack

- **Next.js 15** (App Router, TypeScript)
- **next-intl** for i18n (English default, European Portuguese translation,
  browser-language detection, `/en` and `/pt` prefixes, localized slugs e.g.
  `/en/contact` vs `/pt/contacto`)
- **Tailwind CSS**, using the color palette and typography (Inter) pulled
  from the original site's compiled CSS — palette/typography/hero media were
  intentionally left unchanged per the project brief
- **react-hook-form + zod** for the contact and waitlist forms (validated
  both client- and server-side)
- **Resend** for the waitlist confirmation emails / audience tagging (a key
  exists but the domain/audiences still need manual setup — see "What's left
  for Alex" below)
- **Supabase** (dedicated project, `alexffb`) as a write-only backup log of
  every waitlist signup, alongside Resend — see `src/lib/supabase.ts`

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in real values, see below
npm run dev
```

Open http://localhost:3000 — it redirects to `/en` or `/pt` depending on
your browser's language.

```bash
npm run build   # production build
npm run lint    # ESLint
npm run typecheck
```

## Project structure

```
src/
  app/
    [locale]/            # every page lives under a locale segment
      page.tsx           # home (all sections)
      contacto/          # contact page + form (slug localizes to /contact in EN)
      comunidade/        # community waitlist (slug localizes to /community in EN)
      merch/             # merch waitlist
    api/
      waitlist/route.ts  # POST — validates, rate-limits, subscribes via Resend
      contact/route.ts   # POST — validates, rate-limits, emails Alex
    sitemap.ts, robots.ts
  components/            # Header, Footer, forms, section components
  i18n/                  # next-intl routing/navigation config
  lib/                   # site config, validation schemas, email, rate limiter
messages/
  en.json, pt.json       # all UI copy — nothing is hardcoded in components
public/
  videos/, images/       # hero + photography media (compressed, see below)
```

## What was fixed from the previous site

- **Duplicated sections**: the previous Framer export had no single source
  of truth for each section (Hero, My Journey, Photography, Stats & Facts /
  Premium Services), which is how the reported duplicates and the
  "self-improve & techollogie" typo happened. This rewrite has exactly one
  component per section, content driven entirely by `messages/*.json`, so
  that class of bug can't recur.
- **Broken email link**: the footer/contact links now point to
  `mailto:contact@alexffb.com` everywhere (previously `dummy@mail.com`).
- **Placeholder text**: searched for `dummy`, `test`, `lorem`, `TODO` across
  the previous export — none left. Stats & Facts now shows Alex's confirmed
  real figures (revenue, projects delivered, satisfaction rate) instead of
  the `0` the old site rendered before those were provided.
- **Copy**: hero intro, meta description and OG/Twitter description now
  match the approved copy verbatim (see `messages/en.json`).

## What's left for Alex

- [x] **Real Stats & Facts numbers.** Confirmed by Alex: +10k€ revenue
  generated (before turning 18), +15 projects delivered, 200% satisfaction
  rate — see `Stats.business` in `messages/en.json` / `messages/pt.json`.
- [x] **Contact email confirmed** — `contact@alexffb.com`.
- [x] **Social links confirmed** — Instagram (`@alexffb_`) and YouTube
  (`@alexffb`), live in the footer and in the `Person` JSON-LD `sameAs`.
- [ ] **Resend API key.** A key was provided but this environment's network
  policy blocks direct calls to `api.resend.com` (and the Resend Connector
  needs an interactive OAuth step this session can't do), so the domain
  verification and the two Audiences still need to be created by hand in the
  Resend dashboard — see "Resend setup" below. Until then, waitlist/contact
  submissions still succeed (so the forms are fully testable end-to-end) but
  no email is actually sent — a warning is logged instead.
- [ ] **Photography section alt text** was rewritten to actually describe
  each photo (the Framer export had leftover template alt text like "Wine
  Bottle" and "Coffee Pack" on photos that are actually of you) — please
  sanity-check the wording in `messages/en.json` / `pt.json` under
  `Photography.alt`.
- [ ] **Accent color contrast.** Lighthouse flags the brand accent
  (`#ff462e`) as failing WCAG AA contrast for small text/button labels
  (3.2–3.4:1 against the light background/white text, needs 4.5:1) — this is
  a pre-existing brand-color issue, not something introduced by the
  rewrite, and the brief asked not to touch the palette, so it hasn't been
  changed. If you want this fixed, the smallest change is a slightly darker
  "accent-text" shade used only where accent-colored text sits on a light
  background (kickers, labels) — happy to add that if you confirm you're
  OK with a small variant of the palette for that specific case.
- [x] **Domain confirmed** — `https://alexffb.com`, already the default in
  `.env.example`.
- [x] **Supabase backup log wired up** — a dedicated Supabase project
  (`alexffb`, separate from the `toolstack` project's database) with a
  `waitlist_submissions` table, RLS-restricted to insert-only. Credentials
  are in the Vercel env var block below.
- [ ] **Vercel project.** The connected Vercel integration doesn't have
  permission to create a new project or to reconnect an existing project's
  GitHub repo — see "Vercel setup" below for the one manual step needed.

### Vercel setup (manual — one step)

There's an existing Vercel project named `alexffb`, but it's linked to a
different, unrelated GitHub repo (`Alexffb32/alexffb.com`) and has no custom
domain attached. The connected Vercel integration in this environment can
neither create a new project (403 — out of the token's permission scope) nor
change an existing project's Git connection, so:

- Easiest: [vercel.com/new](https://vercel.com/new) → import
  `Alexffb32/ALEXFFB` as a **new** project (any name, e.g. `alexffb-site`) →
  add the environment variables below → once it deploys, point
  `alexffb.com`'s DNS at it (or add it as the project's domain in Vercel,
  which shows you the DNS to set).
- Alternative: in the existing `alexffb` project → Settings → Git →
  disconnect `alexffb.com` → connect `Alexffb32/ALEXFFB` instead. Keeps the
  same project/URL.

### Resend setup (manual — do this in the Resend dashboard)

The API key is meant to live only in Vercel's environment variables, never
in the repo. This environment couldn't reach `api.resend.com` or use the
Resend Connector to do this for you, so:

1. [resend.com/domains](https://resend.com/domains) → **Add Domain** →
   `alexffb.com` → add the DNS records Resend shows you wherever
   `alexffb.com`'s DNS is managed → **Verify**.
2. [resend.com/audiences](https://resend.com/audiences) → **Create
   Audience** twice: `Comunidade` and `Merch`. Copy each audience's ID.
3. In Vercel → Project Settings → Environment Variables, set:
   - `RESEND_API_KEY`
   - `RESEND_AUDIENCE_ID_COMUNIDADE` / `RESEND_AUDIENCE_ID_MERCH` (from
     step 2)
   - `RESEND_FROM_EMAIL` — needs a mailbox on the verified domain, e.g.
     `Alex Bento <no-reply@alexffb.com>`
   - `CONTACT_EMAIL_TO=contact@alexffb.com`
   - `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — from the
     `alexffb` Supabase project's Settings → API page (the publishable key,
     safe to expose — see `src/lib/supabase.ts`).

## Performance notes

- Hero and story background videos were re-encoded (H.264, scaled to 720px
  wide, no audio track, `faststart`) — same visual content, ~90% smaller
  files (e.g. the biggest hero clip went from 47 MB to 3 MB). See
  `scripts/compress-video.sh` to repeat this for any new video. They're also
  lazy-loaded (`src/components/LazyVideo.tsx`): nothing downloads until the
  video scrolls near the viewport.
- All images go through `next/image`, so they're automatically resized,
  served as AVIF/WebP when the browser supports it, and lazy-loaded below
  the fold (verified locally: the hero photo drops from ~850 KB to ~134 KB
  once re-encoded to AVIF at render size).
- **Lighthouse (mobile, throttled), run locally against a production build
  of `/en`** — this environment has no real deployment/CDN to test against,
  so treat these as a baseline, not final numbers; re-run against the live
  URL once deployed (Vercel/Netlify both get a real edge cache the sandbox
  here doesn't):
  - Performance: 80–83
  - Accessibility: 92
  - Best Practices: 100
  - SEO: 100
  - Core Web Vitals: FCP ~0.9s, LCP ~4.7–5.1s (simulated slow-4G/4x-CPU
    throttling — the hero photo is the LCP element), CLS 0, TBT ~70–110ms.
  - The LCP headroom left is mostly the hero photo's initial byte cost
    under Lighthouse's throttled mobile profile; a CDN in front of
    `/_next/image` (which Vercel/Netlify provide automatically) closes most
    of that gap.

## Security notes

- No secrets are committed — everything sensitive is read from environment
  variables (`.env.example` documents every one; `.env`/`.env.local` are
  gitignored).
- `next.config.mjs` sets CSP, `X-Frame-Options`, `X-Content-Type-Options`,
  `Referrer-Policy`, `Permissions-Policy` and HSTS on every response.
- Both API routes (`/api/waitlist`, `/api/contact`) validate and sanitize
  input with `zod`, reject a filled-in honeypot field silently, and rate-limit
  by IP (5 req/min for waitlist, 3 req/min for contact).
- The rate limiter (`src/lib/rate-limit.ts`) is in-memory, which is fine for
  a low-traffic personal site but is per-instance on serverless platforms —
  see the comment in that file if abuse ever becomes a real problem (swap
  for Upstash Redis without changing the call site).

## i18n notes

- Locale is auto-detected from the browser on first visit; the choice is
  then remembered (cookie) and can be changed anytime with the EN/PT toggle
  in the header — present on every page.
- Every page has its own localized slug (e.g. `/en/community` vs
  `/pt/comunidade`) with correct `hreflang` alternates, declared in
  `src/i18n/routing.ts` and reflected in `sitemap.ts`.
- All visible copy lives in `messages/en.json` / `messages/pt.json` —
  nothing is hardcoded in components.
