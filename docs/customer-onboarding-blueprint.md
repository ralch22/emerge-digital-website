# Customer Onboarding Blueprint — Salesforce-Native, Post-Sale

**Prepared for:** Rami, Founder — Emerge Digital
**Author:** Delivery & Platform working group
**Status:** Research blueprint (discovery-gated). No Salesforce metadata is built yet — this document defines what we will build and why, so it can be reviewed and cut before a single object is created.
**Date:** 18 June 2026
**Scope marker:** Post-sale only — Opportunity `Closed-Won` → end of the **Crawl** diagnostic (4–8 weeks) → **Walk-ready**. Lead acquisition and Walk/Run delivery are out of scope.

> **How to read this.** Sections 1–8 are the argument and the architecture. Section 9 is the build reference (SFDX layout, Cal.com and Resend integration specs, sources). Section 10 is a complete, load-ready fictitious demo dataset for the Showcase MVP. The document closes with a **ranked implementation backlog** — the only part that becomes work once you greenlight it.

---

## 1. Executive Summary & Dogfooding Thesis

### 1.1 The problem this solves

Emerge Digital signs enterprise programs on a **Crawl–Walk–Run** model. The Crawl is a fixed-scope diagnostic that procurement can sign in days, and it is where the client forms its first opinion of whether we deliver on the local-prime promise: accountability, governance cadence, named KPIs, and phase gates. Today that first 4–8 weeks runs on email threads, shared drives, and a founder's memory. The handoff from sale to delivery is verbal, the document-and-access chase loop has no system of record, and the client has no single place to see what they owe us, what we owe them, or where the engagement stands against its gate.

That is a credibility gap for a firm whose entire pitch is *governance and accountability you can see*. It is also a scale ceiling: the model that works at three concurrent Crawls breaks at fifteen.

### 1.2 The recommendation

Build the post-sale onboarding journey **Salesforce-native**, on the free **Developer Edition with Agentforce and Data Cloud**, orchestrated with **Flow Orchestration**, surfaced to clients through an **Experience Cloud** portal, and assisted by **two Agentforce agents** — an internal **Delivery Copilot** and a client-facing **Onboarding Concierge**. Keep the tools that already work and have no Salesforce-native equivalent in Developer Edition: **Cal.com** for scheduling (integrated by webhook into a `Milestone__c` record) and **Resend** for transactional email (a Flow HTTP callout, reusing the brand-domain deliverability already configured in `worker.ts`).

The data model stays standard where Salesforce is standard — `Account`, `Contact`, `Opportunity` (with `Closed-Won` as the trigger), `Case` — and adds a thin **engagement layer** of custom objects that model how Emerge actually runs a program: `Engagement__c`, `Phase__c`, `PhaseGate__c`, `Milestone__c`, `Deliverable__c`, `ChecklistItem__c`, `Stakeholder__c`, `ROAIBaseline__c`, `HandoffRecord__c`.

### 1.3 The dogfooding thesis

Emerge is, by its own positioning, both a CX/Data/AI consultancy **and** a Salesforce/Agentforce practice. The most honest proof of that practice is to run our own most credibility-sensitive process on it.

When a prospect asks "can you actually stand up Agentforce and an Experience Cloud portal for us?", the answer should not be a slide. It should be: *"You are already inside one. The portal you used to upload your NDA, book your kickoff, and watch your diagnostic take shape — we built that on the same platform we are proposing for you, and we run our own onboarding on it."* This onboarding system is therefore a **reference implementation we demo to win the next deal** — the same way `roai.emergedigital.ae` demos Vela OS. It carries its own weight twice: once as internal delivery infrastructure, once as a sales asset.

This dual purpose drives two design constraints that recur throughout this document:

1. **It must look like Emerge.** Navy `#0A1F3D`, teal `#00C2C7`, Lexend. A portal that looks like a stock Salesforce site undercuts the pitch.
2. **It must be honest about its limits.** We are building on a free Developer Edition. Where that edition constrains us — file storage, Scheduler, user counts — the blueprint says so plainly and designs around it, because a prospect's technical team will ask, and "we hit that limit and here's how we handled it" is more credible than a demo that pretends the limit does not exist.

---

## 2. Scope & Definitions

### 2.1 In scope

The journey from a won deal to a Walk-ready engagement:

| Stage of the post-sale journey | What happens |
|---|---|
| **Intake** | `Opportunity` reaches `Closed-Won`; the engagement layer is provisioned automatically. |
| **Sales → Delivery handoff** | The closing context (scope, value, risks, named contacts) is captured once, in a `HandoffRecord__c`, and acknowledged by the delivery owner. |
| **Kickoff** | Internal prep, then a client kickoff session. |
| **Discovery-session scheduling** | Cal.com bookings for kickoff and 3–4 discovery sessions, written back as `Milestone__c` rows. |
| **Document / data / access collection — "the chase loop"** | `ChecklistItem__c` records move `Not Started → Requested → Received → Approved`, with reminders, ownership, and small-file-upload / large-file-link handling. |
| **Stakeholder mapping** | `Stakeholder__c` with RACI, confirmed by the client. |
| **Phase-gate tracking** | `PhaseGate__c` entry/exit criteria for the Crawl, with a recorded decision. |
| **Client-facing portal** | An Experience Cloud site where the client sees only their own engagement and its children. |

### 2.2 Out of scope (named, so the boundary is explicit)

- **Lead acquisition / pre-sale.** The website contact form and `/api/contact` flow stay as-is; this blueprint begins the instant an Opportunity is `Closed-Won`.
- **Walk and Run delivery.** Program execution after the Crawl exit gate is a separate system-of-record question. This blueprint ends at **Walk-ready** and hands off cleanly.
- **Billing, time tracking, resourcing.** Not modelled here.

### 2.3 Definitions

- **Crawl** — Emerge's fixed-scope, 4–8 week diagnostic phase (per `docs/brand-and-content.md` §3.8). The entire scope of this blueprint lives inside the Crawl.
- **Walk-ready** — the state in which the Crawl exit gate is **Met**: diagnostic delivered, ROAI baseline captured, roadmap accepted, and the client has agreed to scope a Walk. This is the terminal success state for onboarding.
- **The chase loop** — the recurring task of getting documents, data extracts, and system access out of a busy client. The single hardest, least-systematised part of onboarding today.
- **ROAI** — Return on AI / return on analytics investment; the baseline metric set we capture in the Crawl so Walk/Run value can be measured against it. (Echoes the Vela OS / `roai` run-state framing.)

---

## 3. Current State & Gaps

### 3.1 How onboarding runs today

| Step | Today's mechanism | Where it lives |
|---|---|---|
| Deal closes | Verbal / email | Founder's inbox |
| Handoff to delivery | A call, maybe a note | Nowhere durable |
| Kickoff scheduling | Cal.com (`rami-alcheikh/strategy-call`) | Cal.com only |
| Document/data/access chase | Email follow-ups | Scattered email threads |
| Stakeholder map | A slide or a mental model | Not shared, not maintained |
| Gate decision | A judgment call | Undocumented |
| Client visibility | Periodic emails | Client has no live view |

### 3.2 Gaps, ranked by cost

1. **No system of record for the handoff.** Context known at close (why they bought, who the real sponsor is, what was promised, what worried us) is the most valuable and most perishable information in the engagement, and it currently survives only as long as someone remembers it. **This is the highest-leverage gap.**
2. **The chase loop is invisible and unowned.** No one can answer "what are we waiting on, from whom, since when?" without reconstructing it from email. Aging items stall silently and surface as schedule slips.
3. **The client cannot see progress.** For a firm selling *visible governance*, the client experiencing onboarding as a series of emails is an own-goal.
4. **Gates are asserted, not evidenced.** "We're Walk-ready" is an opinion without recorded entry/exit criteria and a decision record. Procurement-grade buyers notice.
5. **It does not scale and it does not demo.** Every Crawl is bespoke effort, and none of it is reusable as proof to the next prospect.

### 3.3 What already exists that we should reuse, not rebuild

