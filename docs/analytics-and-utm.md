# Analytics & UTM — funnel measurement (Vision hub)

The Vision corporate site is the top of a three-property funnel:

```
vision  ──▶  roai (live platform demo)
        └─▶  future (Agentforce practice)
```

This doc covers how page-level analytics and outbound funnel tagging work, so
the three properties report consistently. (Issue #11 / S2c.)

## 1. Page analytics — Cloudflare Web Analytics

Analytics load on **every page** via `src/layouts/BaseLayout.astro`, which every
route uses. We use **Cloudflare Web Analytics** (the deploy target is
Cloudflare; the beacon is cookieless, needs no consent banner, and is light
enough to keep Lighthouse ≥ 95).

The beacon `<script>` lives in `<head>` and reads its token from
`CF_BEACON_TOKEN`, which is sourced from the `PUBLIC_CF_BEACON_TOKEN` env var:

```astro
const CF_BEACON_TOKEN = import.meta.env.PUBLIC_CF_BEACON_TOKEN ?? 'CF_BEACON_TOKEN_PLACEHOLDER';
```

### Setting the real token

1. Cloudflare dashboard → **Web Analytics** → add the Vision site → copy the
   beacon **token**. Use the **same account/property family** as roai + future
   (S2a/S2b) so the funnel reports together.
2. Set `PUBLIC_CF_BEACON_TOKEN` in Cloudflare Pages → **Settings → Environment
   variables** (and in a local `.env` if you want it firing in dev). See
   `.env.example`.
3. Until it is set, the markup ships with the literal
   `CF_BEACON_TOKEN_PLACEHOLDER` so reviewers can see the integration in the PR.

> Swapping to GA4 instead? Replace the beacon `<script>` block in
> `BaseLayout.astro` with the `gtag.js` snippet and read the measurement ID from
> a `PUBLIC_GA4_ID` env var the same way. Pick whichever roai/future settled on.

## 2. Outbound funnel links — UTM tagging

Every outbound link from Vision to **roai** or **future** must carry `utm_*`
parameters so the destination can attribute the visit. Build hrefs with the
helper in `src/lib/outbound.ts` — never hardcode a bare sibling URL.

```astro
---
import { funnelUrl } from '../lib/outbound';
---
<a href={funnelUrl('roai', { content: 'hero-cta' })}>See the platform live</a>
<a href={funnelUrl('future', { content: 'agentforce-card' })}>Explore the Agentforce practice</a>
```

`funnelUrl('roai', { content: 'hero-cta' })` produces:

```
https://roai.emergedigital.ae/?utm_source=vision&utm_medium=referral&utm_campaign=vision-hub&utm_content=hero-cta
```

### Defaults

| Param          | Default        | Override          |
| -------------- | -------------- | ----------------- |
| `utm_source`   | `vision`       | `source`          |
| `utm_medium`   | `referral`     | `medium`          |
| `utm_campaign` | `vision-hub`   | `campaign`        |
| `utm_content`  | _(unset)_      | `content`         |
| `utm_term`     | _(unset)_      | `term`            |

Use `utm_content` to distinguish multiple links that point at the same
destination (e.g. `hero-cta` vs `footer-link`).

### Destination URLs

`FUNNEL_DESTINATIONS` in `outbound.ts` holds the roai/future origins. They are
**placeholders** today; override with `PUBLIC_ROAI_URL` / `PUBLIC_FUTURE_URL`
once the production URLs are confirmed.

## Where the links get added

The actual link/card markup lands in:

- **#9 (V1)** — "See the platform live" → roai demo
- **#10 (V2)** — "Agentforce practice" card → future

Both should use `funnelUrl()` so their links are UTM-tagged by construction.
