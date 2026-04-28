# Prompt 00 — Setup (run this once, before opening Claude Code)

This is the only step you do **outside** Claude Code. It gets your machine ready so the rest of the prompts can run cleanly.

## On your Mac

1. **Install Node.js 20+** if you don't have it.
   ```bash
   # Easiest path with Homebrew:
   brew install node
   # Verify:
   node -v   # should be v20.x or higher
   npm -v
   ```

2. **Install Claude Code** if you don't have it. Follow the official install guide: https://docs.claude.com/en/docs/claude-code

3. **Open a terminal in the `website/` folder** of this project.
   ```bash
   cd "/Users/admin/Documents/Claude/Projects/Emerge Digital Refresh/website"
   ```

4. **Install dependencies and confirm the scaffold runs.**
   ```bash
   npm install
   npm run dev
   ```
   You should see Astro start at `http://localhost:4321`. Open it. You'll see a placeholder hero with the brand colors and typography. If that loads, the scaffold is healthy and you're ready for Prompt 01.

5. **Initialize git** (recommended — gives you a safety net to roll back any Claude Code change):
   ```bash
   git init
   git add .
   git commit -m "Initial scaffold"
   ```

6. **Open Claude Code** in this same folder:
   ```bash
   claude
   ```
   Claude Code will automatically read `CLAUDE.md` from the project root. You're now ready to paste Prompt 01.

## What you should see at this point

- The dev server running at `http://localhost:4321`
- A dark navy hero with the headline "Local Prime. Global Power. Enterprise Outcomes."
- A teal CTA button reading "Book a Vision 2030 Readiness Briefing →"
- A header with placeholder nav links and a footer with company structure

If anything is broken, paste the error into Claude Code and ask it to fix the scaffold before proceeding.
