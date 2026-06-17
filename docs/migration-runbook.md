# emergedigital.com migration runbook

**Goal:** move this Astro site onto **`emergedigital.com`** (replacing the legacy WordPress), preserving SEO. It's a **same-domain platform swap** (WordPress → Cloudflare Worker) — **no cross-TLD move, no GSC Change-of-Address**; only the origin and the per-URL structure change.

> ⚠️ This branch (`chore/migration-prep`) is **DO NOT MERGE until cutover.** `astro.config.mjs` now points `site` at `emergedigital.com`; deploying that to the live `vision.emergedigital.ae` would emit cross-domain canonicals. Merge only as part of the cutover.

## Locked decisions
- **Keep `emergedigital.com` canonical** (it holds the domain authority + backlinks; `.ae` apex already 301s → `.com`). `vision.emergedigital.ae` becomes a 301 alias post-cutover.
- **301 all, port nothing.** GSC (12-mo): ~476 organic clicks total, 55% from one off-brand post, SMB service pages ~0 clicks. No traffic worth porting; equity is preserved by the domain + clean redirects. Every legacy URL 301s to its closest new page (or 410 for utility/commerce). **No content is ported.**

## What's already built on this branch
- **`src/lib/redirects.ts`** — 157 exact `301` legacy→new path mappings + `410` prefix/pattern rules. Auto-generated from `docs/migration/redirect-map.csv` (WP sitemaps + GSC Pages).
- **`worker.ts`** — runs the redirect layer ahead of `/api/contact` + assets: `www`→apex canonical, `410 Gone` for WooCommerce/wp-admin/feeds/oauth/assets, `301` for the legacy map (matches both trailing-slash forms). Bundles clean (`wrangler deploy --dry-run`).
- **`astro.config.mjs`** `site` → `https://emergedigital.com`; **`public/robots.txt`** sitemap → `.com`; **`wrangler.jsonc`** routes add `emergedigital.com` + `www.emergedigital.com` (kept `vision.emergedigital.ae`).
- **`docs/migration/redirect-map.csv`** — the human-readable map (202 rows: 157×301, 45×410). Also loadable into a Cloudflare **Bulk Redirect List** if you prefer dashboard management over the Worker.

## Redirect rules (reference)
| Legacy | → | Status |
|---|---|---|
| `/`, `/services/`, `/case-studies/` | served directly (same path) | — |
| `/about-company/` | `/about/` | 301 |
| `/blog/`, `/resources/`, all posts, category/tag/author archives | `/insights/` | 301 |
| all service pages (SEO/PPC/SEM/analytics/GMP/GA4/GTM/b2b/app-dev/3cx/…) | `/services/` | 301 |
| `/case-studies/<slug>/`, `/portfolio*`, `/case-study-category/*` | `/case-studies/` | 301 |
| WooCommerce (`/cart`,`/checkout`,`/my-account`,`/shop`,`/product*`), `/wp-admin*`, `/wp-login`, `xmlrpc`, `/feed`, oauth/payment, `/wp-content/*` | — | **410** |

Invariants enforced by the generator: no orphan 404 (every WP-sitemap + GSC URL is covered), no self-redirect loop (new-served paths excluded), targets are final 200s (no chains).

## Cutover sequence (operator)
Phases 0–3 are non-destructive; only step 4 touches production.
1. **Pre-cutover:** confirm `emergedigital.com` zone is in this Cloudflare account (`4a75e91d…`); **snapshot the full DNS zone, especially MX / SPF / DKIM / DMARC** (do NOT touch mail records); lower the web A/AAAA/CNAME TTL to 300s; set Worker env vars (`RESEND_API_KEY`, `TO_EMAIL`, `FROM_EMAIL`); export a GSC baseline; pick a low-traffic window.
2. **Staging gate** (on the `*.workers.dev` URL or a `staging.` host): `npm run build` clean; sitemap = `.com` URLs, zero `.ae`; canonicals self-ref `.com`; curl-sweep every legacy URL → single-hop `301`→200 or `410`; `/api/contact` works; Lighthouse ≥95.
3. **Merge this PR** + deploy the Worker with the `.com` routes.
4. **DNS cutover:** repoint the **web** A/AAAA/CNAME for apex + `www` from the GCP WP origin (`34.67.1.227`) to the Cloudflare Worker. **Leave MX / mail-auth records untouched.**
5. **Verify live:** re-run the curl-sweep against `https://emergedigital.com/...` (zero orphan-404/chain/loop); canonical + sitemap on `.com`; `/api/contact` email lands; submit the new sitemap in GSC; point `vision.emergedigital.ae` → 301 → `.com`.

## Rollback
- **DNS:** repoint apex + www A/AAAA back to `34.67.1.227` (TTL 300s) → WP restored in minutes. Keep the GCP VM powered-on (de-routed) for a 30-day window.
- **Code:** `wrangler rollback`, or disable the routes.
- MX/mail are never touched, so email is unaffected either way.

## Post-cutover (30-day loop)
GSC Pages (watch 404/soft-404/redirect-error spikes = orphans to fix same-day), "Page with redirect" trend, sitemap discovery, Worker 404/410 logs. Ranking-loss exposure is minimal (almost no organic traffic to lose). Decommission WP only after a clean 30-day window.

## Decisions to confirm
Which Cloudflare account holds `.com`; `www` vs apex canonical (the Worker defaults `www`→apex — change if WP canonicalised to `www`); `.ae` = permanent 301 alias vs noindex staging; which GA4 property the `.com` site uses; WP fallback-window length.
