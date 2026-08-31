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
- **Resend** for the waitlist confirmation emails / audience tagging (not
  wired to a real account yet — see "What's left for Alex" below)

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
  the previous export; the only legitimate `TODO` left is the Stats & Facts
  business figures (see below) — the code deliberately never renders a bare
  `0` for those.
- **Copy**: hero intro, meta description and OG/Twitter description now
  match the approved copy verbatim (see `messages/en.json`).

## What's left for Alex

- [ ] **Real Stats & Facts numbers.** Revenue generated, projects delivered
  and client satisfaction rate are not published — see the `TODO` comment in
  `src/components/sections/StatsSection.tsx` and `Stats.businessNote` in
  `messages/en.json` / `messages/pt.json`. The hackathon/Erasmus/youth-politics/events
  stats are already real and live.
- [ ] **Confirm the contact email.** Using `contact@alexffb.com` throughout —
  please confirm this is the address you want live (and that it's actually
  receiving mail / forwarding somewhere you check).
- [ ] **Resend API key** (or tell us if you'd rather use a different ESP —
  Mailchimp, ConvertKit, etc., the integration lives in one file:
  `src/lib/email.ts`). Until `RESEND_API_KEY` is set, waitlist/contact
  submissions still succeed (so the forms are fully testable end-to-end) but
  no email is actually sent — a warning is logged instead. To wire it up:
  1. Create a [Resend](https://resend.com) account and verify your sending
     domain.
  2. Create **two separate Audiences** in Resend — one for `/comunidade`,
     one for `/merch` — so the two lists never mix.
  3. Fill in `.env.local` (copy from `.env.example`): `RESEND_API_KEY`,
     `RESEND_AUDIENCE_ID_COMUNIDADE`, `RESEND_AUDIENCE_ID_MERCH`,
     `RESEND_FROM_EMAIL`.
- [ ] **Social links.** `src/lib/site.ts` has a `sameAs` array (used in the
  JSON-LD `Person` schema) that's currently empty — add Instagram/LinkedIn/X
  URLs if you want them picked up by Google's Knowledge Graph.
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
- [ ] **Domain/hosting.** `NEXT_PUBLIC_SITE_URL` in `.env.example` assumes
  `https://alexffb.com` — update it (and the Vercel/Netlify project's env
  vars) to whatever the real production domain ends up being.

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
