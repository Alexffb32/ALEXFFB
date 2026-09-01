# Alex Bento — Website

The original site (design, layout, copy, palette, typography, hero media —
everything visual) is **untouched**. This pass only: fixed real bugs,
removed genuinely dead files, compressed the heavy videos (same visual
content, ~50% smaller), added SEO metadata that was empty, and added two
new waitlist pages (`/comunidade`, `/merch`) styled to match the existing
brand. Nothing about how the existing pages look was changed.

## What this is

A static site (the original exported HTML/CSS/JS) plus two small serverless
functions under `/api` for the waitlist forms. No framework, no build step
for the site itself — Vercel serves the HTML/CSS/JS/assets directly and
runs `/api/waitlist.js` as a Node function.

```
/
├── index.html, about/, contact/     — the original site (unchanged design)
├── comunidade/, merch/              — new waitlist pages (+ /confirmado/)
├── assets/                          — CSS/JS for the new waitlist pages only
├── api/
│   ├── waitlist.js                  — POST endpoint: validate → Resend → Supabase
│   └── _lib/                        — validation, rate limiting, email, db helpers
├── framerusercontent.com/,          — mirrored asset hosts the original site
│   framer.com*, fonts.gstatic.com/,   references (kept as-is so paths still work)
│   events.framer.com/
├── vercel.json                      — security headers, asset caching
├── robots.txt, sitemap.xml
└── package.json                     — dependencies for the /api functions only
```

