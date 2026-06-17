# AO Backlog — Emerge Digital Ecosystem

_Discovery pass (2026-06-17): 47 raw findings from 5 read-only auditors → deduped to 36 actionable items. **Status: draft for Rami to review/cut before any issue is filed.** Nothing here is a GitHub issue yet._

> **Resolved during this session — do NOT re-file:**
> - **#1 / #7 (font preload)** — the rebrand left `BaseLayout.astro` importing + preloading the **Inter** woff2 while text rendered in Lexend (unused font downloaded + wrong LCP preload). Fixed in **[PR #27](https://github.com/ralch22/emerge-digital-website/pull/27)** (merged): preload swapped to the Lexend latin subset, dead `@fontsource-variable/inter` dep removed, lockfile reconciled. The "redeploy — still serves Inter" framing of #1 was misleading — Lexend always *rendered*; the residual was the preload/import, now gone.

## Top 10 — do first

High-leverage quick-wins + trust/compliance-critical issues. Most are S effort.

| # | Title | Repo | Category | Sev | Effort | Fix |
|---|-------|------|----------|-----|--------|-----|
| 1 | ✅ **DONE (PR #27)** — preload Lexend not Inter | vision | brand/perf | high | S | Shipped this session. |
| 2 | Create legal pages (privacy/cookies/terms) — every footer link 404s sitewide + contact-form privacy link dead | vision | content | high | M | Add `src/pages/legal/{privacy,cookies,terms}.astro` with PDPL-aligned copy; point the contact-form link at the same canonical `/legal/privacy/`. Mandatory for a data-collecting enterprise/BFSI form. |
| 3 | Verify named case-study claims (Careem, Perfetti, Alsaif) before they stay public | vision | content | high | M | Confirm each engagement + metric is contractually real and client consents to attribution; else set `anonymized:true` and swap names for sector descriptors. Legal/trust exposure for a new entity. |
| 4 | Replace Tailwind Play CDN with compiled CSS in production | future | perf | high | M | Build a static purged `tailwind.css` at deploy; drop `cdn.tailwindcss.com` + inline config from all 3 pages. (Tailwind explicitly forbids the Play CDN in prod — render-blocking + FOUC.) |
| 5 | Return a real 404 — bogus URLs serve the homepage with HTTP 200 (soft-404) | future | seo | high | S | Add `404.html` (Vercel auto-serves with 404 status) so random paths stop indexing as duplicate `/`. |
| 6 | Replace SPA `not_found_handling` with a real 404 to stop soft-404 indexing | roai | seo | high | M | Set `not_found_handling = "404-page"` (+ `public/404.html`) or 404 from `src/index.js`; only `/` and `/guide` should be 200. |
| 7 | ✅ **DONE (PR #27)** — fix the LCP font preload (Lexend) | vision | perf | high | S | Shipped this session (merged with #1). |
| 8 | Wire the Insights newsletter form to a real endpoint — it silently discards every signup | vision | bug | high | M | `insights/index.astro` just `setTimeout(400)` then shows "You're subscribed." POST to a real endpoint (extend `worker.ts` `/api/subscribe` → Resend audience); only show success on 2xx. |
| 9 | Set long-lived immutable Cache-Control on hashed `/_astro/*` assets | vision | perf | high | S | Content-hashed assets currently return `max-age=0, must-revalidate`. In `worker.ts`, set `Cache-Control: public, max-age=31536000, immutable` for fingerprinted assets. |
| 10 | Add the `/#crawl-walk-run` anchor target on the homepage | vision | bug | med | S | Services "See the model" button jumps to homepage top — no `id="crawl-walk-run"` exists. Add the id to `CrawlWalkRun.astro`'s section wrapper. |

---

## Full backlog by repo

### vision (`vision.emergedigital.ae` — flagship Astro/Worker)

| Title | Category | Sev | Effort | Fix |
|-------|----------|-----|--------|-----|
| ✅ Preload Lexend (not Inter) as the LCP web-font | perf | high | S | **DONE — PR #27.** |
| ✅ Remove dead deps: `@fontsource-variable/inter` | tech-debt | low | S | **DONE — PR #27.** (`motion` still pending below.) |
| Create legal pages + fix contact-form privacy link (footer Privacy/Cookies/Terms + `/privacy/` all 404) | content | high | M | Add `src/pages/legal/{privacy,cookies,terms}.astro`; align contact-form link to `/legal/privacy/`. **Merged: 4 raw findings.** _(Top 10 #2)_ |
| Verify named case-study claims (Careem/Perfetti/Alsaif) | content | high | M | Confirm metrics + attribution consent; else anonymize. _(Top 10 #3)_ |
| Wire Insights newsletter form to a real endpoint | bug | high | M | POST to `/api/subscribe` → Resend; success only on 2xx. _(Top 10 #8)_ |
| Immutable Cache-Control on hashed `/_astro/*` assets | perf | high | S | `worker.ts` → `max-age=31536000, immutable` for fingerprinted assets. _(Top 10 #9)_ |
| Fix broken `/#crawl-walk-run` anchor (Services "See the model") | bug | med | S | Add `id="crawl-walk-run"` to `CrawlWalkRun.astro`. _(Top 10 #10)_ |
| Homepage ships two `<h1>` (desktop + mobile hero both in DOM) | seo | med | S | Demote one layout's heading to a styled `<p>`/`<span>` so exactly one H1 exists. **Merged: 2 raw findings.** |
| Add Article + BreadcrumbList JSON-LD + per-page ogImage to case studies & insights | seo | med | M | Add a `headExtra`/schema slot to `BaseLayout`; emit Article + BreadcrumbList; pass the unused `hero` image as ogImage. |
| Re-typeset `/acc.html` to Lexend (hardcoded Inter on a deployed page) | brand | med | S | Swap inline `font-family` to Lexend + load the webfont. _(Or delete — see orphan item below.)_ |
| Point all conversion CTAs to `/contact/` (trailing slash) to avoid 307 per click | perf | low | S | Fix `href="/contact"` in `404.astro`, `insights/[slug].astro`, `case-studies/[slug].astro`, `case-studies/index.astro`. |
| Normalize internal links to trailing-slash form (breadcrumbs/canonical hop through 307) | perf | low | S | Trailing-slash all internal hrefs in `case-studies/[slug].astro` + `insights/[slug].astro`. |
| Drop `scroll-behavior: smooth` from html — fights Lenis | tech-debt | low | S | Remove `global.css:47`; Lenis owns smoothness. |
| Defer/move GA4 gtag out of the critical head position | perf | low | S | Move GA snippet after title/meta/CSS, or load on idle; keep `async`. |
| Add `twitter:image` meta (card declares `summary_large_image`, no image) | seo | low | S | Add `<meta name="twitter:image">` next to other twitter tags in `BaseLayout`. |
| Add `noindex` to `/styleguide` (live + indexable, only sitemap-excluded) | seo | low | S | Pass a `noindex` flag through `BaseLayout`, or disallow in robots.txt. |
| Use a raster PNG logo for Organization JSON-LD (not favicon.svg) | seo | low | S | Add `/logo.png` and reference it in the Organization `logo` field. |
| Remove remaining dead dep: `motion` | tech-debt | low | S | Drop from `package.json` after confirming zero imports. |
| Remove/justify orphan `public/acc.html` (unlinked, deploys to root) | tech-debt | low | S | Delete if leftover scaffolding, else link + add to sitemap/robots. _(Decide remove vs the re-typeset item above.)_ |
| Update `docs/brand-and-content.md` + `CLAUDE.md` — still prescribe Inter/Söhne | content | low | M | Update typography section to Lexend (primary) + Prompt (labels) + Lexend Zetta (display). |
| Fix stale `CLAUDE.md`: deploy target is a Worker, not Cloudflare Pages | tech-debt | low | S | Update Stack section to the Worker + static-assets model (`worker.ts`/`wrangler.jsonc`). |

### future (`future.emergedigital.com` — static Agentforce spoke)

| Title | Category | Sev | Effort | Fix |
|-------|----------|-----|--------|-----|
| Replace lime-green accent with brand teal | brand | high | L | Retheme `--lime`/`--lime-dark` + all `lime-400/300` usages to teal `#00C2C7`/`#3DDCE3` across `index.html`, `capabilities.html`, `pricing-contact.html`, `css/shared-nav.css`. Hard hue break vs teal vision/roai. |
| Replace Tailwind Play CDN with compiled stylesheet | perf | high | M | Build static purged CSS; drop the CDN script + inline config from all 3 pages. _(Top 10 #4)_ |
| Return a real 404 — bogus URLs serve homepage at HTTP 200 | seo | high | S | Add `404.html`. _(Top 10 #5)_ |
| Reconcile Salesforce bench numbers (340/760 vs 330/770) | content | med | S | Pick one canonical pair from `canonical-facts.json`; use identical figures + label on both pages. |
| Use a 1200×630 share card for og:image/twitter:image (not the 1200×1200, 1.16MB logo) | seo | med | S | Generate a 1200×630 branded card (<200KB); add `og:image:width`/`height`. **Merged: 2 raw findings.** |
| Add apple-touch-icon + PNG favicon fallback | tech-debt | low | S | Add 180×180 apple-touch-icon, 32×32 PNG fallback to all 3 pages' `<head>`. |
| Add navy `theme-color` meta | brand | low | S | Add `<meta name="theme-color" content="#0A1F3D">` to all 3 pages. |
| GA4 bootstrapped twice (inline head + `analytics.js`) | perf | low | S | Keep GA4 inline only; strip the GA4 boot block from `analytics.js` (keep its CTA/UTM logic). |
| Remove dead `css/shared-nav.css` (referenced by zero pages) | tech-debt | low | S | Delete the file (+ empty `css/` dir) — _sequence after the teal retheme, which touches this file._ |

### roai (`roai.emergedigital.ae` — Vela OS demo; Vela OS is the intended primary brand)

| Title | Category | Sev | Effort | Fix |
|-------|----------|-----|--------|-----|
| Replace SPA `not_found_handling` with a real 404 | seo | high | M | `not_found_handling = "404-page"` + `public/404.html`; only `/` and `/guide` should be 200. _(Top 10 #6)_ |
| Eliminate 3.1MB Babel-standalone + in-browser JSX compile on every load | perf | high | L | Add an esbuild/Vite prebuild emitting a content-hashed bundle; drop the Babel CDN + `text/babel` files. (The orphan `vela-JOEMOQJS.js` suggests a bundle already exists.) |
| Drop Tailwind Play CDN in production | perf | med | M | Generate static Tailwind CSS at build; link as a stylesheet. |
| Add a favicon + `rel=icon` (currently serves index.html as the icon) | ux-cro | med | S | Add `public/favicon.svg` + `<link rel="icon">` in `index.html` and `guide.html`. |
| Update `document.title` per SPA view (all deep links share one title) | seo | med | S | `useEffect` in `app.jsx` setting title from active view/section. |
| Add a `<noscript>` fallback for JS-disabled clients / non-JS crawlers | seo | med | S | `<noscript>` block with a one-liner + link to `/guide` (static HTML). |
| Restrict the public Metronome proxy to same-origin callers | bug | low | S | In `src/index.js`, reject `/api/metronome` requests whose Origin/Referer ≠ `roai.emergedigital.ae` (403). _(Sandbox data, but open uncached proxy.)_ |
| Add `og:image:width`/`height` for instant social-card rendering | seo | low | S | Add 1200/630 to `index.html` + `guide.html`. |
| Add `theme-color` meta + minimal web manifest | ux-cro | low | S | `<meta name="theme-color" content="#08080b">` on both pages; optional `site.webmanifest`. |
| Remove or wire up the orphan bundle `public/assets/vela-JOEMOQJS.js` | tech-debt | low | S | Delete the dead file, or finish the build migration so `index.html` loads it. |

### cross-cutting brand

| Title | Category | Sev | Effort | Fix |
|-------|----------|-----|--------|-----|
| Confirm the teal `Digital` wordmark treatment is the intended rebrand | brand | low | S | Brand-owner sign-off: keep `Digital` teal `#00C2C7` or move to white/navy. If changed, update vision `Navbar`/`Footer`/`styleguide` **and** future `logo.png` together. _(Decision item.)_ |

---

## Already planned (not new work)

- **emergedigital.com migration epic** — tracked separately: `docs/migration-runbook.md` + `docs/migration/redirect-map.csv` + **draft PR #25** (DO NOT MERGE until cutover). Auditors did not re-audit the legacy WP site; do not re-propose migration tasks here.
- **Brand rollout (shipped + live)** — Lexend + Prompt + Lexend Zetta + the recoloured icon are the agreed direction, merged and live on all 3 sites. The vision items above are **deployment/cleanup of an already-merged rebrand**, not a re-litigation of the brand.

---

## How to action

This is a **draft backlog, not filed work.** Review, edit fixes, and cut anything you disagree with — especially the content/trust items (#2 legal pages, #3 named case studies) and the open decisions flagged inline (`acc.html` keep-vs-delete, the teal-`Digital` sign-off). Once you greenlight a subset, those rows become `ao`-labelled GitHub issues; then `ao batch-spawn <issue#s>` executes the chosen set as PRs (one branch/PR per issue, severity-ordered).

**Suggested first batch** (all S effort, no judgement calls, immediate live impact): Top 10 **#5, #6, #9, #10** + vision two-`<h1>` fix. (#1/#7 already done.)
