# Emerge Digital — Website

The corporate marketing site for Emerge Digital. Built with Astro + Tailwind + MDX, deployed to Cloudflare Pages.

## What's already wired up

- **Astro 5** with TypeScript (strict)
- **Tailwind CSS** with the full Emerge Digital brand token system (`tailwind.config.mjs`)
- **Inter Variable** + **JetBrains Mono Variable** via `@fontsource-variable`
- **MDX** support for case studies and insights
- **Sitemap** auto-generation
- A starter `BaseLayout`, `global.css`, and `src/content/config.ts` schema

## What you build with Claude Code

Components, pages, content, and the deploy pipeline. Five sequenced prompts live in `docs/prompts/`. Open Claude Code in this folder and paste them one at a time.

## Setup (one-time, on your Mac)

1. **Install Node.js 20+** if you don't have it. Easiest path: `brew install node`.
2. **Install Claude Code** if you don't have it. See the install guide at https://docs.claude.com/en/docs/claude-code.
3. Open a terminal in this `website/` folder.
4. Run `npm install`.
5. Run `npm run dev`. The site will be at `http://localhost:4321`.

## Day-to-day

Run `npm run dev` in one terminal to keep a live preview going. Open Claude Code (`claude` in the terminal, or via the Mac app) in this same folder. Claude Code will automatically read `CLAUDE.md` and use the brand strategy in `docs/brand-and-content.md` as the source of truth for copy and structure.

When you want to add a section, page, or component, paste the relevant prompt from `docs/prompts/` into Claude Code. Each prompt is self-contained and references the strategy doc for any copy you need.

## Project structure

```
website/
├── CLAUDE.md                  # Brief Claude Code reads on every session
├── README.md                  # You are here
├── package.json
├── astro.config.mjs
├── tailwind.config.mjs
├── tsconfig.json
├── docs/
│   ├── brand-and-content.md   # Full brand strategy + ready-to-paste copy
│   └── prompts/               # Five sequenced prompts for Claude Code
└── src/
    ├── components/            # Reusable .astro primitives (built in Prompt 01)
    ├── content/               # MDX collections for case studies & insights
    │   └── config.ts          # Schema
    ├── layouts/
    │   └── BaseLayout.astro   # Master layout
    ├── pages/                 # Routes — file-based
    │   └── index.astro        # Placeholder homepage
    └── styles/
        └── global.css         # Brand tokens + base styles
```

## Deploy (when you're ready)

Recommended: Cloudflare Pages. Connect this repo, set build command to `npm run build`, output directory to `dist`. Free, fast, global edge.

Alternative: Netlify or Vercel. Same `npm run build` / `dist` setup.

## Useful commands

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server with hot reload |
| `npm run build` | Build the production site to `dist/` |
| `npm run preview` | Preview the built site locally |
| `npm run check` | Type-check Astro + TypeScript |
