# Alex Bento — Website

The original site (design, layout, palette, typography, hero media,
copy — everything visual) is **untouched**. Across two passes this repo
only: fixed real bugs, removed genuinely dead files, compressed the heavy
videos (~50% smaller, same visual content), added SEO metadata that was
empty, repurposed the unused About/Work/Blog nav slots into
Comunidade/Merch/Newsletter (About and Work had no real content — see
"Nav restructure" below), and added three waitlist pages
(`/comunidade`, `/merch`, `/newsletter`) styled to match the existing
brand. Nothing about how the existing pages *look* was changed.

## What this is

A static site (the original exported HTML/CSS/JS) plus small serverless
functions under `/api` for the waitlist forms. No framework, no build step
for the site itself — Vercel serves the HTML/CSS/JS/assets directly and
runs `/api/waitlist.js` as a Node function.

```
/
├── index.html, contact/             — the original site (unchanged design)
├── comunidade/, merch/, newsletter/ — waitlist pages (each + /confirmado/)
├── assets/
│   ├── waitlist.css, waitlist.js    — the waitlist pages' own styling/logic
│   └── framer-patch.js              — see "Nav restructure" below
├── api/
│   ├── waitlist.js                  — POST endpoint: validate → Resend → Supabase
│   └── _lib/                        — validation, rate limiting, email, db helpers
├── framerusercontent.com/,          — mirrored asset hosts the original site
│   framer.com*, fonts.gstatic.com/,   references (kept as-is so paths still work)
│   events.framer.com/
├── vercel.json                      — security headers, asset caching, redirects
├── robots.txt, sitemap.xml
└── package.json                     — dependencies for the /api functions only
```

## Nav restructure (About/Work → Comunidade/Merch, Blog → Newsletter)

`/about/` was a byte-for-byte duplicate of the homepage (no unique content),
and `/work/` and `/blog/` never existed in this repo at all — only their nav
entries did, pointing at `https://alexffb.com/work` and `/blog`, which don't
resolve to anything real. Since none of that was genuine content, those
three nav/footer slots were repurposed in place instead of leaving dead
links: **About → Comunidade, Work → Merch, Blog/Insights → Newsletter**.
`/about/` itself was deleted; `vercel.json` redirects `/about`, `/work` and
`/blog` so old links don't 404.

**Important technical finding, worth knowing before touching this site
again:** this is a *compiled Framer export*, not plain static HTML — it
ships a React runtime that hydrates on load and **silently reverts any
edit to nav/link/image markup back to Framer's own bundled values within
~500ms**, including the `href` attribute (verified with Playwright: editing
the raw HTML alone looked correct in the file, but a live browser reset it
after hydration). This is how a previously-reported "fix" turned out to be
incomplete: the `mailto:dummy@mail.com` bug was fixed in the raw HTML in an
earlier pass, but a **real browser was still resetting it back to
`dummy@mail.com` after load** — only caught now by testing with an actual
headless browser instead of just diffing the static HTML.
Framer's Page Link components also route clicks through their own React
`onClick` handler bound independently of the `href` attribute, so even a
successfully-patched `href` doesn't change where a click actually goes.

`assets/framer-patch.js` (loaded only on `index.html`/`contact/index.html`,
the two Framer-compiled pages) works around this: it runs after hydration
and forces the nav/footer/CTA text+links and the four Services-card icons
to the intended values, then clones each patched link (which drops React's
internal event-handler reference so a click falls through to normal
browser navigation via the corrected `href`) and keeps re-asserting via a
`MutationObserver` in case Framer's runtime re-renders later (resize,
scroll animations, etc). Verified end-to-end with Playwright: every
repurposed link now both *displays* and *clicks through to* the right
page. If you ever add another nav change here, **test it with an actual
browser after the JS has run, not just by reading the HTML file** — the
static markup can look right and still be wrong once hydrated.

