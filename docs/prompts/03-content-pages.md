# Prompt 03 — Build the inner pages and content collections

Paste the prompt below into Claude Code. Prompts 01 and 02 must be complete.

---

```
Read docs/brand-and-content.md section 4 fully before writing code. That section contains the structure and copy for every inner page.

Goal of this session: build out every page in the sitemap, wire up the case studies and insights content collections, and produce 3 seed case studies + 2 seed insights.

Pages to build (use BaseLayout, the design primitives from Prompt 01, and the section primitives from Prompt 02 where they apply):

1. /about/                      — Section 4.1 (Founder's Letter, JV-in-One-Page diagram, Operating Principles, Compliance)
2. /services/                   — Section 4.2 (pillar page with 4 capability tracks)
3. /services/customer-experience/
4. /services/data-and-analytics/
5. /services/ai-and-generative-solutions/
6. /services/digital-transformation/
   For each service sub-page: hero, "Who this is for", "What we deliver", "Our approach" (Crawl-Walk-Run mapped), "Tools & platforms", 1–2 mini-case-study tiles linking to the case study collection, CTA. Use the structure described at the bottom of section 4.2.
7. /industries/                 — Pillar with 3 cards (Government, BFSI, Retail)
8. /industries/government/      — Section 4.3, Government block
9. /industries/bfsi/            — Section 4.3, BFSI block
10. /industries/retail/         — Section 4.3, Retail block
11. /partnerships/              — Section 4.4
12. /success-stories/           — Section 4.5: filterable grid driven by the case-studies content collection. Filters: Industry, Capability, Region, Year. Filtering can be client-side via a small Astro island — keep JS minimal.
13. /success-stories/[slug]     — Dynamic route, renders an individual case study from the content collection using the template shown in Section 4.5.
14. /insights/                  — Section 4.6: filterable list with category and tag filters.
15. /insights/[slug]            — Individual article with reading time, category, share links, related articles.
16. /contact/                   — Section 4.7: two-column layout (form on left, direct contact on right). The form for now should POST to a Formspree placeholder endpoint (read FORMSPREE_ENDPOINT from import.meta.env.PUBLIC_FORMSPREE_ENDPOINT) and gracefully no-op if not set.
17. /legal/privacy/             — Stub with placeholder copy + a TODO callout
18. /legal/cookies/             — Stub with placeholder copy + a TODO callout
19. /legal/terms/               — Stub with placeholder copy + a TODO callout

Content collections — create 3 seed case studies in src/content/case-studies/ and 2 seed insights in src/content/insights/:

Case studies (use the outcome lines from Section 3.7 of the strategy doc as the seed):
- tier-1-gcc-bank-cdp.mdx       — BFSI, UAE+KSA, CDP rollout, +38% cross-sell
- ksa-government-citizen-experience.mdx — Government, KSA, +22 CSAT
- uae-retail-commerce-replatform.mdx — Retail, UAE, +47% YoY revenue, 3.2x attribution accuracy

Insights:
- vision-2030-procurement-window-cxo-field-guide.mdx — Vision 2030 Brief, ungated, ~1500 words. Use the cornerstone outline from Section 4.6 and write the full article.
- mea-cx-maturity-benchmark-2026.mdx — Report, gated=true. Write a strong 600-word landing summary; the gate triggers a form to download the (placeholder) PDF.

Each case study and insight must conform to the schemas in src/content/config.ts. If you need to extend the schema, do it carefully and tell me what you changed.

Wiring requirements:
- Each service page lists the relevant case studies dynamically by querying the content collection where capabilities[] overlaps with the page's capability set.
- The homepage ProofTiles component should be refactored to read from the content collection instead of hardcoded data.
- Add a sticky internal-page CTA bar (small, top-right, fades in after the hero) that links to /contact/. Use a small Astro island for the scroll listener.
- Add JSON-LD schema to each page type:
  - Organization schema in BaseLayout
  - Service schema on service pages
  - Article schema on insights
  - BreadcrumbList on all sub-pages
  - FAQPage schema on any page that has FAQ content (none required at launch, but the helper should exist)
- Run an automated link check at the end and report any broken links.

Constraints unchanged from earlier prompts: Astro only, brand tokens only, Lighthouse ≥ 95.

When you finish:
1. npm run build (fix errors)
2. npm run dev
3. Walk me through each new page in order
4. Update /styleguide to link to every new page so I can navigate the site for review
5. Tell me any places where the strategy doc was ambiguous and you made a judgment call
```

---

## What to do after Claude Code finishes

1. Click through every page. Read every line.
2. Run Lighthouse on at least the homepage, /services/customer-experience/, /success-stories/, and one case study detail page.
3. Test the contact form posts (set up a free Formspree account at https://formspree.io and add the endpoint to a `.env` file as `PUBLIC_FORMSPREE_ENDPOINT=...`).
4. Commit:
   ```bash
   git add .
   git commit -m "Build inner pages, content collections, and seed content"
   ```
5. Move on to Prompt 04.