- **Cal.com** (`rami-alcheikh/strategy-call`) — working booking flow. Keep it; integrate it.
- **Resend** — working transactional email with brand-domain deliverability, already wired in `worker.ts` (`from: noreply@site.emergedigital.com`, navy/teal HTML template). Reuse the pattern and the domain reputation.
- **The contact-form intake field set** (`src/pages/contact.astro`) — name, company, work email, role, country, industry, situation, brief, preferred follow-up. This is our canonical first-party field shape; the engagement layer should not reinvent it.
- **Brand tokens** (`tailwind.config.mjs`) — the portal theme must map to these exactly.

---

## 4. Post-Sale Onboarding Best Practices & KPIs

### 4.1 Principles we are designing to

Drawn from established customer-onboarding and professional-services delivery practice, filtered to what matters for a high-stakes enterprise diagnostic:

1. **Time-to-first-value beats time-to-go-live.** The client should feel momentum within days (kickoff booked, portal live, a visible plan), not at the end.
2. **One owner per item, always.** Every checklist item, gate, and deliverable has a named accountable person on each side. Diffuse ownership is why chase loops stall.
3. **The client does work too — make their part effortless.** Most onboarding delay is the client's homework, not ours. The portal's job is to make *their* tasks obvious, low-friction, and self-evidently progressing.
4. **Make the invisible visible.** Status, ownership, aging, and gate criteria should be legible at a glance to both sides. This is the governance-cadence promise, instantiated.
5. **Gate on evidence, not vibes.** Entry/exit criteria are written down before the phase starts and the decision is recorded against them.
6. **Instrument from day one.** If we cannot measure onboarding, we cannot improve it or prove it.

### 4.2 The KPI set

Three headline KPIs, each with a precise definition so the measurement is unambiguous:

| KPI | Definition | Target (Crawl) | Source records |
|---|---|---|---|
| **Time-to-Value (TTV)** | Calendar days from `Opportunity.CloseDate` (Closed-Won) to the Crawl **exit gate** reaching `Met` (Walk-ready). A secondary "first-value" cut measures Closed-Won → kickoff session held. | ≤ 56 days (8 weeks); first-value ≤ 10 days | `Opportunity`, `PhaseGate__c`, `Milestone__c` |
| **Completion rate** | Of all `ChecklistItem__c` on an engagement, the % that reach `Approved` (or `Waived`) by their due date. Rolls up to a per-engagement onboarding-completion %. | ≥ 90% on-time | `ChecklistItem__c` |
| **Gate cycle time** | Days from a `PhaseGate__c` becoming eligible for decision (all criteria evidence attached) to the recorded decision date. Measures *our* responsiveness at the gate, not the client's. | ≤ 5 business days | `PhaseGate__c` |

**Supporting / diagnostic metrics** (tracked, not headline):

- **Handoff cycle time** — Closed-Won → `HandoffRecord__c.Status = Completed`. Target ≤ 2 business days.
- **Chase-loop aging** — average and max days a `ChecklistItem__c` sits in `Requested` before `Received`. The early-warning signal for schedule risk.
- **Session scheduling lead time** — Closed-Won → kickoff `Milestone__c` scheduled.
- **Portal adoption** — % of client contacts who have logged into the Experience Cloud site; first-login latency.
- **Onboarding CSAT / NPS** — a single survey at the Crawl exit gate.

These KPIs are the measurement contract for Section 6 and the success criteria for the phased rollout in Section 7.

---

## 5. Recommended Salesforce-Native Architecture

### 5.1 Platform foundation and its honest limits

| Decision | Choice | Why / constraint |
|---|---|---|
| Org | **Developer Edition with Agentforce and Data Cloud** (free) | The recommended free org for building and testing live Agentforce + Data Cloud. Not the *only* free path (Trailhead Playgrounds and Foundations can also enable Agentforce), but the right one here. Keep-alive: log in at least every 45 days or it deactivates. [S1] |
| Agentforce throughput | **150 LLM generation requests / hour** | A per-hour rate limit on the model calls Agentforce makes. Ample for a seeded demo and a single pilot; a real production fleet of concurrent client agents would exceed it — see rollout Phase 3. [S1] |
| Data Cloud | **1 Data Space, 10 GB** | Sufficient for the engagement layer and demo data. [S2] |
| Core storage | **5 MB data + 20 MB file** (standard DE allocation) | The binding constraint. We **cannot** store client documents as Salesforce Files at any scale. Architecture below stores large docs externally and links them; only small PDFs (e.g. a signed one-page NDA) live as Salesforce Files. [S3] |
| Scheduling | **Keep Cal.com** | Salesforce Scheduler is Enterprise/Unlimited only and **is not available in Developer Edition**. Cal.com stays and integrates by webhook. [S4] |
| Email | **Keep Resend** | Brand-domain deliverability already configured; called from Flow via HTTP callout (§9.3). |
| Orchestration | **Flow Orchestration** | Native multi-stage, multi-user orchestration. As of early 2026 it is **included in core Flow with no separate per-run licensing** (the former ~$1/run paywall was removed) — it runs under standard edition Flow limits. [S5] |
| External users | **~10 Experience Cloud (Customer Community) users + 2 full internal licenses** | Customer Community fits the "client sees only their own records via Sharing Sets" pattern (§5.6). [S6] |

> **Storage is the load-bearing constraint.** Every "where does the file go?" decision in this blueprint resolves to: **small PDF → Salesforce File; everything else → Box/Drive/S3, link stored on the record.** The `ChecklistItem__c` and `Deliverable__c` objects carry both an upload control (small) and a `File_Link__c` URL (large) precisely because of the 20 MB ceiling.

### 5.2 Data model — standard objects plus the engagement layer

**Standard objects (used as-is):**

- `Account` — the client organisation (industry, region).
- `Contact` — client people (sponsor, project lead, data/IT owner, legal).
- `Opportunity` — the deal; **`StageName = Closed Won` is the trigger** that provisions the engagement layer. `Amount` and a Crawl tier carry through.
- `Case` — client-raised onboarding requests from the portal Help page.

**Custom engagement layer (new):**

| Object | Purpose | Key relationship |
|---|---|---|
| `Engagement__c` | The post-sale program for one Account. The root of the tree. | Lookup → `Account`, `Opportunity`; Lookup → `Contact` (sponsor) |
| `Phase__c` | A Crawl/Walk/Run phase within an Engagement. | Master-Detail → `Engagement__c` |
| `PhaseGate__c` | Entry/exit criteria + decision for a Phase. | Master-Detail → `Phase__c` |
| `Milestone__c` | Kickoff, discovery sessions, gate reviews. **Cal.com webhook target.** | Master-Detail → `Engagement__c` |
| `Deliverable__c` | Diagnostic, ROAI baseline, roadmap. Client-visible toggle. | Master-Detail → `Engagement__c`; Lookup → `Phase__c` |
| `ChecklistItem__c` | The chase loop: documents, data, access, decisions. | Master-Detail → `Engagement__c`; Lookup → `Contact` (owner) |
| `Stakeholder__c` | Stakeholder map + RACI. | Master-Detail → `Engagement__c`; Lookup → `Contact` |
| `ROAIBaseline__c` | Baseline metrics for later value measurement. | Master-Detail → `Engagement__c` |
| `HandoffRecord__c` | Sales → delivery handoff context + acknowledgement. | Master-Detail → `Engagement__c`; Lookup → `Opportunity` |

The full field list for each object is in **Appendix 9.1**; the demo dataset in **Section 10** populates every one of them.

**Why Master-Detail for the children:** it gives the client-visibility model a clean spine. A Customer Community Sharing Set that grants a contact access to *their* `Engagement__c` cascades to all detail children, so a client sees their checklist, milestones, deliverables, stakeholders, and ROAI baseline without per-object sharing config (§5.6).

### 5.3 The eight-stage onboarding journey (Flow Orchestration)

One **Flow Orchestration** orchestrates the journey. Stages run sequentially; within a stage, steps may be assigned to different users (internal delivery, or — for interactive steps — surfaced to the client through the portal) and run in sequence or parallel.

