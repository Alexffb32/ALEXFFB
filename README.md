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

## What's still only in the live Framer project

Chasing down a "Los Angeles" address the site was supposed to have led to
a bigger discovery: this repo's Contact page is missing real content that
exists on the actual, live Framer project — an address block, an FAQ
accordion ("What does a project look like?", pricing, scope, ROI, etc.),
none of which is anywhere in this export (confirmed by searching every
HTML file, the hydrated DOM at every breakpoint, and every compiled `.mjs`
chunk actually loaded by these two pages). It only turned up in a
`searchIndex-*.json` file and one `.mjs` chunk that **isn't loaded by
either `index.html` or `contact/index.html`** — i.e. it belongs to a page
this original export never captured, same as the About/Work/Blog pages
documented in "Nav restructure" above. The fake address has been replaced
with a real one (see "Bugs fixed" below), but if there's more real Contact
page content (FAQ answers, etc.) worth having, it needs to be written from
scratch here — there's nothing to "restore," the original was never
exported.

Also found while investigating: the "Shots By Me" / photography section
on the homepage uses **stock template images**, not real photos of Alex —
`alt` text gives it away (`Woman In The Water`, `Car`, `Spray Bottle`,
`Woman In The Glass Way`, `Blue Space`, `Man Wearing Black Coat`, `Wine
Bottle`). Left untouched this round since it wasn't asked for and — per
the standing rule from earlier in this project — template content gets
flagged for confirmation before being touched, not changed unilaterally.
Worth a decision: remove the section, or replace with real photos if
Alex has any to use.

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
- **Framer's "Create a free website with Framer" watermark badge was
  still showing** despite being hidden via `#__framer-badge-container` —
  strengthened the CSS to also target `.__framer-badge` directly as a
  second, redundant selector in case a different build/breakpoint renders
  it under a different wrapper. Confirmed via Playwright that the actual
  badge element on this site (there is only one — the "Use for Free"
  button some earlier screenshots showed belongs to a page/template not
  part of this export, its component chunk isn't even loaded here) has
  `display: none`; if it's still visible after this, it's very likely a
  stale cached page load — hard-refresh.
- **The header/hero's entrance animation ("Loader" element) could freeze
  partway through** — traced to `assets/framer-patch.js`'s own
  `MutationObserver`, which was watching the entire document body
  (`childList`+`subtree`) and re-ran on every DOM change. During the
  hero's own multi-second entrance animation (which mounts/animates many
  nodes), that fired this patch dozens of times a second, competing with
  Framer's animation loop for the main thread. Replaced the continuous
  observer with two staggered one-time re-checks (800ms/2000ms) — enough
  to catch the known, one-time hydration revert (verified to happen
  within ~500ms) without ever competing with an in-progress animation.
