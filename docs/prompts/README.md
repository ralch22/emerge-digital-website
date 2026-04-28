# Prompt sequence

Five prompts. Run them in order. Each is a self-contained brief you paste into Claude Code.

| # | Prompt | What it does | Time estimate |
|---|---|---|---|
| 00 | [00-setup.md](./00-setup.md) | One-time Mac setup: install Node, install Claude Code, run the scaffold | 15 min |
| 01 | [01-design-system.md](./01-design-system.md) | Build primitive components and a /styleguide route | 30–60 min |
| 02 | [02-homepage.md](./02-homepage.md) | Build the full homepage from the strategy doc | 60–90 min |
| 03 | [03-content-pages.md](./03-content-pages.md) | Build all inner pages, content collections, seed case studies + insights | 2–4 hrs |
| 04 | [04-seo-and-deploy.md](./04-seo-and-deploy.md) | SEO migration plan, performance hardening, Cloudflare Pages deploy | 1–2 hrs |

## Tips for working with Claude Code

- **Commit after every prompt.** `git add . && git commit -m "..."` — gives you a clean rollback if a later prompt breaks something.
- **Read the diff.** Before committing, scroll through what Claude Code changed. Reject anything that drifts from the brand/voice rules.
- **One prompt at a time.** Don't paste two prompts back-to-back. Let each one finish, review, fix, then move on.
- **Be specific when correcting.** "The hero feels too flat" is weak. "Increase the hero vertical padding to py-32 on desktop and add a subtle 8% teal radial gradient in the top-right" is strong.
- **Pin the strategy doc.** Inside Claude Code, you can ask it to keep `docs/brand-and-content.md` open in context — that's how it stays grounded.

## When you get stuck

If Claude Code goes off the rails on a prompt, undo with `git reset --hard HEAD` and re-paste the prompt with one extra line at the top: *"Last attempt drifted because [X]. This time, [specific corrective constraint]."*