| # | Stage | Trigger / entry | Key steps | Records written |
|---|---|---|---|---|
| 1 | **Engagement provisioning** | `Opportunity` → `Closed Won` | Auto-create `Engagement__c`, Crawl `Phase__c`, entry+exit `PhaseGate__c`, `HandoffRecord__c`, and the standard `ChecklistItem__c` template set | Engagement, Phase, 2× Gate, Handoff, Checklist seed |
| 2 | **Sales → Delivery handoff** | Stage 1 complete | Sales owner completes `HandoffRecord__c` (scope, value, risks, named contacts); delivery owner acknowledges | `HandoffRecord__c` → `Completed` |
| 3 | **Internal kickoff prep** | Handoff acknowledged | Delivery lead drafts `Stakeholder__c` map; assigns checklist owners; confirms Crawl plan | `Stakeholder__c` rows |
| 4 | **Client welcome & portal provisioning** | Prep complete | Create Experience Cloud (Customer Community) users for client contacts; send branded welcome email (Resend); apply Sharing Set | Community users; welcome email |
| 5 | **Kickoff scheduling & session** | Welcome sent | Client books via Cal.com → `Milestone__c` (kickoff); session held; notes captured | `Milestone__c` (kickoff) |
| 6 | **Discovery & the chase loop** | Kickoff held | Discovery sessions booked (Cal.com → `Milestone__c`); `ChecklistItem__c` worked `Requested → Received → Approved`; automated reminders (Resend) on aging items | `Milestone__c` (3–4), `ChecklistItem__c` transitions |
| 7 | **Diagnostic build & ROAI baseline** | Inputs `Received` | Produce `Deliverable__c` (diagnostic, ROAI baseline, roadmap); capture `ROAIBaseline__c` metrics; publish client-visible deliverables | `Deliverable__c`, `ROAIBaseline__c` |
| 8 | **Crawl exit gate & Walk-readiness** | Deliverables delivered | Attach evidence to exit `PhaseGate__c`; record gate decision; onboarding CSAT; hand off to Walk | `PhaseGate__c` → `Met` |

**Where the two agents sit on this journey** (detail in §5.7):
- **Delivery Copilot (internal)** assists stages 2–8: "summarise this handoff," "what's overdue on this engagement," "draft the gate decision rationale from the attached evidence."
- **Onboarding Concierge (client-facing)** is embedded in the portal (stages 4–8): "what do I still owe you?", "where do I upload the data dictionary?", "when is my next session?"

### 5.4 Trigger and automation design

- **Closed-Won trigger** — a record-triggered Flow on `Opportunity` (`StageName` changed to `Closed Won`) starts the orchestration. Guard with a checkbox (`Engagement_Provisioned__c`) to make provisioning idempotent — a reopened-then-reclosed Opportunity must not create a second engagement.
- **Checklist template** — the standard Crawl checklist is seeded from a template set (custom metadata or a cloned template Engagement) so every Crawl starts with the same baseline of documents/data/access items, then is tailored.
- **Reminders** — a scheduled Flow runs daily, finds `ChecklistItem__c` in `Requested` past a reminder threshold, and fires a Resend callout to the owning contact (and notifies the internal owner). This is the chase loop, automated.
- **Rollups** — engagement-level progress % and checklist completion % are roll-up summaries (Master-Detail enables native rollups) or a nightly Flow, surfaced on the portal home.

### 5.5 — Expanded Portal Information Architecture (Experience Cloud)

This is the client's entire experience of Emerge during onboarding. It carries the dogfooding thesis, so it is specified page by page.

**Template choice:** **Build Your Own (LWR)** — the blank-canvas Lightning Web Runtime template. LWR is the current, performance-oriented runtime and the recommended choice for new Experience Cloud sites (faster loads, better SEO, LWC-native); "Build Your Own" gives us full control of layout and theming, which the brand fidelity requirement demands. (Aura templates still exist and are required for a few features, but none we need here.) [S7]

**Theme / branding set:**
- Background / primary surface: navy `#0A1F3D`; deepest surface `#06122A` (ink).
- Accent / CTA: teal `#00C2C7`; hover/secondary `#3DDCE3` (cyan).
- Light surface tint where needed: platinum `#E8EEF5`.
- Type: **Lexend** (body + headings), **Prompt** for eyebrows/labels, **JetBrains Mono** for metric figures — matching `tailwind.config.mjs`. Loaded as a custom theme layout component referencing the same `@fontsource` families.
- Logo, favicon, and the teal-`Digital` wordmark treatment per the live site.

**Top navigation + auth:**
- Top nav: **Home · Checklist · Documents · Schedule · Stakeholders · ROAI Baseline · Help**.
- Auth: Customer Community **login**, **forgot-password**, and a **first-run** experience (set password from the welcome-email link → optional short profile confirm → land on Home). Self-registration is **off**; users are provisioned by us in stage 4. Login page themed navy/teal.

**Sharing & visibility (external users):** see §5.6 — a client contact sees only their own `Engagement__c` and its children.

| Page | Purpose | LWR / Lightning components | Binds to (object → fields) |
|---|---|---|---|
| **Home / Dashboard** | Onboarding at a glance | Custom LWC `onboardingProgress` (progress ring); `crawlTimeline` (gate markers); `nextAction` card; embedded Concierge launcher | `Engagement__c` → `Progress__c`, `Status__c`, `Health__c`, `Target_Walk_Ready_Date__c`; `Phase__c` → `Start_Date__c`, `End_Date__c`; `PhaseGate__c` → `Gate_Type__c`, `Status__c`; `Milestone__c` → next `Scheduled_Start__c` |
| **Checklist** | The client's homework — the chase loop, client side | Custom LWC `checklistBoard` with status badges, due dates, **upload-small** (file input → Salesforce File) and **link-large** (URL input → `File_Link__c`) controls, inline help popovers | `ChecklistItem__c` → `Name`, `Category__c`, `Status__c`, `Due_Date__c`, `Help_Text__c`, `Storage__c`, `File_Link__c`, `Owner_Contact__c` |
| **Documents / Deliverables** | What Emerge has produced for them | `relatedList`-style LWC `deliverableList` (download / open) filtered to client-visible | `Deliverable__c` (where `Client_Visible__c = true`) → `Name`, `Type__c`, `Status__c`, `Delivered_Date__c`, `File_Link__c` |
| **Schedule** | Book and review sessions | Embedded **Cal.com** booking (`rami-alcheikh/strategy-call`) via inline embed; `milestoneList` LWC below it | `Milestone__c` → `Name`, `Type__c`, `Scheduled_Start__c`, `Status__c`, `Meeting_URL__c` |
| **Stakeholders** | Confirm/edit who's who + RACI | `stakeholderGrid` LWC (editable for the sponsor contact) | `Stakeholder__c` → `Contact__c`, `Role__c`, `RACI__c`, `Is_Primary_Sponsor__c` |
| **ROAI Baseline** | The numbers we're measuring against | `roaiCharts` LWC (bar/line, navy→teal data palette) | `ROAIBaseline__c` → `Metric__c`, `Baseline_Value__c`, `Unit__c`, `Target_Value__c`, `Measurement_Date__c`, `Category__c` |
| **Help / Requests** | Raise an issue + ask the agent | `caseForm` LWC (reuses the contact-form field shape) → creates `Case`; **Onboarding Concierge** embedded messaging | `Case` → `Subject`, `Description`, `ContactId`, `AccountId`; agent session |

**Where the Onboarding Concierge is embedded:** a persistent launcher in the site header (present on every page) **and** inline on the Help page. It is an **Agentforce Service Agent** (the customer-facing agent type) deployed to the Experience Cloud site (§5.7).

**Responsive notes:** LWR is responsive by default; the custom LWCs use a single-column stack under ~768px, the top nav collapses to a hamburger, the checklist board switches from columns to stacked cards, and the Cal.com embed uses its responsive inline mode. Touch targets ≥ 44px.