*(`framer.com/` mirror folder was removed — verified unused, see "What was
fixed" below.)*

## Bugs fixed

- **`mailto:` pointed to `dummy@mail.com`** instead of the displayed
  `contact@alexffb.com`, on all three pages.
- **Every internal nav link (Home/About/Contact, header + footer) pointed
  at the old `alexffb.framer.website` domain** with paths that no longer
  resolve once self-hosted (e.g. `../alexffb.framer.website/about/index.html`).
  Clicking About/Contact from Home was broken. Fixed to clean relative
  paths (`/`, `/about/`, `/contact/`); `Work`/`Blog` (pages that don't exist
  in this export) now at least point at the real `alexffb.com` domain
  instead of the dead one.
- **Canonical URL and `og:url`** pointed at `alexffb.framer.website`
  instead of `alexffb.com`.
- **Empty meta description / OG / Twitter description** on all three pages
  — filled in with real copy.
- **`og:image`/`twitter:image` were root-relative** (`/framerusercontent.com/...`),
  which social crawlers can't reliably resolve — now fully-qualified
  (`https://alexffb.com/...`).
- All asset paths (images, videos, fonts) were relative (`../` / `../../`),
  which only worked at the original nested Framer export path. Normalized
  to root-relative (`/framerusercontent.com/...`) so the site works
  self-hosted at the domain root.

## Removed (verified unused first)

- 4 `.DS_Store` files (macOS junk, never referenced).
- The `framer.com/` mirror folder (48 KB) — confirmed via full-text search
  across every HTML *and* every JS module that nothing references it by
  relative path; the one live reference to `framer.com` in the site's own
  runtime script uses the real absolute `https://framer.com/...` URL, not
  this local copy.

**Important, so it isn't repeated by mistake later:** an earlier pass in
this session also deleted ~130 files under `framerusercontent.com/`
(images, video variants, and JS module chunks) that *looked* unused because
they weren't directly referenced in the three HTML files' `src`/`href`
attributes — but Framer's compiled runtime references many of them
dynamically from inside its own `.mjs` chunk files (per-component code
splitting), not from the HTML. That broke the site (missing images, broken
runtime chunks) until caught and every file was restored and verified
byte-identical against the original commit. Lesson baked into this repo:
**don't prune anything under `framerusercontent.com/{images,assets,cms,
sites,modules}` without grepping the compiled `.mjs`/`.js` files too, not
just the HTML.**

## Performance

- The 5 videos actually used on the page were re-encoded (H.264, scaled
  down, audio stripped since they're already `muted`, `faststart`) —
  same visual content, same filenames (no HTML changes needed):
  - `i52Lqt6...mp4`: 46 MB → 3.0 MB
  - `HLnii1d...mp4`: 42 MB → 2.4 MB
  - `fio0Geu...mp4`: 32 MB → 3.3 MB
  - `wCXHBJD...mp4`: 6.2 MB → 2.9 MB
  - `ZxMUyWv...mp4`: 4.8 MB → 0.27 MB
  - Spot-checked a frame from the largest change before/after — visually
    identical. Script to repeat this for any future video:
    `scripts/compress-video.sh` (see below).
- Images already had no `loading` attribute anywhere; added
  `loading="lazy" decoding="async"` to all of them except the header logo
  and the hero photo (kept eager so the first paint isn't delayed).
  Zero visual effect — this only defers the network fetch for
  below-the-fold images.
- `Cache-Control: public, max-age=31536000, immutable` on
  `/framerusercontent.com/*` via `vercel.json`.

## SEO

- Per-page meta description, OG/Twitter tags, fully-qualified `og:image`.
- Canonical fixed to `https://alexffb.com/`. `/about/` and `/contact/` also
  canonicalize to the homepage — they're identical full-page copies of the
  same one-page site, so this avoids a duplicate-content penalty instead of
  competing with the homepage in search results.
- `Person` + `Organization` JSON-LD added to the homepage.
- `robots.txt` and `sitemap.xml` added (sitemap lists the homepage +
  the two new waitlist pages; about/contact are intentionally excluded
  since they canonicalize away).

## New: waitlist pages

`/comunidade` and `/merch` — name + email form, styled with the site's own
palette (`#f9f9f9` background, `#090909` text, `#ff462e` accent) and Inter
font, not the existing page markup (Framer's compiled component structure
is too tightly coupled to its own runtime to safely reuse for a hand-built
page — reusing the exact same colors/type/spacing was the goal, not the
literal DOM). Each has a `/confirmado/` page after a successful signup.

Both submit to `POST /api/waitlist`, which:
1. Validates input (zod) and rate-limits by IP (5/min).
2. Silently no-ops on a filled honeypot field (bots don't learn they were
   caught).
3. Adds the contact to the matching Resend Audience and sends a
   confirmation email.
4. Logs the same signup into a Supabase table as a backup registry
   (best-effort — never blocks the response).

The existing "Submit Now" contact form on the main page (Framer's own form
component) was **not** touched or verified — it was out of scope for this
pass. If it doesn't submit anywhere now that the site isn't Framer-hosted,
that's a separate, pre-existing thing to look at.

## Setup

```bash
npm install        # only needed for the /api functions' dependencies
```

There's no dev server needed for the static pages — open the HTML files
directly or serve the folder with anything static
(`python3 -m http.server`, `npx serve`, etc.) to preview. The `/api`
functions only run under Vercel (`vercel dev` locally, or once deployed).

Copy `.env.example` to `.env` for local API testing, and set the same
variables in the Vercel project's Environment Variables for production:

- `RESEND_API_KEY`, `RESEND_FROM_EMAIL`
- `RESEND_AUDIENCE_ID_COMUNIDADE`, `RESEND_AUDIENCE_ID_MERCH`
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`

(Names/IDs for Resend and Supabase were already created in an earlier pass
and are unchanged — see chat history / ask Alex for the values, they're
intentionally not in this repo.)

## Vercel project setting that needs changing

The Vercel project's **Framework Preset** is currently set to **Next.js**
(from the previous attempt at this site). This repo is no longer Next.js —
go to Project → Settings → General → Build & Development Settings and set
Framework Preset to **Other**, then redeploy. With it still set to Next.js,
Vercel will try to run `next build` against a repo that has no Next.js in
it and the build will fail.

## Security

- No secrets committed — `.env` is gitignored, `.env.example` documents
  every variable with empty values.
- Both the honeypot field and server-side zod validation guard the one
  API endpoint; rate-limited in-memory (see the comment in
  `api/_lib/rateLimit.js` for the known per-instance limitation on
  serverless).
- `vercel.json` sets `X-Frame-Options`, `X-Content-Type-Options`,
  `Referrer-Policy`, `Permissions-Policy`, and HSTS.
- **No Content-Security-Policy was added.** The page already loads Google
  Analytics (`googletagmanager.com`), a third-party WebGL background
  library (`cdn.unicorn.studio`), and Framer's own editor-detection script
  (`framer.com`) — getting a CSP allowlist exactly right for all of these
  without being able to load the page in a real browser from this
  environment felt too risky to ship blind (a wrong CSP silently breaks
  scripts, no error most people would notice). Happy to add one if you
  want it enough to verify it after deploying.
