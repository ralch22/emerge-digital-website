# Prompt 01 — Build the design system primitives

Paste the prompt below into Claude Code in one block. It assumes the scaffold from Prompt 00 is running.

---

```
Read CLAUDE.md and docs/brand-and-content.md fully before writing any code. Anchor yourself in sections 1.4 (color palette), 1.5 (typography), and 1.6 (visual style) of the strategy doc.

Goal of this session: build the primitive component layer and a /styleguide route that renders every primitive in every variant. Do NOT touch the homepage yet — that's Prompt 02.

Build these components in src/components/, all as .astro files:

1. Button.astro
   - Props: variant ('primary' | 'secondary' | 'ghost'), href (string), size ('md' | 'lg'), arrow (boolean, default true), as ('a' | 'button')
   - Primary: bg-gradient-accent, text-ink, font-semibold, rounded-pill, hover:shadow-glow
   - Secondary: border border-white/20, text-white, transparent bg, hover:border-teal hover:text-teal
   - Ghost: text-white/80, no border, hover:text-teal — use for inline link CTAs
   - Arrow renders as " →" suffix when arrow=true
   - Must be keyboard-accessible with visible focus ring (rely on global :focus-visible)

2. Eyebrow.astro
   - A small uppercase label with 0.15em tracking
   - Props: tone ('teal' | 'cool' | 'white'), default 'teal'
   - Renders <p class="text-eyebrow uppercase ...">

3. Section.astro
   - Props: tone ('dark' | 'light' | 'gradient'), default 'dark'
   - Wraps <section> with appropriate background (bg-ink for dark, bg-offwhite text-slate for light, surface-hero for gradient)
   - Adds py-section-sm md:py-section vertical padding
   - Has a slot for content

4. Container.astro
   - mx-auto max-w-section px-6
   - Wraps content inside Section.astro

5. Stat.astro
   - Props: value (string), label (string), accent (boolean, default true)
   - Renders the value in text-display-xl with the teal color when accent=true, label below in text-eyebrow text-cool
   - Used for the homepage stat row (23 yrs, 7 offices, 4 GMP partners, 80,000+ engineers)

6. TrustStrip.astro
   - Props: prefix (string, optional — e.g. "A Strategic Joint Venture With"), items (array of strings)
   - Renders the prefix as a small uppercase eyebrow, then a horizontal flex row of items separated by middle dots in text-cool
   - Will later accept SVG logo slots, but text-only is fine for now

7. Card.astro
   - Props: tone ('dark' | 'light'), padded (boolean, default true)
   - rounded-card, soft border (border border-white/8 on dark, border border-platinum on light), default elevation
   - Slot for content
   - Optional accent — props could include eyebrow and title for header variants

After building those, create a /styleguide route at src/pages/styleguide.astro that:
- Uses BaseLayout
- Renders an H1 "Emerge Digital — Style Guide"
- Has labeled sections for Colors (swatches with hex), Typography (every text-* class), Buttons (every variant × size), Eyebrow (every tone), Stats, TrustStrip, Cards, and a Section-tone showcase
- Uses real brand copy where text is needed (pull from docs/brand-and-content.md, do not invent placeholder text)

When you finish:
1. Run npm run build and fix any errors.
2. Run npm run dev and report the URL.
3. List the components you created and any decisions you made that weren't fully specified.

Constraints:
- Astro components only. No React.
- Use the brand tokens — never hardcode hex values.
- Components must be reusable. If you find yourself duplicating styles in two places, extract a primitive.
```

---

## What to do after Claude Code finishes

1. Open `http://localhost:4321/styleguide` and visually review every primitive.
2. If anything looks off (spacing, color, weight), tell Claude Code specifically what to adjust and re-run.
3. Once the styleguide looks right, **commit**:
   ```bash
   git add .
   git commit -m "Build design system primitives + styleguide"
   ```
4. Move on to Prompt 02.