**Accessibility notes:** WCAG 2.1 AA target — semantic headings in order (no skipped levels), visible focus states on every control (teal focus ring matching the site), status conveyed by **badge text + icon**, not colour alone (the chase-loop statuses must not rely on red/green), all form controls labelled, the Concierge launcher keyboard-reachable and screen-reader announced. Mirrors the accessibility bar already set in `CLAUDE.md` for the marketing site.

### 5.6 External-user sharing & visibility model

| Concern | Decision |
|---|---|
| License | **Customer Community** for client contacts (high-volume B2C-style; no roles). [S6] |
| Visibility mechanism | **Sharing Sets** — not role-based sharing. A Sharing Set grants a community user access to records whose lookup (`Account__c` / `Contact__c`) matches the user's own Account/Contact. Customer Community has no role hierarchy, so this is the correct and only mechanism. [S6] |
| What a client sees | Their **own** `Engagement__c` (matched by `Account__c`) and, via Master-Detail, all its children: checklist, milestones, client-visible deliverables, stakeholders, ROAI baseline, their own cases. |
| What a client never sees | Other clients' engagements; internal-only deliverables (`Client_Visible__c = false`); `HandoffRecord__c` (internal object, not exposed to the community profile at all); other accounts' anything. |
| Org-wide defaults | Engagement layer set to **Private**; access granted *only* through the Sharing Set. Default-deny is the safe posture for a multi-tenant client portal. |
| Internal users | **2 full licenses** (founder/delivery lead + one delivery team member) with full access to all engagements. |

> If a future client genuinely needs roles, reports, or to share records with *their* colleagues in a hierarchy, that is the **Customer Community Plus** upgrade (roles + sharing rules) — noted as an open decision (§8) because it changes per-user licensing economics.

### 5.7 The two Agentforce agents

| | **Delivery Copilot** | **Onboarding Concierge** |
|---|---|---|
| Audience | Internal (Emerge delivery) | Client (Experience Cloud) |
| Agent type | Agentforce **(Default) / Employee** agent — internal, in Lightning/Slack | Agentforce **Service Agent** — customer-facing, deployed to the Experience Cloud site & messaging [S8] |
| Grounding | The engagement layer + Data Cloud | The client's own engagement records only (scoped by the same Sharing Set) |
| Representative jobs | "Summarise this handoff and flag risks." "What's overdue across my engagements?" "Draft the exit-gate rationale from attached evidence." "Which checklist items block Walk-readiness?" | "What do I still owe you?" "Where do I upload the data dictionary?" "When is my next session — can I reschedule?" "What does this checklist item mean?" |
| Guardrails | Read/write within delivery scope | **Read-mostly**; can create a `Case` and surface checklist guidance, but never sees another client's data and never exposes internal deliverables or handoff notes |

The 150 generations/hour rate limit [S1] is comfortable for the Showcase MVP and a single pilot. A production fleet of always-on client Concierges across many live engagements would press that ceiling — which is one of the reasons production runs on an Enterprise org (Section 7, Phase 3).

---

## 6. Measurement

### 6.1 How each KPI is computed from records

| KPI | Formula | Mechanism |
|---|---|---|
| TTV | `PhaseGate__c.Decision_Date__c` (exit, `Met`) − `Opportunity.CloseDate` | Formula/rollup field on `Engagement__c`; reported in CRMA |
| First-value TTV | kickoff `Milestone__c.Scheduled_Start__c` − `Opportunity.CloseDate` | Formula field |
| Completion rate | count(`ChecklistItem__c` `Approved`/`Waived` by `Due_Date__c`) ÷ count(all) | Rollup + report |
| Gate cycle time | `Decision_Date__c` − date all gate criteria evidenced | Formula on `PhaseGate__c` |
| Handoff cycle time | `HandoffRecord__c` `Completed` timestamp − `Opportunity.CloseDate` | Formula |
| Chase-loop aging | `Received_Date__c` − `Requested_Date__c` (avg/max per engagement) | Report/rollup |
| Portal adoption | community users with `LastLoginDate` ≠ null ÷ provisioned | Report on `User` |

### 6.2 Where it surfaces

- **Internal:** a CRM Analytics (or report/dashboard) "Onboarding Control Tower" — every active engagement, its stage, RAG health, overdue checklist items, and the three headline KPIs trended over time. This is the internal twin of the client portal home.
- **Client:** the portal Home dashboard shows that client their own progress %, timeline, and next action — a deliberately simplified, single-engagement view of the same data.
- **Data Cloud:** engagement-layer data flows into the 10 GB Data Cloud space so onboarding metrics can later join Walk/Run run-state signals (the Vela OS / ROAI through-line) without re-plumbing.

### 6.3 The feedback loop

Every Crawl produces an onboarding CSAT at the exit gate and a clean record of where the chase loop stalled. Reviewed at a monthly delivery cadence, that data tightens the checklist template, the reminder timing, and the gate criteria — the system measurably improving the next onboarding is itself a demo-able proof point.

---

## 7. Phased Rollout

A discovery-gated path. Each phase has an explicit exit gate; **Phase 2 does not start until a data-residency decision is made** for real client data.

### Phase 1 — Showcase MVP (Developer Edition, seeded fictitious client)

**Goal:** a complete, demo-able onboarding system running end-to-end on the free org, loaded with the fictitious dataset in Section 10. No real client data.

**Build:** the nine custom objects + fields; the eight-stage Flow Orchestration; the Experience Cloud (Build Your Own LWR) portal with all seven pages, themed; Customer Community sharing set; both Agentforce agents (against demo data); Cal.com webhook → `Milestone__c`; Resend welcome/reminder callouts; the demo dataset loaded via SFDX data tree.

**Exit gate:** a prospect (or Rami) can log into the portal as the fictitious client "Masar Bank," see the live chase loop, book a session that writes back a `Milestone__c`, ask the Concierge a question, and watch the engagement reach Walk-ready — and the whole thing looks like Emerge. **This is the sales asset.**

