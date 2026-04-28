# Emerge Digital — Build Brief

Read this file at the start of every session. Then read `docs/brand-and-content.md` for the full brand strategy, sitemap, and ready-to-paste copy. If anything in `brand-and-content.md` conflicts with this file, this file wins.

## What this project is

The corporate marketing site for **Emerge Digital** — the Dubai Mainland local prime for enterprise CX, Data, AI, and digital transformation programs across the MEA region (UAE, KSA, Egypt). The audience is CXOs, procurement leaders, and decision-makers in Government, BFSI, and Retail. The site exists to convert enterprise readers into briefing calls during the Vision 2030 procurement window (2026–2027).

## Stack (do not change without asking)

- Astro 5 with TypeScript (strict)
- Tailwind CSS via `@astrojs/tailwind` (base styles disabled — see `src/styles/global.css`)
- MDX for case studies and insights via Astro content collections
- `@fontsource-variable/inter` and `@fontsource-variable/jetbrains-mono` for fonts
- Deploy target: Cloudflare Pages
- No React, Vue, Svelte, MUI, shadcn, or other component libraries. Astro components only.

## Design system

Brand tokens live in `tailwind.config.mjs` and `src/styles/global.css`. Use them. Do not hardcode hex values, font families, or arbitrary spacing in components.

**Colors** (Tailwind class names):
- `bg-navy` (#0A1F3D) — primary dark surface
- `bg-ink` (#06122A) — deepest dark, hero gradient base
- `bg-teal` / `text-teal` (#00C2C7) — primary accent and CTA
- `bg-cyan` / `text-cyan` (#3DDCE3) — hover, secondary highlight
- `bg-platinum` (#E8EEF5) — light surface tint
- `bg-offwhite` (#F7F9FC) — section backgrounds for variety
- `text-slate` (#1F2A3C) — body on light
- `text-cool` (#6B7A90) — muted/captions

**Gradients** (already in `tailwind.config.mjs`):
- `bg-gradient-hero` — navy → ink → teal-tint hero panel
- `bg-gradient-accent` — teal → cyan, used on primary CTAs
- `bg-gradient-data` — navy → teal, used in data-viz

**Type scale** (use these utility classes):
- `text-display-xl` — 72px hero H1
- `text-display-lg` — 48px H2
- `text-display-md` — 32px H3
- `text-lead` — 20px lead paragraph
- `text-eyebrow` — 13px uppercase eyebrow with 0.15em tracking

**Spacing**: 8px base grid. Use `py-section` for desktop section padding (128px) and `py-section-sm` for mobile (64px). Section content max-width is `max-w-section` (1280px).

**Components must be primitives.** Do not duplicate buttons, eyebrows, cards, or section wrappers. Extend the shared primitives in `src/components/`.

## Voice and copy rules

Pull copy from `docs/brand-and-content.md`. When writing or editing copy, respect Appendix A of that document.

**Use:** local prime, accountability, enterprise outcomes, in-country, mainland, founder-led, governance cadence, procurement-ready, regulatory-aligned, named KPIs, phase gates, customer-centric, Vision 2030, GCC, MEA, PDPL, ESR.

**Avoid:** synergy, world-class, cutting-edge, disruptive, ninja/rockstar/guru, leverage (as a verb), unique, revolutionary, bleeding-edge, "we believe" filler.

**Tone:** confident, not arrogant. Specific, not vague. Calm, not breathless. Reference concrete numbers (23 years, 7 offices, 80,000+ engineers, 4 GMP partners worldwide) wherever they fit.

## File structure conventions

```
src/
  components/     # All reusable .astro components, flat or grouped by feature
  layouts/        # BaseLayout.astro and any specialty layouts
  pages/          # File-based routes — public URL = file path
  content/
    case-studies/ # MDX files, schema in config.ts
    insights/     # MDX files, schema in config.ts
    config.ts     # Content collection schemas
  styles/
    global.css    # Tokens, base styles, font imports
  lib/            # Pure TypeScript utilities (no Astro)
  assets/         # Local images and SVGs imported by components
public/           # Files served as-is (favicons, robots.txt, og-image.png)
docs/             # Project docs — never deployed
```

## Conventions Claude Code should keep

1. **Always update `/styleguide`** when you add or change a primitive component, so I can review it in isolation.
2. **Run `npm run build`** before declaring work done. Zero errors required.
3. **Add Frontmatter to every page** — `title`, `description`, `ogImage` if relevant. The BaseLayout uses these for `<head>`.
4. **Image-heavy components** should accept an `image` prop and never inline raster images. Use `astro:assets` `<Image>` for local imports.
5. **No `localStorage`, no `sessionStorage`.** This site is mostly static; client state should be minimal.
6. **Accessibility**: every interactive element must be keyboard-reachable, have a visible focus state, and pass axe checks. Headings stay in order (no skipped levels).
7. **Performance**: keep client JS minimal. Use Astro islands only when truly needed (form, animation). Lighthouse target: ≥ 95 on every page.

## What NOT to do

- Don't introduce a state library, an animation library, or a UI kit
- Don't hardcode strings that should live in `docs/brand-and-content.md` or in a content collection
- Don't refactor the design tokens without updating both `tailwind.config.mjs` and `src/styles/global.css`
- Don't commit secrets — use Cloudflare Pages environment variables for any keys
- Don't add tracking pixels without explicit instruction

## How to ask for help

If a prompt is ambiguous or missing context, stop and ask before guessing. Surface the question. Don't generate placeholder copy when the real copy exists in the strategy doc.