- **No address anywhere on the site.** The real Contact page (with an
  address, FAQ, etc.) was never part of this export — see "What's still
  only in the live Framer project" below. Added a real one via
  `assets/framer-patch.js` next to the footer's email link: **A
  Incubadora, A Praça, Fundão, Portugal** (replacing the placeholder "49th
  St. Los Angeles, California(CA), 90011" address that only existed in
  the un-exported Contact page's search index — see below).

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

- The videos actually used on the page were re-encoded (H.264, scaled
  down — never upscaled, the script now caps at `min(720, original width)`
  — audio stripped since they're already `muted`, `faststart`) — same
  visual content, same filenames (no HTML changes needed):
  - `i52Lqt6...mp4`: 46 MB → 3.0 MB
  - `HLnii1d...mp4`: 42 MB → 2.4 MB
  - `fio0Geu...mp4`: 32 MB → 3.3 MB
  - `wCXHBJD...mp4`: 6.2 MB → 2.9 MB
  - `ZrNTj0qE...mp4`: 713 KB → 264 KB — **missed in the earlier pass**: an
    earlier session compressed `ZxMUyWv...mp4` instead, which turns out to
    not actually be rendered anywhere on either page (verified by querying
    the live, hydrated DOM for every `<video>` element) — this is the
    video that's genuinely on the homepage/contact hero and it still had
    its (unused, since the element is `muted`) audio track until now.
  - `MLWPbW1d...mp4`: 1.7 MB → 370 KB — not found in the rendered DOM on
    either page either; compressed anyway since that's a safe, non-risky
    optimization regardless of whether it's still used somewhere (unlike
    deleting it, which needs more certainty — see the
    framerusercontent.com/{images,...} lesson above).
  - Spot-checked a frame from each before/after — visually identical.
    Script to repeat this for any future video: `scripts/compress-video.sh`
    (see below).
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

**Why it looked broken after that was added:** Vercel's custom domain
(`www.alexffb.com`) doesn't automatically follow new commits on this
branch — someone has to promote each new deployment (or merge to `main`,
if that's the Production Branch) for it to go live. Checking Vercel's
runtime logs for `/api/contact` showed **zero invocations ever** —
confirming the endpoint was never actually reachable at the domain being
tested, because the deployment carrying it hadn't been promoted yet. Not
a code bug; see "Deploying" below.

## Real-content rewrites (Pro Services, Aeternus Progressus, Selfmade)

Some of the homepage's copy read like a freelance agency's sales pitch
("Convert More, Grow Faster", "that turn attention into paying clients",
"built to earn trust, convert and grow your revenue") rather than
describing what Alex actually does. Rewritten:

- **Pro Services bullets**: "Convert More, Grow Faster" / "Future-Proof &
  Scalable" → his actual roles, "Vice-President, Selfmade Association" /
  "Project Manager, Aeternus Progressus".
- **The 4 service card descriptions**: reframed from client-facing pitch
  copy to first-person descriptions of his real work (Aeternus Progressus,
  Layout Agency, Selfmade) — see the git diff for exact before/after text.
- **Aeternus Progressus role**: "Consultant" → "Project Manager" (his
  actual title there), in both the role label and the body text.
- **The two Selfmade Association texts** were near-duplicates of each
  other. Rebalanced so the first (in the About section) leads with what
  Selfmade *is*, and the second (in the Journey timeline) leads with what
  *Alex does* there — running the podcast, coordinating Erasmus+ mobility,
  pushing entrepreneurship programs — instead of repeating the same
  organization description twice.

Same hydration-revert problem as everything else on these two pages: a
raw-HTML-only edit here silently reverts after ~500ms in a real browser
(verified again on this batch specifically). Fixed the same way — edited
the HTML for first paint/crawlers, and added the same replacements to
`assets/framer-patch.js`'s text-walking patch so they actually stick.
Verified with Playwright that every rewritten string is present in the
final rendered page and every old string is gone.

## Waitlist page redesign: dark hero + articles teaser

All three waitlist pages were originally a plain white-background form,
which didn't feel like part of the same site. All three now open with a
dark video hero matching the homepage's actual visual language: real
background footage already used elsewhere on the site (not stock), the
same italic "Instrument Serif" display font + red asterisk accent as the
homepage's "Alexandre*" title, the same thin red top bar, and a staggered
fade-up entrance animation on the hero text and the form card
(`prefers-reduced-motion` respected). Each page got its own real clip:
`ZrNTj0qE...mp4` (Newsletter — Alex at his desk), `HLnii1d...mp4`
(Comunidade — a real conference/audience clip), `i52Lqt6...mp4` (Merch —
a real casual clip). Copy was tightened too: Merch's hero now uses the
actual planned collection name from the project brief, "Anti University
Social Club", instead of a generic "Merch Waitlist" label.

**Newsletter specifically** no longer shows the Name+Email card at all —
per request, it now mirrors what a real "Articles" page looks like: an
"Articles — Coming soon" section with 3 placeholder cards (a subtle
animated shimmer, `prefers-reduced-motion`-safe) explaining real content
is coming, under a slim single-field **email bar** (not the heavier
waitlist card used on the other two pages) so subscribing is effectively
frictionless. This needed a small backend change: `name` is now optional
in the waitlist schema
(`api/_lib/validation.js`) — Comunidade/Merch still collect it for
personalized confirmation emails, Newsletter's bar only asks for email
and the confirmation email falls back to "Hi there,". Verified end-to-end
with Playwright: a Newsletter signup with no name field submits, passes
validation, and redirects to `/confirmado/` correctly.

There's no real Articles/Blog page yet — see "What's still only in the
live Framer project" above — so this is deliberately a "coming soon"
teaser, not a promise of content that doesn't exist. Update it once real
articles are written.

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

**Vercel Analytics** (`<script defer src="/_vercel/insights/script.js">`)
added alongside Speed Insights on every page — same static-site method
(a script tag, not the `@vercel/analytics` npm package, which is for
framework projects). Tracks visitors/page views; shows up in the
project's Analytics tab in the Vercel dashboard once it's collected a
few real visits.

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

## Deploying

This project's Vercel custom domain (`www.alexffb.com`/`alexffb.com`)
**does not automatically follow new commits on this branch** — pushing
here only creates a new Preview deployment; something has to explicitly
promote a deployment to Production (or merge to `main`, if that's set as
the project's Production Branch in Settings → Git) for the live domain to
actually update. This caused real confusion earlier: a fix would be
pushed, verified working on the preview URL, reported as done — and the
custom domain would still be serving the previous deployment, making a
genuinely-fixed bug look unfixed. **Before concluding something "doesn't
work" on the live domain, check which deployment it's actually serving**
(Vercel dashboard → Deployments, or compare a distinguishing string in the
page source against what the target commit should have).

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