**Honest constraints to respect:** 20 MB file storage (link, don't store, large docs); 150 gen/hour (fine for demo); keep the org alive (45-day login).

### Phase 2 — Pilot (first real client)

**Goal:** run one real Crawl on the system, in parallel with the existing manual process as a safety net.

**🚧 Gating decision (hard gate): data residency.** Before any real UAE/KSA Government or BFSI client data enters the org, decide where that data may legally and contractually reside. Salesforce data-residency posture, the client's own PDPL/regulatory constraints, and whether documents stay entirely in an in-region external store (with Salesforce holding only links + metadata) must be resolved. **This gate is the reason the rollout is staged and the reason Phase 1 uses only fictitious data.** See §8.

**Build delta:** real Box/Drive/S3 external store with in-region configuration; production-grade auth; legal review of the portal terms; the checklist template hardened from Phase-1 learnings.

**Exit gate:** one real client reaches Walk-ready on the system, onboarding CSAT captured, no data-residency or access incident.

### Phase 3 — Productionize (Enterprise org, licensing, Vela convergence)

**Goal:** onboarding as standing infrastructure across all concurrent Crawls.

**Build delta:** migrate from Developer Edition to a licensed **Enterprise** org (lifts the 5 MB/20 MB storage and 150 gen/hour ceilings; real Experience Cloud license counts; possible Customer Community Plus where clients need roles); productionised Agentforce; and **convergence with Vela OS / `roai`** so onboarding metrics feed the same run-state command center the rest of the engagement lifecycle uses. Onboarding stops being a separate system and becomes the front door of the Vela OS lifecycle.

**Exit gate:** all new Crawls onboard on the platform by default; the manual process is retired.

---

## 8. Risks & Open Decisions

### 8.1 Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| **Data residency** blocks real client data | High | High | Phase-2 hard gate; Phase 1 is fictitious-only; design assumes large docs in an in-region external store with Salesforce holding links/metadata only |
| **20 MB file storage** exhausted | High (at scale) | Med | Architecture stores only small PDFs as Files; everything else is a `File_Link__c`. Monitor; Enterprise org lifts it in Phase 3 |
| **Dev org deactivation** (45-day login lapse) | Med | High (demo loss) | Calendar reminder; the demo is a sales asset — treat keep-alive as an operational task |
| **150 gen/hour** throttles a busy demo or pilot | Low (demo), Med (pilot) | Med | Sufficient for MVP/single pilot; Enterprise org in Phase 3 for a fleet |
| **Cal.com / Resend** outage or contract change | Low | Med | Both are external dependencies we already run; webhook and callout are loosely coupled and degrade gracefully (a missed webhook can be reconciled; email retries) |
| **Sharing misconfiguration** leaks cross-client data | Low | Very High | Default-deny OWD; Sharing Set is the *only* grant; explicit test that client A cannot see client B; `HandoffRecord__c` never exposed to the community profile |
| **Scope creep** into Walk/Run | Med | Med | This blueprint's terminal state is Walk-ready; Walk is a separate system question |
| **Building before discovery** | — | — | This document **is** the discovery gate; nothing is built until it is reviewed and cut |

### 8.2 Open decisions (need Rami / stakeholder sign-off)

1. **Data-residency answer for UAE/KSA Gov & BFSI** — the Phase-2 hard gate. Blocks all real-client work.
2. **External document store** — Box vs Google Drive vs S3 (and in-region vs not). Drives the `File_Link__c` integration and the residency answer.
3. **Customer Community vs Customer Community Plus** — start with Community (Sharing Sets, no roles); upgrade only if a client needs roles/sharing-rules. Licensing-cost decision.
4. **Internal system-of-record for Walk/Run** — out of scope here, but the Walk-ready handoff needs a destination; decide before Phase 3.
5. **Cal.com event type per engagement vs one shared link** — one shared strategy-call link today; per-engagement event types give cleaner `Milestone__c` attribution. Operational choice.
6. **How hard to lean on the dogfooding angle in sales** — is the portal a live demo we put prospects inside, or an internal tool we screen-share? Changes the polish bar for Phase 1.

---

## 9. Appendix

### 9.1 Custom object field reference

Field API names, types, and notes for the engagement layer. (`MD` = Master-Detail, `LK` = Lookup.)

**`Engagement__c`** — root of the tree
| Field | Type | Notes |
|---|---|---|
| `Account__c` | LK(Account) | The client org |
| `Opportunity__c` | LK(Opportunity) | The won deal |
| `Sponsor__c` | LK(Contact) | Primary client sponsor |
| `Tier__c` | Picklist | Crawl / Walk / Run |
| `Status__c` | Picklist | Provisioning / Active / Walk-Ready / On Hold |
| `Health__c` | Picklist | Green / Amber / Red |
| `Start_Date__c` | Date | |
| `Target_Walk_Ready_Date__c` | Date | TTV target |
| `Progress__c` | Percent | Rollup/formula |
| `Region__c` | Picklist | UAE / KSA / Egypt / GCC / MEA |
| `Industry__c` | Picklist | Government / BFSI / Retail / … |
| `Engagement_Provisioned__c` | Checkbox | Idempotency guard on the Opportunity (see §5.4) |

**`Phase__c`** — `MD → Engagement__c`
| Field | Type | Notes |
|---|---|---|
| `Type__c` | Picklist | Crawl / Walk / Run |
| `Sequence__c` | Number | Order |
| `Start_Date__c` / `End_Date__c` | Date | |
| `Status__c` | Picklist | Not Started / In Progress / Complete |

**`PhaseGate__c`** — `MD → Phase__c`
| Field | Type | Notes |
|---|---|---|
| `Gate_Type__c` | Picklist | Entry / Exit |
| `Criteria__c` | Long Text | The written criteria |
| `Status__c` | Picklist | Not Met / In Review / Met |
| `Decision_Date__c` | Date | Drives gate cycle time |
| `Decision_Owner__c` | LK(User) | |

**`Milestone__c`** — `MD → Engagement__c` (Cal.com webhook target)
| Field | Type | Notes |
|---|---|---|
| `Type__c` | Picklist | Kickoff / Discovery Session / Gate Review |
| `Scheduled_Start__c` / `Scheduled_End__c` | DateTime | |
| `Status__c` | Picklist | Scheduled / Completed / Rescheduled / Canceled |
| `Cal_Booking_UID__c` | Text (External ID, Unique) | Upsert key from Cal.com |
| `Attendee_Email__c` | Email | |
| `Meeting_URL__c` | URL | |
| `Location__c` | Text | |

**`Deliverable__c`** — `MD → Engagement__c`; `LK → Phase__c`
| Field | Type | Notes |
|---|---|---|
| `Type__c` | Picklist | Diagnostic / ROAI Baseline / Roadmap / Other |
| `Status__c` | Picklist | Draft / In Review / Delivered / Approved |
| `Client_Visible__c` | Checkbox | Gates portal visibility |
| `File_Link__c` | URL | External store link (large files) |
| `Due_Date__c` / `Delivered_Date__c` | Date | |

**`ChecklistItem__c`** — `MD → Engagement__c`; `LK → Contact` (the chase loop)
| Field | Type | Notes |
|---|---|---|
| `Category__c` | Picklist | Document / Data / Access / Decision |
| `Status__c` | Picklist | Not Started / Requested / Received / Approved / Waived |
| `Owner_Contact__c` | LK(Contact) | Client-side owner |
| `Assigned_Internal__c` | LK(User) | Internal owner |
| `Due_Date__c` / `Requested_Date__c` / `Received_Date__c` | Date | Drive aging metric |
| `Storage__c` | Picklist | Salesforce File / External Link |
| `File_Link__c` | URL | For external (large) items |
| `Help_Text__c` | Text | Inline portal help |
| `Sensitivity__c` | Picklist | Standard / Confidential / Regulated |

**`Stakeholder__c`** — `MD → Engagement__c`; `LK → Contact`
| Field | Type | Notes |
|---|---|---|
| `Role__c` | Text | e.g. Executive Sponsor |
| `RACI__c` | Picklist | Responsible / Accountable / Consulted / Informed |
| `Influence__c` | Picklist | High / Medium / Low |
| `Sentiment__c` | Picklist | Champion / Neutral / Skeptic |
| `Is_Primary_Sponsor__c` | Checkbox | |

**`ROAIBaseline__c`** — `MD → Engagement__c`
| Field | Type | Notes |
|---|---|---|
| `Metric__c` | Text | e.g. Cross-sell conversion |
| `Baseline_Value__c` | Number | |
| `Unit__c` | Text | % / AED / days / NPS |
| `Target_Value__c` | Number | Walk/Run target |
| `Measurement_Date__c` | Date | |
| `Category__c` | Picklist | CX / Data / AI / Commercial |
| `Source__c` | Text | Where the baseline came from |

**`HandoffRecord__c`** — `MD → Engagement__c`; `LK → Opportunity` (internal only — never exposed to the community profile)
| Field | Type | Notes |
|---|---|---|
| `Sales_Owner__c` | LK(User) | |
| `Delivery_Owner__c` | LK(User) | |
| `Handoff_Date__c` | Date | |
| `Status__c` | Picklist | Pending / Completed |
| `Contract_Value__c` | Currency | |
| `Scope_Summary__c` | Long Text | What was sold |
| `Risks_Noted__c` | Long Text | What worried us at close |
| `CRM_Notes_Link__c` | URL | |

### 9.2 SFDX metadata & data layout

A standard DX source layout. Metadata is deployed with `sf project deploy`; demo data is loaded with `sf data import tree`.

```
emerge-onboarding-sfdx/
├── sfdx-project.json
├── force-app/main/default/
│   ├── objects/
│   │   ├── Engagement__c/           # object + fields/, listViews/, recordTypes/
│   │   ├── Phase__c/
│   │   ├── PhaseGate__c/
│   │   ├── Milestone__c/
│   │   ├── Deliverable__c/
│   │   ├── ChecklistItem__c/
│   │   ├── Stakeholder__c/
│   │   ├── ROAIBaseline__c/
│   │   └── HandoffRecord__c/
│   ├── flows/                       # record-triggered + scheduled (reminders) Flows
│   ├── flowDefinitions/
│   ├── flexipages/                  # internal record/home pages
│   ├── lwc/                         # onboardingProgress, checklistBoard, roaiCharts, …
│   ├── aura/                        # (only if a component needs Aura)
│   ├── digitalExperiences/          # Experience Cloud (LWR) site bundle
│   ├── experiences/                 # site config
│   ├── namedCredentials/            # Resend_API (and Salesforce-side for the Worker callback)
│   ├── permissionsets/             # Onboarding_Delivery, Onboarding_Community
│   ├── sharingRules/  sharingSets/  # Customer Community visibility
│   ├── genAiPlannerBundles/ bots/   # Agentforce agents (Copilot, Concierge)
│   └── staticresources/             # brand fonts/css for the portal theme
└── data/
    ├── plan.json                    # SFDX data tree plan (load order + references)
    ├── Account.json   Contact.json   Opportunity.json
    ├── Engagement__c.json   Phase__c.json   PhaseGate__c.json
    ├── Milestone__c.json   Deliverable__c.json   ChecklistItem__c.json
    ├── Stakeholder__c.json   ROAIBaseline__c.json   HandoffRecord__c.json
```

**Load method:** `sf data import tree --plan ./data/plan.json --target-org showcase`. The `plan.json` declares load order (Account → Contact → Opportunity → Engagement → children) and uses `@reference` ids to wire relationships. Note the platform limits: a tree export query returns ≤ 2,000 records and each data file holds ≤ 200 records on import [S9] — comfortably within our demo dataset. The legacy `sfdx force:data:tree:*` form is deprecated; use the `sf` (v2) CLI. [S9]

### 9.3 Integration specs

#### 9.3.1 Cal.com webhook → `Milestone__c`

**Pattern:** Cal.com cannot write to Salesforce directly, and a Developer Edition org should not expose an unauthenticated inbound endpoint. Route the webhook through the **existing Cloudflare Worker** (`worker.ts`) — which already mediates our external integrations — then have the Worker upsert the `Milestone__c` via the Salesforce REST API. This reuses infrastructure we already operate and keeps the Salesforce credentials server-side.

```
Cal.com  ──webhook──▶  Cloudflare Worker  ──Salesforce REST──▶  Milestone__c (upsert by Cal_Booking_UID__c)
 (BOOKING_*)            /api/cal-webhook       (OAuth client-credentials)
```

- **Cal.com side:** a webhook subscription on the `rami-alcheikh/strategy-call` event type for `BOOKING_CREATED`, `BOOKING_RESCHEDULED`, `BOOKING_CANCELLED`, with a signing secret.
- **Worker side (new route, mirrors the `worker.ts` handler style):**
  1. Verify the Cal.com `X-Cal-Signature-256` HMAC against the shared secret (reject on mismatch — same defensive posture as the existing handlers).
  2. Map the payload: booking `uid → Cal_Booking_UID__c`, `startTime → Scheduled_Start__c`, `endTime → Scheduled_End__c`, attendee email → `Attendee_Email__c`, meeting URL → `Meeting_URL__c`; event status → `Status__c` (`CREATED→Scheduled`, `RESCHEDULED→Rescheduled`, `CANCELLED→Canceled`).
  3. Resolve the `Engagement__c` (by attendee email → Contact → Engagement, or a booking metadata field carrying the engagement id).
  4. **Upsert** `Milestone__c` on the `Cal_Booking_UID__c` external id via `PATCH /services/data/vXX.X/sobjects/Milestone__c/Cal_Booking_UID__c/{uid}` so reschedules update the same row.
- **Auth:** OAuth 2.0 client-credentials (or JWT bearer) connected app; the Worker holds the secret as a Worker secret (same secrets model the project already uses for `RESEND_API_KEY`).
- **Alternative (no Worker):** a Salesforce **Site** + Apex REST endpoint receiving the webhook directly. Rejected as primary because it widens the Dev-Edition org's attack surface and duplicates integration plumbing we already have in the Worker.

#### 9.3.2 Resend email — Flow HTTP callout

**Pattern:** Salesforce Flow makes an outbound **HTTP callout** to the Resend API for transactional onboarding email (welcome, chase-loop reminders, gate notifications), reusing the exact payload shape and brand-domain deliverability already proven in `worker.ts`.

- **Named Credential:** `Resend_API` → `https://api.resend.com`, with the `RESEND_API_KEY` stored as an External Credential bearer token (never hard-coded — same secrets discipline as the Worker).
- **Callout (Flow `Action` → HTTP Callout, or External Service):**
  - `POST /emails`
  - Body mirrors `worker.ts`:
    ```json
    {
      "from": "Emerge Digital <noreply@site.emergedigital.com>",
      "to": ["sponsor@client.example"],
      "reply_to": "rami@emergedigital.com",
      "subject": "Your Emerge onboarding — next steps",
      "html": "…navy/teal branded template…",
      "text": "…plain-text fallback…"
    }
    ```
- **Deliverability:** reuse the already-configured brand sending domain (`site.emergedigital.com`) and its SPF/DKIM so onboarding mail inherits the existing reputation rather than warming a new domain.
- **Triggers:** stage 4 (welcome), the daily reminder Flow (§5.4) for aging `ChecklistItem__c`, and stage 8 (gate decision notification).
- **Template:** the same dark-navy card / teal CTA HTML used for the contact-form notification email, re-skinned for client-facing tone.

### 9.4 Sources

Salesforce facts in this blueprint were verified against current official documentation in June 2026. Two corrections were applied during verification and are reflected above: the Agentforce + Data Cloud org is described as *the recommended* free org rather than the *only* free path; and Flow Orchestration is described as included in core Flow (the former per-run paywall was removed in early 2026), not a paid add-on.

| Ref | Claim | Source |
|---|---|---|
| S1 | Developer Edition with Agentforce + Data Cloud; 150 LLM generations/hour; 45-day keep-alive | help.salesforce.com — "Developer Edition with Agentforce and Data Cloud" overview (`xcloud.overview_developer_edition_agentforce_datacloud`); developer.salesforce.com/blogs (Mar 2025 launch) |
| S2 | 1 Data Space, 10 GB Data Cloud | help.salesforce.com — Data 360 Developer Edition Limits & Guidelines (`data.c360_a_limits_and_guidelines_dev_ed`) |
| S3 | DE storage: 5 MB data, 20 MB file | help.salesforce.com — Data and File Storage Allocations (`xcloud.overview_storage`); DE limits (`xcloud.overview_limits_developer`) |
| S4 | Salesforce Scheduler is Enterprise/Unlimited only — **not** in Developer Edition | help.salesforce.com — Licenses for Salesforce Scheduler (`platform.ls_licenses_for_salesforce_scheduler`) |
| S5 | Flow Orchestration: stages/steps; **included in core Flow as of early 2026** (paywall removed) | help.salesforce.com — Orchestrator entitlements (`platform.orchestrator_considerations_entitlements`); SalesforceBen (2026, paywall removal) |
| S6 | Experience Cloud external licenses; Customer Community uses **Sharing Sets**; Customer Community Plus adds roles/sharing rules | help.salesforce.com — Experience Cloud license planning (`experience.exp_cloud_plan_licenses`); Community license types (`sf.users_license_types_communities`) |
| S7 | LWR is the recommended runtime for new sites; "Build Your Own (LWR)" / "Microsite (LWR)" templates | developer.salesforce.com — Experience Cloud LWR developer guide (`exp_cloud_lwr` intro & template overview) |
| S8 | Agentforce agent types — internal (Default/Employee) vs customer-facing **Service Agent** (Experience Cloud / messaging) | help.salesforce.com — Agentforce agent types (`ai.agent_setup_explore_types`) |
| S9 | `sf data import tree` / `export tree`, `--plan`; ≤ 2,000 query / ≤ 200 per file; legacy `sfdx force:data:tree` deprecated | developer.salesforce.com — Salesforce CLI Reference (`data` commands); SFDX Dev Guide — Sample data with data tree |

*(Article ids are given so the exact help pages can be located; verify against the current release at build time.)*

---

## 10. Seeded Demo Dataset — **FICTITIOUS DEMO DATA**

> **⚠️ Every record below is fictitious and exists only to populate the Showcase MVP (Phase 1).** No real client, person, contract, or metric is represented. Names are invented; any resemblance to a real organisation is coincidental. Load with `sf data import tree --plan ./data/plan.json` into the showcase org only — never into an org holding real client data.

**Two clients:** a fully-detailed primary (**Masar Bank** — UAE BFSI, the on-brand Tier-1-bank archetype from `brand-and-content.md`) and a lighter second (**Tatweer Digital Authority** — KSA Government). Both Crawl-tier, both anchored to Vision 2030 buyer segments. Dates sit around the document date (June 2026) so the chase loop and timeline render live.

### 10.1 Account

| Ref | Name | Industry | Region | Type | Notes |
|---|---|---|---|---|---|
| `acc_masar` | Masar Bank | BFSI | UAE | Customer | Tier-1 UAE commercial bank (fictitious) |
| `acc_tatweer` | Tatweer Digital Authority | Government | KSA | Customer | KSA public-sector digital authority (fictitious) |

### 10.2 Contact (Masar Bank — 5; Tatweer — 2 lighter)

| Ref | Account | Name | Title | Role on engagement | Email (fictitious) |
|---|---|---|---|---|---|
| `con_masar_sponsor` | Masar Bank | Yousef Al-Rashidi | Chief Customer Officer | Executive sponsor | yousef.alrashidi@masarbank.example |
| `con_masar_lead` | Masar Bank | Leila Haddad | Head of Digital | Project lead | leila.haddad@masarbank.example |
| `con_masar_data` | Masar Bank | Omar Khalil | Head of Data & Analytics | Data/IT owner | omar.khalil@masarbank.example |
| `con_masar_it` | Masar Bank | Priya Nair | Enterprise Architecture Lead | Access/IT owner | priya.nair@masarbank.example |
| `con_masar_legal` | Masar Bank | Fatima Al-Mansoori | General Counsel | Legal/compliance | fatima.almansoori@masarbank.example |
| `con_tatweer_sponsor` | Tatweer Digital Authority | Abdullah Al-Otaibi | Director, Digital Services | Executive sponsor | a.alotaibi@tatweer.example |
| `con_tatweer_lead` | Tatweer Digital Authority | Sara Al-Qahtani | Programme Manager | Project lead | s.alqahtani@tatweer.example |

### 10.3 Opportunity (Closed-Won, Crawl tier)

| Ref | Account | Name | Stage | Amount | Close Date | Tier |
|---|---|---|---|---|---|---|
| `opp_masar` | Masar Bank | Masar — CX & Data Crawl Diagnostic | Closed Won | AED 480,000 | 2026-06-02 | Crawl |
| `opp_tatweer` | Tatweer Digital Authority | Tatweer — Citizen Experience Crawl | Closed Won | SAR 390,000 | 2026-06-09 | Crawl |

### 10.4 Engagement__c

| Ref | Account | Opportunity | Sponsor | Tier | Status | Health | Start | Target Walk-Ready | Progress | Region | Industry |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `eng_masar` | acc_masar | opp_masar | con_masar_sponsor | Crawl | Active | Green | 2026-06-03 | 2026-07-29 | 55% | UAE | BFSI |
| `eng_tatweer` | acc_tatweer | opp_tatweer | con_tatweer_sponsor | Crawl | Active | Amber | 2026-06-10 | 2026-08-05 | 20% | KSA | Government |

### 10.5 Phase__c (Crawl)

| Ref | Engagement | Type | Seq | Start | End | Status |
|---|---|---|---|---|---|---|
| `ph_masar_crawl` | eng_masar | Crawl | 1 | 2026-06-03 | 2026-07-29 | In Progress |
| `ph_tatweer_crawl` | eng_tatweer | Crawl | 1 | 2026-06-10 | 2026-08-05 | In Progress |

### 10.6 PhaseGate__c (entry + exit per phase)

| Ref | Phase | Gate Type | Criteria (abridged) | Status | Decision Date |
|---|---|---|---|---|---|
| `gate_masar_entry` | ph_masar_crawl | Entry | Closed-Won; sponsor confirmed; NDA executed; kickoff booked | Met | 2026-06-05 |
| `gate_masar_exit` | ph_masar_crawl | Exit | Diagnostic delivered; ROAI baseline captured; roadmap accepted; Walk scope agreed | In Review | — |
| `gate_tatweer_entry` | ph_tatweer_crawl | Entry | Closed-Won; sponsor confirmed; data-handling agreement signed; kickoff booked | Met | 2026-06-12 |
| `gate_tatweer_exit` | ph_tatweer_crawl | Exit | Diagnostic delivered; ROAI baseline captured; roadmap accepted | Not Met | — |

### 10.7 Milestone__c (kickoff + discovery sessions; Cal.com-style UIDs)

| Ref | Engagement | Type | Scheduled Start | Status | Cal_Booking_UID | Attendee |
|---|---|---|---|---|---|---|
| `ms_masar_kickoff` | eng_masar | Kickoff | 2026-06-12 10:00 GST | Completed | cal_masar_kick_8x2 | con_masar_lead |
| `ms_masar_disc1` | eng_masar | Discovery Session | 2026-06-17 11:00 GST | Completed | cal_masar_d1_4k9 | con_masar_data |
| `ms_masar_disc2` | eng_masar | Discovery Session | 2026-06-23 11:00 GST | Scheduled | cal_masar_d2_7p1 | con_masar_data |
| `ms_masar_disc3` | eng_masar | Discovery Session | 2026-06-30 14:00 GST | Scheduled | cal_masar_d3_2m6 | con_masar_it |
| `ms_masar_gate` | eng_masar | Gate Review | 2026-07-24 13:00 GST | Scheduled | cal_masar_gate_9q3 | con_masar_sponsor |
| `ms_tatweer_kickoff` | eng_tatweer | Kickoff | 2026-06-18 12:00 AST | Scheduled | cal_tat_kick_5h7 | con_tatweer_lead |
| `ms_tatweer_disc1` | eng_tatweer | Discovery Session | 2026-06-25 12:00 AST | Scheduled | cal_tat_d1_3b8 | con_tatweer_lead |

### 10.8 Deliverable__c

| Ref | Engagement | Type | Status | Client Visible | Due | Delivered |
|---|---|---|---|---|---|---|
| `del_masar_diag` | eng_masar | Diagnostic | In Review | Yes | 2026-07-15 | — |
| `del_masar_roai` | eng_masar | ROAI Baseline | Delivered | Yes | 2026-06-26 | 2026-06-25 |
| `del_masar_road` | eng_masar | Roadmap | Draft | No | 2026-07-22 | — |
| `del_tatweer_diag` | eng_tatweer | Diagnostic | Draft | No | 2026-07-22 | — |
| `del_tatweer_roai` | eng_tatweer | ROAI Baseline | Draft | No | 2026-07-15 | — |

### 10.9 ChecklistItem__c — **mixed statuses so the chase loop is visible**

**Masar Bank** (full set; note the `Requested` items aging since mid-June — the live chase loop):

| Ref | Category | Item | Status | Owner (client) | Due | Requested | Received | Storage |
|---|---|---|---|---|---|---|---|---|
| `chk_masar_nda` | Document | Signed mutual NDA | Approved | con_masar_legal | 2026-06-06 | 2026-06-03 | 2026-06-04 | Salesforce File |
| `chk_masar_org` | Document | Org chart & stakeholder list | Approved | con_masar_lead | 2026-06-10 | 2026-06-05 | 2026-06-08 | External Link |
| `chk_masar_cxmap` | Document | Current CX journey maps | Received | con_masar_lead | 2026-06-18 | 2026-06-11 | 2026-06-16 | External Link |
| `chk_masar_datadict` | Data | Customer data dictionary | Requested | con_masar_data | 2026-06-20 | 2026-06-12 | — | External Link |
| `chk_masar_extracts` | Data | Sample data extracts (anonymised) | Requested | con_masar_data | 2026-06-24 | 2026-06-12 | — | External Link |
| `chk_masar_analytics` | Access | Read access to analytics platform | Requested | con_masar_it | 2026-06-22 | 2026-06-13 | — | — |
| `chk_masar_martech` | Access | MarTech stack inventory & access | Not Started | con_masar_it | 2026-06-27 | — | — | — |
| `chk_masar_kpis` | Decision | Confirm priority KPI set for ROAI baseline | Received | con_masar_sponsor | 2026-06-19 | 2026-06-12 | 2026-06-17 | — |
| `chk_masar_compliance` | Document | PDPL / data-handling constraints | Approved | con_masar_legal | 2026-06-16 | 2026-06-09 | 2026-06-12 | Salesforce File |
| `chk_masar_budget` | Decision | Walk-phase budget envelope (indicative) | Not Started | con_masar_sponsor | 2026-07-10 | — | — | — |

**Tatweer Digital Authority** (lighter set, earlier in the loop):

| Ref | Category | Item | Status | Owner (client) | Due | Requested | Received |
|---|---|---|---|---|---|---|---|
| `chk_tat_dha` | Document | Data-handling agreement | Approved | con_tatweer_sponsor | 2026-06-12 | 2026-06-10 | 2026-06-11 |
| `chk_tat_org` | Document | Service org chart | Requested | con_tatweer_lead | 2026-06-22 | 2026-06-15 | — |
| `chk_tat_portals` | Data | Citizen portal analytics export | Not Started | con_tatweer_lead | 2026-06-29 | — | — |
| `chk_tat_access` | Access | Staging environment access | Not Started | con_tatweer_lead | 2026-07-02 | — | — |

### 10.10 Stakeholder__c (RACI)

| Ref | Engagement | Contact | Role | RACI | Influence | Sentiment | Primary Sponsor |
|---|---|---|---|---|---|---|---|
| `stk_masar_1` | eng_masar | con_masar_sponsor | Executive Sponsor | Accountable | High | Champion | Yes |
| `stk_masar_2` | eng_masar | con_masar_lead | Project Lead | Responsible | High | Champion | No |
| `stk_masar_3` | eng_masar | con_masar_data | Data/IT Owner | Responsible | Medium | Neutral | No |
| `stk_masar_4` | eng_masar | con_masar_it | Access/Architecture | Consulted | Medium | Neutral | No |
| `stk_masar_5` | eng_masar | con_masar_legal | Legal/Compliance | Consulted | Medium | Skeptic | No |
| `stk_tat_1` | eng_tatweer | con_tatweer_sponsor | Executive Sponsor | Accountable | High | Champion | Yes |
| `stk_tat_2` | eng_tatweer | con_tatweer_lead | Programme Manager | Responsible | Medium | Neutral | No |

### 10.11 ROAIBaseline__c (sample metrics)

| Ref | Engagement | Metric | Baseline | Unit | Target | Measured | Category |
|---|---|---|---|---|---|---|---|
| `roai_masar_1` | eng_masar | Cross-sell conversion | 2.4 | % | 3.3 | 2026-06-25 | Commercial |
| `roai_masar_2` | eng_masar | Customer data sources unified | 14 | count | 1 (CDP) | 2026-06-25 | Data |
| `roai_masar_3` | eng_masar | Time-to-personalised-offer | 48 | hours | 1 | 2026-06-25 | CX |
| `roai_masar_4` | eng_masar | Contact-centre NPS (digital cohort) | 31 | NPS | 45 | 2026-06-25 | CX |
| `roai_tat_1` | eng_tatweer | Citizen satisfaction (CSAT) | 68 | % | 82 | 2026-06-20 | CX |
| `roai_tat_2` | eng_tatweer | Service portals (fragmented) | 4 | count | 1 | 2026-06-20 | Data |

### 10.12 HandoffRecord__c (internal)

| Ref | Engagement | Opportunity | Sales Owner | Delivery Owner | Handoff Date | Status | Contract Value | Scope (abridged) | Risks noted |
|---|---|---|---|---|---|---|---|---|---|
| `ho_masar` | eng_masar | opp_masar | Rami (Founder) | Delivery Lead | 2026-06-03 | Completed | AED 480,000 | 6-week CX & Data diagnostic; unify customer data, size CDP opportunity, ROAI baseline, Walk roadmap | Data residency (BFSI/PDPL); 14 fragmented sources; legal counsel is cautious |
| `ho_tatweer` | eng_tatweer | opp_tatweer | Rami (Founder) | Delivery Lead | 2026-06-10 | Completed | SAR 390,000 | Citizen-experience diagnostic across 4 portals; CSAT baseline; roadmap | KSA gov data-handling rules; staging access dependency |

### 10.13 Load order (plan.json)

`Account → Contact → Opportunity → Engagement__c → Phase__c → PhaseGate__c → Milestone__c → Deliverable__c → ChecklistItem__c → Stakeholder__c → ROAIBaseline__c → HandoffRecord__c`. Children reference parents by the `Ref` ids above using SFDX `@`-references in the plan. All within the ≤ 200-records-per-file / ≤ 2,000-query tree limits [S9].

---

## Ranked Implementation Backlog

For when this blueprint is greenlit. Ordered by leverage; effort is S/M/L. Nothing here is built or filed yet — it is the proposed Phase-1 sequence.

| # | Item | Phase | Effort | Why this rank |
|---|---|---|---|---|
| 1 | Stand up the Dev Edition (Agentforce + Data Cloud) org; set the 45-day keep-alive reminder | 1 | S | Everything depends on it; keep-alive protects the demo asset |
| 2 | Build the 9 custom objects + fields (Appendix 9.1) | 1 | M | The spine of the whole system |
| 3 | Closed-Won record-triggered Flow + idempotency guard (provisioning, stage 1) | 1 | M | Proves the trigger; creates the tree automatically |
| 4 | Seed & load the fictitious dataset (Section 10) via `sf data import tree` | 1 | S | Unblocks portal/agent build and every demo; do early |
| 5 | The 8-stage Flow Orchestration (stages 2–8) | 1 | L | The journey itself; the governance-cadence proof |
| 6 | Experience Cloud **Build Your Own (LWR)** site, themed navy/teal/Lexend | 1 | L | The dogfooding surface; highest sales value |
| 7 | Customer Community license + **Sharing Set**; cross-client isolation test | 1 | M | Security-critical; must pass "A cannot see B" before any demo |
| 8 | Portal pages + LWCs (checklist board, progress, ROAI charts, deliverables, schedule, stakeholders, help) | 1 | L | The seven pages from §5.5 |
| 9 | Cal.com webhook → Worker → `Milestone__c` upsert (§9.3.1) | 1 | M | Live write-back is the "wow" moment in a demo |
| 10 | Resend Flow callout — welcome + reminder + gate emails (§9.3.2) | 1 | M | Automates the chase loop; reuses proven deliverability |
| 11 | Agentforce **Delivery Copilot** (internal) | 1 | M | Internal leverage; lower demo risk |
| 12 | Agentforce **Onboarding Concierge** (Service Agent, in portal) | 1 | M | Client-facing; the Agentforce proof point |
| 13 | Internal "Onboarding Control Tower" dashboard + the 3 KPIs (§6) | 1 | M | Makes the system measurable and self-improving |
| 14 | **Data-residency decision** (Phase-2 hard gate) | 2 | — | Decision, not build — but blocks all real-client work (§8) |
| 15 | External document store (Box/Drive/S3, in-region) wired to `File_Link__c` | 2 | M | The 20 MB workaround, productionised |
| 16 | First real-client pilot, parallel-run with manual process | 2 | L | Validates with real data and real stakes |
| 17 | Enterprise org migration; licensing; Vela OS / `roai` convergence | 3 | L | Lifts DE ceilings; onboarding becomes the front door of the lifecycle |

---

*Prepared as a discovery-gated research blueprint. Salesforce facts verified against current official documentation (June 2026) and cited in §9.4. No production Salesforce metadata is created by this document.*