*(`framer.com/` mirror folder was removed — verified unused, see "What was
fixed" below.)*

## Bugs fixed

- **`mailto:` pointed to `dummy@mail.com`** instead of the displayed
  `contact@alexffb.com`, on all three pages. A first pass fixed this in the
  raw HTML, but it turned out Framer's hydration was resetting it back to
  `dummy@mail.com` in a real browser — only caught by testing with
  Playwright, see "Nav restructure" above. Now patched so it actually
  sticks.
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
- The 4 "Pro Services" card images were unrelated stock photos (a random
  man, a coffee bag, a cream tube, a spray bottle — Framer template
  placeholders with no connection to the actual service each card
  describes). Replaced with small inline SVG icon tiles in the site's own
  palette (funnel for Marketing, network nodes for AI, code brackets for
  Design & Development, a gear for Systems & Operations) — no external
  images, so nothing to source or license.
- Framer's own "Create a free website with Framer" watermark badge (it's
  injected client-side into `#__framer-badge-container`, not present in
  the static HTML at all) is now hidden via CSS — this site is
  self-hosted on Vercel, not served through Framer's own hosting.

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
- [Vercel Speed Insights](https://vercel.com/docs/speed-insights) added
  (`<script defer src="/_vercel/speed-insights/script.js">` on every
  page) — this is the static-site integration method (no npm package;
  that's only for framework projects like Next.js). If the dashboard
  still shows "no data" after visiting the site a few times, check
  Project → Speed Insights is turned on for this project.

## SEO

- Per-page meta description, OG/Twitter tags, fully-qualified `og:image`.
- Canonical fixed to `https://alexffb.com/`. `/contact/` also canonicalizes
  to the homepage — it's an identical full-page copy of the same one-page
  site, so this avoids a duplicate-content penalty instead of competing
  with the homepage in search results. (`/about/` was deleted outright
  rather than kept canonicalized — see "Nav restructure" above.)
- `Person` + `Organization` JSON-LD added to the homepage.
- `robots.txt` and `sitemap.xml` added (sitemap lists the homepage and the
  three waitlist pages; `/contact/` is intentionally excluded since it
  canonicalizes away).

## Waitlist pages

`/comunidade`, `/merch` and `/newsletter` — name + email form, styled with
the site's own palette (`#f9f9f9` background, `#090909` text, `#ff462e`
accent) and Inter font, not the existing page markup (Framer's compiled
component structure is too tightly coupled to its own runtime to safely
reuse for a hand-built page — reusing the exact same colors/type/spacing
was the goal, not the literal DOM). Each has a `/confirmado/` page after a
successful signup, and each is reachable from the main nav (repurposed
from the old About/Work/Blog slots — see "Nav restructure" above).

All three submit to `POST /api/waitlist`, which:
1. Validates input (zod) and rate-limits by IP (5/min).
2. Silently no-ops on a filled honeypot field (bots don't learn they were
   caught).
3. Adds the contact to the matching Resend Audience **and sends that
   person a confirmation/thank-you email** (`api/_lib/email.js` has
   distinct copy per list — Comunidade, Merch, Newsletter each get their
   own message). This was already built in an earlier pass; it just needs
   `RESEND_API_KEY` and each list's `RESEND_AUDIENCE_ID_*` set in Vercel
   to actually send (Comunidade/Merch should already work if those were
   set up before; Newsletter's is the one still pending — see Setup).
4. Logs the same signup into a Supabase table as a backup registry
   (best-effort — never blocks the response).

**The existing "Submit Now" contact form was tested this round** (filled it
out and watched the network in a real headless browser): it POSTs to
`https://api.framer.com/forms/v1/forms/ee267207-6115-45f5-8a93-373713c69389/submit`
— Framer's own hosted Forms API, tied to that form's ID in the original
Framer project, independent of where the exported HTML is hosted. That
endpoint is blocked by this sandbox's network policy, so **the actual
delivery could not be confirmed end-to-end from here** — the form is not
broken by the export/self-hosting (it's calling a real, still-live Framer
API, not a dead relative path), but whether submissions still land
somewhere Alex checks depends on that Framer project/account staying
active.

**Because that couldn't be confirmed, a second, guaranteed channel was
added** (`assets/framer-patch.js` + `api/contact.js`): every submission is
also forwarded straight to `POST /api/contact`, which emails it via
Resend to `CONTACT_NOTIFY_EMAIL`. Both happen independently on the same
submit — nothing is removed from the native Framer path, this only adds
a path that doesn't depend on a third-party account staying active.
Verified with Playwright: filling and submitting the form fires both
`https://api.framer.com/forms/...` and `/api/contact` on the same click,
with the real field values reaching `/api/contact` intact (the forward
listener runs in the capture phase so it reads the fields before
Framer's own bubble-phase handler can reset them). Same honeypot
(`name="website"`), rate limiting (5/min/IP) and zod validation pattern
as the waitlist endpoint. **Needs `RESEND_API_KEY`** (already set for the
waitlist to work) **and a new `CONTACT_NOTIFY_EMAIL` env var** — set it
to Alex's personal inbox in Vercel's Environment Variables.

## Analytics

Google Analytics (`gtag.js`, same measurement ID already on the homepage)
was added to all three waitlist pages and their `/confirmado/` pages,
which previously had no analytics at all. Each `/confirmado/` page fires a
`waitlist_signup` event with a `list` parameter (`comunidade`/`merch`/
`newsletter`) on load — the standard, reliable way to track a form
conversion (rather than firing from the form's JS right before navigating
away, which risks the event never sending). To see these in GA4: Admin →
Events, or build a report filtered to `waitlist_signup`, broken down by
the `list` parameter.

## Accessibility

- Audited every `<img>` on the two Framer-compiled pages: all 34 have an
  `alt` attribute; 6 are `alt=""` and are genuinely decorative background
  shapes/blurs (correct per WCAG — decorative images should be silent to
  screen readers, not padded with meaningless alt text).
- **Fixed a real contrast failure**: white button text on the `#ff462e`
  accent (the waitlist "Subscribe"/"Join the waitlist" buttons) measured
  3.40:1, short of the 4.5:1 WCAG AA minimum for normal text. Rather than
  touch the brand accent color, the button text is now 19px/700 weight,
  which qualifies as "large text" under WCAG (3:1 minimum) — passes at the
  same color, same brand red.
- **Fixed a real keyboard-accessibility bug**: form inputs had
  `outline: none` on focus with no replacement — a real WCAG 2.4.7
  failure (keyboard users couldn't see which field was focused). Added a
  visible focus ring (`box-shadow` + border-color) on inputs and a
  standard `outline` on links/buttons, all via `:focus-visible` (so it
  only shows for keyboard navigation, not every mouse click).
- Verified with Playwright: Tab order on the waitlist forms correctly
  skips the honeypot field (`tabindex="-1"`) and reaches
  name → email → submit in order.

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
- `RESEND_AUDIENCE_ID_COMUNIDADE`, `RESEND_AUDIENCE_ID_MERCH`,
  `RESEND_AUDIENCE_ID_NEWSLETTER`
- `CONTACT_NOTIFY_EMAIL` — where `/contact/`'s "Submit Now" form's
  messages get emailed (new this round, see "Waitlist pages" above)
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`

(Names/IDs for Resend and Supabase were already created in an earlier pass
and are unchanged for Comunidade/Merch — see chat history / ask Alex for
the values, they're intentionally not in this repo. **The Newsletter
audience still needs to be created** in the Resend dashboard — this
sandbox has no network access to `api.resend.com` to do it directly — then
set `RESEND_AUDIENCE_ID_NEWSLETTER` in Vercel's env vars.)

## Security

- No secrets committed — `.env` is gitignored, `.env.example` documents
  every variable with empty values.
- Both the honeypot field and server-side zod validation guard the one
  API endpoint; rate-limited in-memory (see the comment in
  `api/_lib/rateLimit.js` for the known per-instance limitation on
  serverless).
- `vercel.json` sets `X-Frame-Options`, `X-Content-Type-Options`,
  `Referrer-Policy`, `Permissions-Policy`, and HSTS.
- **Content-Security-Policy added** in `vercel.json`, now that there's a
  way to verify it: tested by serving the site locally behind a Python
  server that sets the exact same CSP header and loading every page
  (`/`, `/contact/`, `/comunidade/`, `/merch/`, `/newsletter/`, plus
  submitting both the waitlist form and the native contact form) in a
  real headless browser, checking for CSP violation console messages.
  Zero violations. The policy allows exactly what the page actually uses
  — `googletagmanager.com` (Analytics), `cdn.unicorn.studio` (the WebGL
  background), `framer.com` (icon loader + editor-detection),
  `fonts.googleapis.com`/`fonts.gstatic.com`, `api.framer.com` (the native
  contact form's submit target) — and blocks everything else, including
  `object-src 'none'`, `frame-ancestors 'none'`, and a restricted
  `form-action`. `script-src`/`style-src` need `'unsafe-inline'` because
  the compiled Framer output has many inline `<script>` tags and
  `style="..."` attributes with no build step available to add nonces —
  a real static site with build tooling could tighten this further.
