# Prompt 02 — Build the homepage

Paste the prompt below into Claude Code. It assumes Prompt 01 is complete and the styleguide is rendering correctly.

---

```
Read docs/brand-and-content.md section 3 fully before writing code. That section contains the exact copy for every homepage section — use it verbatim. Do NOT invent or paraphrase headlines.

Goal: replace src/pages/index.astro with the full homepage, broken into 9 reusable section components.

Create these section components in src/components/sections/:

1. HeroHome.astro            — Section 3.1
2. VisionWindow.astro        — Section 3.2 (with the 4-stat row)
3. JointVenture.astro        — Section 3.3 (3-column JV explainer)
4. ServicesOverview.astro    — Section 3.4 (4-pillar grid, link out to /services/*)
5. WhyLocalPrime.astro       — Section 3.5 (5 numbered reasons)
6. Partnerships.astro        — Section 3.6 (2 large cards: e-CENS, FPT)
7. ProofTiles.astro          — Section 3.7 (3 case study tiles, hardcoded for now — content collection wiring comes in Prompt 03)
8. CrawlWalkRun.astro        — Section 3.8 (3-step visual roadmap)
9. CtaFinal.astro            — Section 3.9 (full-width CTA panel)

Each section:
- Wraps with the Section primitive (correct tone) and Container primitive
- Uses Eyebrow for the small uppercase label at the top of the section
- Uses Button for any CTA — never inline
- Uses Stat for the 4-up stat row in VisionWindow
- Uses TrustStrip in HeroHome under the headline
- Uses Card for any card-like UI
- Alternates background tones (dark / gradient / light / dark) for visual rhythm

Then update src/pages/index.astro to import BaseLayout and render those 9 section components in order. Pass appropriate <title> and <description> to BaseLayout — pull from docs/brand-and-content.md.

Polish requirements:
- HeroHome should feel cinematic. Add a subtle animated radial-gradient or particle-style overlay using pure CSS (no external libraries). Respect prefers-reduced-motion.
- The CrawlWalkRun roadmap should be a real visual — three connected nodes with the navy-to-teal gradient connecting them. Use inline SVG and the brand CSS vars from global.css.
- The JointVenture three-column layout should be Card-based on dark surface, with a subtle teal accent border on the middle (Emerge Digital) card to visually anchor the local-prime model.
- Mobile: stack everything single-column at <768px. Section padding shrinks to py-section-sm.
- All inline links and CTAs must use the Button primitive variants.
- Lighthouse Performance and Accessibility must both be ≥ 95 on the homepage.

When you finish:
1. Run npm run build and fix any errors.
2. Run npm run dev and walk me through the page section by section.
3. Add a "Homepage" entry to /styleguide that links out to / so I can review primitives and the homepage side by side.
4. List anything in the strategy doc you weren't sure how to render visually so I can clarify.

Do not delete /styleguide. Do not change CLAUDE.md. Do not add any client-side JavaScript libraries — all animation must be CSS-only.
```

---

## What to do after Claude Code finishes

1. Open `http://localhost:4321/` and review the homepage end-to-end.
2. Read every line of copy on the page. Compare against `docs/brand-and-content.md` section 3. Anything off — tell Claude Code to fix it.
3. Test on mobile (resize the browser or use Chrome devtools).
4. Run a Lighthouse audit (Chrome devtools → Lighthouse). Confirm Performance ≥ 95.
5. Commit:
   ```bash
   git add .
   git commit -m "Build homepage sections and integrate"
   ```
6. Move on to Prompt 03.
