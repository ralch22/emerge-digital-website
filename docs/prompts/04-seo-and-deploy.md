# Prompt 04 — SEO migration, performance hardening, and deploy

Paste the prompt below into Claude Code. Prompts 01–03 must be complete.

---

```
Read docs/brand-and-content.md section 5 (Technical & Implementation Recommendations) fully before writing code. Pay close attention to the SEO migration plan.

Goal of this session: take the site from "feature complete on localhost" to "ready to deploy to Cloudflare Pages with a clean SEO migration from emergedigital.com."

Tasks:

1. Crawl + redirect map
   - Ask me to provide a Screaming Frog export of the live emergedigital.com site if I haven't already. If I haven't, generate a placeholder src/lib/redirects.ts with a TypeScript map (oldPath: newPath) and a documented schema for me to fill in.
   - Add a Cloudflare Pages _redirects file at public/_redirects that emits 301 redirects from the map. Ensure trailing-slash consistency (Astro's default is trailing-slash, so all redirects target the trailing-slash version).
   - Build a /404.astro page on-brand (do not use a generic 404).

2. Schema and metadata hardening
   - Confirm Organization schema is in BaseLayout — including legalName, foundingDate, address, sameAs (LinkedIn), contactPoint.
   - Confirm Service / Article / BreadcrumbList schemas land on the right pages (already added in Prompt 03 — verify).
   - Add hreflang tags for en-AE, en-SA, en-EG (English variants for now; Arabic is phase 2 — leave hreflang stubs for ar-* commented out).
   - Ensure every page has unique <title> and <meta name="description">. Surface any missing in a console summary I can review.
   - Add canonical URLs for every page (already in BaseLayout — confirm).

3. Performance and accessibility
   - Run npm run build, then load each top-level page through Lighthouse via the CLI (lighthouse --chrome-flags="--headless"). Report Performance, Accessibility, Best Practices, SEO scores in a markdown table for: /, /about/, /services/, /services/customer-experience/, /industries/bfsi/, /partnerships/, /success-stories/, one case study, /insights/, one insight, /contact/.
   - Fix anything below 95 Performance or 95 Accessibility.
   - Confirm Cumulative Layout Shift < 0.05 on every page. Reserve aspect ratios on every image.
   - Confirm there are no render-blocking third-party scripts. The contact form must work without any third-party JS in <head>.

4. Analytics and consent
   - Add a privacy-respecting analytics stub: Plausible by default. Use a small Astro component PlausibleScript.astro that reads PUBLIC_PLAUSIBLE_DOMAIN from env. If unset, render nothing.
   - Add a PDPL/GDPR-aware cookie banner. It should:
     - Be visible on first visit only (sessionStorage is fine; use it ONLY for the banner state)
     - Block analytics until consent is given
     - Have an Accept and a Decline button
     - Include a permanent footer link "Cookie preferences" that re-opens the banner
   - Document the analytics + consent setup in docs/analytics-and-consent.md.

5. Forms
   - Move the Contact form from Formspree to either:
     a) Cloudflare Pages Functions (preferred — write a /functions/contact.ts handler that POSTs to a webhook configured via env), OR
     b) Stay on Formspree if Pages Functions adds too much complexity.
   - Add server-side honeypot + rate limiting (if using Pages Functions).
   - Add a "Subscribe to Vision 2030 Briefings" form to the footer (Buttondown, ConvertKit, or simple Pages Function — document choice in docs/analytics-and-consent.md).

6. Deploy preview
   - Initialize a Cloudflare Pages config (wrangler.toml if relevant; otherwise document the dashboard setup in docs/deploy.md).
   - Confirm npm run build produces /dist with the correct output for Cloudflare Pages.
   - Generate docs/deploy.md with step-by-step Cloudflare Pages setup instructions including build settings, custom domain configuration, and environment variable setup.

7. Pre-launch checklist
   - Generate docs/launch-checklist.md by adapting Appendix B from docs/brand-and-content.md, with concrete verification commands for each item.

When you finish:
1. npm run build (clean)
2. Lighthouse table in chat
3. List any TODOs that I need to do before launch (e.g. fill the redirect map, set the Plausible domain, set the form webhook).
4. Commit and push (do not deploy without my explicit go-ahead).

Constraints unchanged. Do not introduce client-side React, do not bloat the bundle.
```

---

## What to do after Claude Code finishes

1. Open `docs/deploy.md` and follow the Cloudflare Pages setup. Connect your GitHub repo, set build command `npm run build`, output `dist`.
2. Buy/configure the production domain. Point DNS to Cloudflare Pages.
3. Fill in the redirect map from your real Screaming Frog crawl of `emergedigital.com`.
4. Submit the new sitemap in Google Search Console **after** DNS cutover.
5. Watch GSC daily for 30 days post-launch.
6. Final commit:
   ```bash
   git add .
   git commit -m "SEO migration + Cloudflare Pages deploy ready"
   ```

You're shipped. Iterate from here.
