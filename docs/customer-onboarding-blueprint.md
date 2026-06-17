# Post-Sale Client Onboarding — Salesforce-Native Blueprint

**Prepared for:** Rami, Founder — Emerge Digital
**Owner:** CX Division (Delivery Operations)
**Status:** Research blueprint — no Salesforce code yet. Source of truth for the implementation backlog.
**Date:** June 2026
**Scope tag:** Post-sale only — *Opportunity Closed-Won → end of Crawl (4–8 week diagnostic) → Walk-ready.*

> This document is a research blueprint, not a build. It describes the target architecture, the
> Developer-Edition constraints we will design within, a ranked implementation backlog, and a
> fully-seeded fictitious demo dataset for a Showcase MVP. Everything in the demo dataset (Section 10)
> is **fictitious and for demonstration only** — no real client data appears in this document.

---

## Table of contents

1. [Executive summary & dogfooding thesis](#1-executive-summary--dogfooding-thesis)
2. [Scope](#2-scope)
3. [Current state & gaps](#3-current-state--gaps)
4. [Post-sale onboarding best practices & KPIs](#4-post-sale-onboarding-best-practices--kpis)
5. [Salesforce-native architecture](#5-salesforce-native-architecture)
6. [Measurement](#6-measurement)
7. [Phased rollout](#7-phased-rollout)
8. [Risks & open decisions](#8-risks--open-decisions)
9. [Appendix](#9-appendix)
10. [Seeded fictitious demo dataset](#10-seeded-fictitious-demo-dataset)

---

## 1. Executive summary & dogfooding thesis

Emerge Digital sells a **Crawl–Walk–Run** engagement model. The moment a client signs a Crawl-phase
diagnostic (Opportunity Closed-Won), a 4–8 week clock starts. In that window the client must be made to
feel that the *local-prime* promise — accountability, governance cadence, named KPIs, phase gates — is
not marketing language but an operating system. Today that window is run on email, spreadsheets, and
shared drives. The handoff from sales to delivery is verbal. Document and access collection is a manual
chase. The client has no single place to see "where are we, what do you need from me, what happens next."

This blueprint specifies a **Salesforce-native post-sale onboarding system** that turns the Crawl phase
into a governed, measurable, repeatable motion:

- An **Agentforce + Data Cloud Developer Edition** org — the primary free, non-expiring Salesforce
  environment for building and testing *live* Agentforce agents (capped at 150 LLM generations/hour; see
  Appendix 9.5 for verified limits and honest caveats).
- A **standard CRM spine** (Account, Contact, Opportunity, Case) extended by a **custom engagement layer**
  (`Engagement__c`, `Phase__c`, `PhaseGate__c`, `Milestone__c`, `Deliverable__c`, `ChecklistItem__c`,
  `Stakeholder__c`, `ROAIBaseline__c`, `HandoffRecord__c`).
- A **Flow Orchestrator** journey (8 stages) that fires on Closed-Won and drives the engagement from
  handoff through to a Walk-ready phase-gate decision.
- **Two Agentforce agents**: an internal **Delivery Copilot** (helps the Emerge team run the playbook)
  and a client-facing **Onboarding Concierge** (answers client questions, nudges outstanding items).
- A **client portal** (Experience Cloud, LWR) that shows each client only their own engagement: progress,
  checklist, documents, schedule, stakeholders, ROAI baseline, and a help channel.
- **Cal.com** for scheduling (Salesforce Scheduler is not available in our Developer Edition org), wired
  to Salesforce via webhook → `Milestone__c`.
- **Resend** for transactional email, called from Flow via HTTP Callout — the same Resend account and
  brand-domain deliverability the marketing site already uses (`worker.ts`).

### 1.1 The dogfooding thesis

Emerge sells **CX, Data, AI, and Agentforce/Salesforce** programs. The single most credible thing a
Salesforce + Agentforce consultancy can show a prospect is **its own onboarding running on Salesforce and
Agentforce.** This blueprint is therefore deliberately built to be **demoed**:

- Every prospect briefing can end with "here is how *you* would experience your first eight weeks with us"
  — shown live in the portal, against a seeded demo client.
- The internal Delivery Copilot and the client Onboarding Concierge are *reference implementations* of the
  exact Agentforce patterns we sell (internal employee agent + external service agent).
- The phase-gate, RACI, and ROAI-baseline discipline is the *governance cadence* the brand promises, made
  visible and exportable.

In short: **we onboard ourselves the way we tell clients to operate, and we sell the recording.** This is
why the MVP target (Section 7) is a Showcase org with a seeded client, *before* a real client touches it.

---

## 2. Scope

### 2.1 In scope

The post-sale onboarding motion, end to end:

| Stage | What it covers |
|---|---|
| **Intake** | Capturing the won deal's context into the engagement layer; reusing the contact-form intake fields already collected pre-sale. |
| **Sales → Delivery handoff** | A structured `HandoffRecord__c` snapshot: scope, commercials, stakeholders, risks, promises made in the sale. |
| **Kickoff** | Scheduling and running the kickoff session; confirming the governance cadence. |
| **Discovery scheduling** | 3–4 discovery sessions across CX/Data/AI workstreams, booked via Cal.com. |
| **Doc / data / access collection** | The chase loop — requesting, tracking, and approving documents, datasets, and system access (`ChecklistItem__c`). |
| **Stakeholder mapping** | Confirming sponsors, owners, and a RACI matrix (`Stakeholder__c`). |
| **Phase-gate tracking** | Crawl entry and exit gates with explicit criteria (`PhaseGate__c`); the Walk-ready decision. |
| **Client portal** | A client-facing Experience Cloud site scoped to each client's own engagement. |

### 2.2 Out of scope (explicitly excluded)

- **Lead generation / pre-sale.** The marketing site, the contact form, lead nurture, and the sales cycle
  up to Closed-Won are out of scope. We *consume* the contact-form intake fields but do not redesign them.
- **Walk and Run phases.** Delivery execution after the Crawl exit gate (the Walk transformation phase and
  the Run managed-services program) is out of scope. This blueprint ends at **Walk-ready**.
- **Billing / CPQ / contracting mechanics.** Referenced where they touch handoff, but not designed here.
- **Salesforce code.** This is a research deliverable. No Apex, no LWC source, no metadata is shipped —
  only the architecture, field-level design, and the demo dataset that the build will consume.

### 2.3 Phase boundary definition

```
   [ Pre-sale: lead-gen, RFP, proposal ]      ← OUT OF SCOPE
                  │
          Opportunity = Closed-Won            ← TRIGGER (this blueprint starts here)
                  │
   ┌──────────────▼───────────────────────────────────────────┐
   │  CRAWL (4–8 weeks)                                          │
   │  intake → handoff → kickoff → discovery → collection →     │  ← IN SCOPE
   │  stakeholder map → phase-gate review                        │
   └──────────────┬───────────────────────────────────────────┘
                  │
          Crawl exit gate = "Walk-ready"      ← TRIGGER (this blueprint ends here)
                  │
   [ Walk transformation phase, Run program ] ← OUT OF SCOPE
```

---

## 3. Current state & gaps

### 3.1 What exists today

- **Marketing site** (Astro 5 on a Cloudflare Worker) with a contact form posting to `/api/contact`,
  which sends a Resend email to `rami@emergedigital.com` (`worker.ts`). Intake fields already captured:
  full name, company, work email, role/title, country, industry, situation (multi-select), brief,
  preferred follow-up.
- **Cal.com** scheduling for the founder's strategy call (`rami-alcheikh/strategy-call`).
- **Resend** transactional email on a verified brand domain (`noreply@site.emergedigital.com`).
- **No CRM system of record** for post-sale onboarding. No engagement object, no phase gates, no client
  portal, no structured handoff.

### 3.2 Gaps this blueprint closes

| Gap | Impact today | Closed by |
|---|---|---|
| Sales→delivery handoff is verbal/email | Promises and context lost; delivery re-discovers scope | `HandoffRecord__c` + Orchestrator stage 2 |
| No single engagement record | Status lives in people's heads and threads | `Engagement__c` spine |
| Document/access chase is manual | Slips, missed items, slow time-to-value | `ChecklistItem__c` + chase loop + Concierge nudges |
| No phase-gate discipline | "Walk-ready" is a feeling, not a decision | `PhaseGate__c` entry/exit criteria |
| Client has no window into progress | Repeated "where are we?" emails; weak local-prime signal | Experience Cloud portal |
| Scheduling lives outside the system of record | Sessions not tied to milestones; no audit trail | Cal.com webhook → `Milestone__c` |
| No baseline for ROI / Return-on-AI claims | Walk business case starts from zero | `ROAIBaseline__c` captured during Crawl |
| Onboarding is not demoable | Can't show prospects the operating model | Whole system, seeded (dogfooding) |

### 3.3 Constraints inherited

- We are building on an **Agentforce + Data Cloud Developer Edition** org (the primary free, non-expiring
  org for live Agentforce). This caps Agentforce generations, storage, and user counts (see
  Section 5 and Appendix 9.5). The architecture is deliberately designed to live within those caps and to
  graduate cleanly to an Enterprise org at the Productionize stage.
- **Salesforce Scheduler is not available in Developer Edition** → we keep **Cal.com**.
- **Developer Edition file storage is small** → large documents live in external storage (Box/Drive/S3)
  and are *linked*; only small PDFs are stored as Salesforce Files.

---

## 4. Post-sale onboarding best practices & KPIs

### 4.1 Principles (professional-services onboarding)

1. **Time-to-first-value over time-to-complete.** The Crawl phase exists to produce a defensible
   diagnostic and roadmap fast. Optimize for the first concrete value moment (kickoff held, first
   discovery insight shared), not just final sign-off.
2. **One owner, one record.** Every engagement has a single Emerge accountable owner and a single
   `Engagement__c` record that is the source of truth. (The local-prime "one throat to choke" promise,
   operationalized.)
3. **The client always knows the next action.** At any moment the portal answers three questions:
   *Where are we? What do you owe us? What happens next?*
4. **Collect once, reuse everywhere.** Pre-sale intake flows into the engagement; nothing is re-asked.
5. **Govern with gates, not vibes.** A phase advances only when explicit entry/exit criteria are met and
   recorded. Gate decisions are logged and visible.
6. **Chase politely and automatically.** Outstanding items are nudged on a cadence by the system (and the
   Concierge), escalating to a human owner only when stuck.
7. **Baseline everything you will later claim.** ROAI metrics are captured at Crawl so the Walk business
   case has a credible "before."
8. **Honest within platform limits.** Where Developer Edition forces a workaround (external file storage,
   Cal.com), design it cleanly rather than pretending the limit doesn't exist.

### 4.2 The onboarding motion (reference model)

```
Closed-Won
  → Provision engagement (auto)
  → Sales→Delivery handoff (structured, reviewed)
  → Welcome + portal access (Concierge intro)
  → Kickoff scheduled & held (governance cadence set)
  → Discovery sessions scheduled (3–4)
  → Document/data/access collection (chase loop runs in parallel)
  → Stakeholder map + RACI confirmed by client
  → Diagnostic + ROAI baseline + roadmap drafted (Deliverables)
  → Crawl exit gate review → Walk-ready
```

### 4.3 KPIs

These are the metrics the system must instrument from day one. Targets are initial hypotheses to be
calibrated against the first cohort.

| KPI | Definition | Initial target | Source field(s) |
|---|---|---|---|
| **Time-to-value (TTV)** | Closed-Won → kickoff held | ≤ 7 calendar days | `Engagement__c.Closed_Won_Date__c` → kickoff `Milestone__c.Actual_Date__c` |
| **Time-to-first-insight** | Closed-Won → first discovery session held | ≤ 14 days | first discovery `Milestone__c.Actual_Date__c` |
| **Onboarding cycle time** | Closed-Won → Walk-ready gate passed | ≤ 8 weeks (Crawl SLA) | `Engagement__c.Closed_Won_Date__c` → `PhaseGate__c` (exit) `Decision_Date__c` |
| **Checklist completion rate** | Approved items ÷ total required items | 100% at exit gate; ≥ 80% by week 3 | `ChecklistItem__c.Status__c` roll-up |
| **Collection chase latency** | Avg days from `Requested` → `Received` per item | ≤ 5 days | `ChecklistItem__c.Requested_Date__c` → `Received_Date__c` |
| **Gate cycle time** | Days a gate sits "In Review" before decision | ≤ 3 days | `PhaseGate__c.Submitted_Date__c` → `Decision_Date__c` |
| **Handoff completeness** | Required handoff fields populated at delivery acceptance | 100% before kickoff | `HandoffRecord__c` validation |
| **Stakeholder confirmation** | RACI confirmed by client sponsor | 100% by week 2 | `Stakeholder__c.Confirmed__c` |
| **Portal engagement** | % of client stakeholders who log in ≥ 1×/week | ≥ 60% | Experience Cloud login activity |
| **Concierge deflection** | Client questions resolved by Concierge without staff | ≥ 50% | Agentforce session logs / Cases avoided |
| **Onboarding NPS / CSAT** | Short pulse at Walk-ready | ≥ 8/10 | Case/Survey on exit |

### 4.4 Anti-patterns to avoid

- **Portal as a document dump.** It is a *guided* experience (next action first), not a file share.
- **Over-automation of relationships.** The Concierge nudges and answers; it does not replace the founder's
  governance cadence. Escalation to a human is a feature, not a failure.
- **Storing large client data in Salesforce Files** (blows the Dev-Edition file cap) — link instead.
- **Gates as rubber stamps.** Exit criteria must be specific and evidenced (linked deliverables), or the
  governance signal is worthless.

---

## 5. Salesforce-native architecture

### 5.1 Org & licensing baseline

| Element | Choice | Why / limit |
|---|---|---|
| Org type (MVP/Pilot) | **Agentforce + Data Cloud Developer Edition** | Primary free, non-expiring org for *live* Agentforce; bundles Data Cloud. See Appendix 9.5 for verified limits. |
| Agentforce generations | **150 LLM generations/hour** (Dev Edition) | Verified. Design agents for bounded, on-demand use — not background bulk generation. |
| Data Cloud storage | **~10 GB** *(unconfirmed — verify)* | Data Cloud has its own Dev-Edition limits; the exact figure is unconfirmed and easily conflated with the standard 10 GB Salesforce data-storage baseline. Verify on the live limits page (Appendix 9.5). |
| Salesforce data / file storage | **~5 MB data / ~20 MB file** in Dev Edition | Large docs external (Box/Drive/S3) + link; only small PDFs as Files. |
| Scheduling | **Cal.com** (`rami-alcheikh/strategy-call`) | Salesforce Scheduler not in Dev Edition. Webhook → `Milestone__c`. |
| Email | **Resend** via Flow HTTP Callout | Reuses brand-domain deliverability (`worker.ts` pattern). |
| External (client) users | ~**10 Experience Cloud users** | Customer Community license; sharing scoped per engagement. |
| Internal users | **2 internal licenses** | Founder + delivery lead during MVP/pilot. |

> **Honesty note.** Exact Developer-Edition numeric limits are vendor-set and shift between releases.
> Appendix 9.5 carries the verified figures and citations as of this writing; the architecture is designed
> to be *limit-tolerant* (external storage, bounded agent calls, small user count) so that a tightening of
> any single cap does not break the model.

### 5.2 Data model

#### 5.2.1 Standard objects (the spine)

| Object | Role in onboarding |
|---|---|
| **Account** | The client company. Industry, region (UAE/KSA/Egypt), tier. |
| **Contact** | Client people. Sponsors, project leads, data/IT owners, legal. |
| **Opportunity** | The sold engagement. **`StageName = Closed Won`** is the trigger. Custom `Tier__c = Crawl`, plus value/close date. |
| **Case** | Client help requests raised from the portal; backstop for the Concierge. |

#### 5.2.2 Custom layer (the engagement system)

```
Account ─┬─ Contact (1:*)
         │
         └─ Opportunity (Closed-Won, Tier=Crawl)
                  │ 1:1 (provisions)
                  ▼
            Engagement__c ──────────────────────────────────────────┐
              ├─ Phase__c (Crawl)                                     │
              │     └─ PhaseGate__c (entry, exit)                     │
              ├─ Milestone__c (kickoff + 3–4 discovery sessions)      │
              ├─ Deliverable__c (diagnostic, ROAI baseline, roadmap)  │
              ├─ ChecklistItem__c (docs / data / access)              │
              ├─ Stakeholder__c (junction → Contact, with RACI)       │
              ├─ ROAIBaseline__c (baseline metrics)                   │
              └─ HandoffRecord__c (sales→delivery snapshot)           │
                                                                      │
            Case (portal help requests) ──────────────────────── lookup
```

**Object-by-object field design** (key fields; not exhaustive — the build will add audit/system fields):

**`Engagement__c`** — master record, one per won Crawl deal.
| Field | Type | Notes |
|---|---|---|
| `Name` | Auto Number / Text | e.g. `ENG-0001` |
| `Account__c` | Lookup(Account) | Client |
| `Opportunity__c` | Lookup(Opportunity) | Source deal |
| `Owner` | User | Accountable Emerge lead (the "one throat to choke") |
| `Stage__c` | Picklist | Orchestrator stage (1–8, see 5.3) |
| `Tier__c` | Picklist | Crawl / Walk / Run (Crawl in scope) |
| `Closed_Won_Date__c` | Date | TTV / cycle-time anchor |
| `Target_Walk_Ready_Date__c` | Formula/Date | Closed-Won + 8 wk SLA |
| `Health__c` | Picklist | On track / At risk / Blocked |
| `Checklist_Completion__c` | Roll-up % | Approved ÷ required `ChecklistItem__c` |
| `Portal_Provisioned__c` | Checkbox | External access granted |

**`Phase__c`** — one per phase of the engagement; only Crawl in scope.
| Field | Type | Notes |
|---|---|---|
| `Engagement__c` | Master-Detail | Parent |
| `Type__c` | Picklist | Crawl / Walk / Run |
| `Status__c` | Picklist | Not started / In progress / In gate review / Complete |
| `Start_Date__c`, `End_Date__c` | Date | |

**`PhaseGate__c`** — entry and exit gates for a phase, with explicit criteria.
| Field | Type | Notes |
|---|---|---|
| `Phase__c` | Master-Detail | Parent |
| `Gate_Type__c` | Picklist | Entry / Exit |
| `Criteria__c` | Long Text | Bulleted entry/exit criteria |
| `Status__c` | Picklist | Open / In review / Passed / Failed |
| `Submitted_Date__c`, `Decision_Date__c` | Date | Gate cycle-time metric |
| `Decision_By__c` | Lookup(User) | Approver |
| `Evidence__c` | Text/URL | Linked deliverables proving criteria met |

**`Milestone__c`** — dated sessions/events; **created by the Cal.com webhook** and by the Orchestrator.
| Field | Type | Notes |
|---|---|---|
| `Engagement__c` | Master-Detail | Parent |
| `Type__c` | Picklist | Kickoff / Discovery / Gate review / Other |
| `Scheduled_Date__c` | DateTime | From Cal.com booking |
| `Actual_Date__c` | DateTime | Held timestamp (TTV) |
| `Status__c` | Picklist | Scheduled / Held / No-show / Rescheduled |
| `Cal_Booking_Id__c` | Text (External Id) | Idempotency key for webhook upserts |
| `Attendees__c` | Text/Long Text | Captured from booking payload |

**`Deliverable__c`** — client-visible outputs of the Crawl.
| Field | Type | Notes |
|---|---|---|
| `Engagement__c` | Master-Detail | Parent |
| `Type__c` | Picklist | Diagnostic / ROAI baseline / Roadmap / Other |
| `Status__c` | Picklist | Draft / In review / Delivered |
| `Client_Visible__c` | Checkbox | Gates portal visibility |
| `Storage_Link__c` | URL | External (Box/Drive/S3) for large files |
| `File__c` | (Salesforce Files) | Only small PDFs |
| `Delivered_Date__c` | Date | |

**`ChecklistItem__c`** — the doc/data/access collection items; the chase loop runs on `Status__c`.
| Field | Type | Notes |
|---|---|---|
| `Engagement__c` | Master-Detail | Parent |
| `Category__c` | Picklist | Document / Data / Access |
| `Title__c` | Text | e.g. "Customer data dictionary" |
| `Status__c` | Picklist | **Not started / Requested / Received / Approved** (drives chase loop) |
| `Required__c` | Checkbox | Counts toward completion % |
| `Owner_Contact__c` | Lookup(Contact) | Client-side responsible person |
| `Due_Date__c` | Date | |
| `Requested_Date__c`, `Received_Date__c`, `Approved_Date__c` | Date | Chase-latency metric |
| `Upload__c` | Files (small) / `Link__c` URL (large) | Per Dev-Edition storage rule |
| `Help_Text__c` | Long Text | Inline guidance shown in portal |

**`Stakeholder__c`** — junction between `Engagement__c` and `Contact`, carrying RACI.
| Field | Type | Notes |
|---|---|---|
| `Engagement__c` | Master-Detail | Parent |
| `Contact__c` | Lookup(Contact) | The person |
| `Role__c` | Picklist | Sponsor / Project lead / Data-IT owner / Legal / Other |
| `RACI__c` | Picklist (multi) | Responsible / Accountable / Consulted / Informed |
| `Confirmed__c` | Checkbox | Client confirmed via portal |
| `Workstream__c` | Picklist | CX / Data / AI / Cross |

**`ROAIBaseline__c`** — baseline metrics for Return-on-AI, captured during Crawl.
| Field | Type | Notes |
|---|---|---|
| `Engagement__c` | Master-Detail | Parent |
| `Metric__c` | Picklist/Text | e.g. NPS, cross-sell rate, AHT, cost-to-serve |
| `Baseline_Value__c` | Number | Current "before" |
| `Unit__c` | Text | %, AED, count, score |
| `Target_Value__c` | Number | Walk-phase target hypothesis |
| `Source__c` | Text | Where the number came from |
| `As_Of_Date__c` | Date | Measurement date |

**`HandoffRecord__c`** — the structured sales→delivery handoff snapshot.
| Field | Type | Notes |
|---|---|---|
| `Engagement__c` | Master-Detail | Parent |
| `Scope_Summary__c` | Long Text | What was sold |
| `Commercials__c` | Long Text | Value, terms, invoicing notes |
| `Promises_Made__c` | Long Text | Commitments made during the sale |
| `Known_Risks__c` | Long Text | Red flags handed over |
| `Primary_Contacts__c` | Long Text/related | Who's who at signing |
| `Sales_Owner__c`, `Delivery_Owner__c` | Lookup(User) | From → to |
| `Accepted__c` | Checkbox | Delivery has reviewed & accepted |
| `Accepted_Date__c` | Date | Handoff-completeness metric |

### 5.3 Flow Orchestrator — the 8-stage journey

Flow Orchestrator coordinates multi-step, multi-user work as **stages** containing **steps** (background
or interactive/assigned-to-user). The onboarding journey:

| # | Stage | Trigger / entry | Key automated steps | Human (assigned) steps |
|---|---|---|---|---|
| 1 | **Provision** | Opportunity → Closed-Won (record-triggered) | Create `Engagement__c`, `Phase__c (Crawl)`, entry+exit `PhaseGate__c`, default `ChecklistItem__c` set, stub `HandoffRecord__c` | — |
| 2 | **Handoff** | Engagement created | Notify delivery owner (Resend) | Sales completes `HandoffRecord__c`; delivery reviews & sets `Accepted__c` |
| 3 | **Welcome & access** | Handoff accepted | Provision portal user(s); Concierge sends welcome (Resend) | Delivery confirms stakeholder list |
| 4 | **Kickoff scheduling** | Welcome sent | Send Cal.com kickoff link (Resend); await webhook → `Milestone__c (Kickoff)` | Client books; Emerge confirms |
| 5 | **Kickoff held** | Kickoff `Milestone__c.Status = Held` | Set governance cadence; open discovery scheduling | Founder runs kickoff; logs cadence |
| 6 | **Discovery & collection** *(parallel)* | After kickoff | Send 3–4 discovery Cal.com links; run **chase loop** on `ChecklistItem__c` (nudge `Requested`→overdue via Resend + Concierge) | Delivery runs discovery; client uploads/links; delivery approves items |
| 7 | **Stakeholder & baseline** | Discovery underway | Request RACI confirmation in portal; prompt `ROAIBaseline__c` capture | Client confirms `Stakeholder__c`; delivery records baseline + drafts `Deliverable__c` |
| 8 | **Crawl exit gate → Walk-ready** | All required items Approved + deliverables Delivered | Compile evidence; submit exit `PhaseGate__c` | Founder reviews gate; decision recorded; engagement marked **Walk-ready** |

**The chase loop (stage 6 detail).** A scheduled/record-triggered Flow evaluates `ChecklistItem__c` where
`Status__c IN (Not started, Requested)` and `Due_Date__c` approaching/overdue:
1. `Not started` + stage reached → set `Requested`, stamp `Requested_Date__c`, send request (Resend) + portal task.
2. `Requested` + N days before due → polite reminder (Concierge nudge).
3. `Requested` + overdue → escalate: notify `Owner_Contact__c` and Emerge `Owner`; raise engagement `Health__c = At risk`.
4. `Received` → notify delivery to review; on review set `Approved` (stamp `Approved_Date__c`).
Idempotent and bounded — reminders capped per item to respect Agentforce/email limits.

### 5.4 Agentforce — two agents

| Agent | Audience | Surface | Purpose | Grounding |
|---|---|---|---|---|
| **Delivery Copilot** | Internal (Emerge delivery team) | Salesforce app / Agentforce panel | "What's blocked on ENG-0003? Draft the chase email. Summarize handoff. What's left before the gate?" | Engagement layer records + playbook knowledge |
| **Onboarding Concierge** | Client | Embedded in the portal | "What do you still need from me? How do I upload the data dictionary? When's our next session? Who's our sponsor of record?" | The client's *own* engagement records only (sharing-scoped) + onboarding FAQ |

**Design within the ~150 generations/hour cap:** both agents are *on-demand* (user-initiated), answer from
grounded records (retrieval, not generation-heavy), and the chase-loop nudges are template-driven (Flow +
Resend), **not** per-message LLM generations. The Concierge escalates to a **Case** (and a human) when it
cannot answer — preserving generations and the relationship.

### 5.5 Email — Resend via Flow HTTP Callout

Reuse the marketing site's Resend integration pattern (`worker.ts`): same account, same verified brand
domain (`noreply@site.emergedigital.com`) for deliverability. In Salesforce, a **Flow HTTP Callout** action
calls `POST https://api.resend.com/emails` (Authorization: `Bearer {RESEND_API_KEY}` from a protected
custom setting / named credential). Templated, branded HTML (navy `#0A1F3D` / teal `#00C2C7`, Lexend) — the
same visual language as the contact-form notification email. Used for: handoff notifications, welcome,
Cal.com scheduling links, chase reminders, gate decisions. See Appendix 9.3 for the callout spec.

### 5.6 Scheduling — Cal.com webhook → `Milestone__c`

Salesforce Scheduler is unavailable in Developer Edition, so Cal.com remains the scheduler. Booking links
are sent from Flow (Resend). On `BOOKING_CREATED` / `BOOKING_RESCHEDULED` / `BOOKING_CANCELLED`, Cal.com
posts a webhook to a Salesforce endpoint (Experience/Site Apex REST or a middleware Worker) that
**upserts** `Milestone__c` keyed on `Cal_Booking_Id__c` (external id) and sets `Type__c`/`Scheduled_Date__c`/
`Status__c`. See Appendix 9.4 for the webhook spec. (The existing Cloudflare Worker is the natural place to
verify the Cal.com signature and forward a clean payload, mirroring the `worker.ts` pattern.)

### 5.7 Client portal — Experience Cloud (LWR) information architecture

#### 5.7.1 Platform, template, theme

- **Site type:** Experience Cloud digital experience, **LWR template — "Build Your Own (LWR)"** (Lightning
  Web Runtime) for performance and full Lightning Web Component control. (Lighthouse/perf parity with the
  marketing-site ethos: minimal JS, fast loads.)
- **Theme:** custom LWR theme matching brand tokens — surface navy `#0A1F3D`, deepest ink `#06122A`, accent
  teal `#00C2C7`, hover cyan `#3DDCE3`, light platinum `#E8EEF5`; **Lexend** for UI/body/headings, **Prompt**
  for eyebrows/labels, **JetBrains Mono** for stats. 8px grid; generous whitespace; the same data-flow /
  journey-ribbon motif as the marketing site.
- **Auth & nav:** username/password login with **forgot-password** and a **first-run** (set-password +
  short orientation) flow. Persistent top nav: *Home · Checklist · Documents · Schedule · Stakeholders ·
  ROAI Baseline · Help*. Footer carries the ESR/PDPL compliance note (matching `contact.astro`).
- **Responsive & a11y:** mobile-first responsive; WCAG 2.1 AA — keyboard-reachable controls, visible focus
  states, ordered headings, labelled form fields, sufficient contrast (the teal-on-navy palette is checked
  for contrast; body text uses platinum/white on dark per the site).

#### 5.7.2 External-user sharing model (critical)

- **License:** **Customer Community** for client users (login-based; supports **sharing sets**). ~10 external
  users provisioned.
- **Org-wide defaults:** `Engagement__c` and all children set **Private**.
- **Scoping a client to only their own engagement:** a **sharing set** grants a community user access to
  `Engagement__c` records where the engagement's `Account__c` matches the user's Contact's `Account`
  (Account-based access mapping). Master-detail children (`Phase__c`, `Milestone__c`, `Deliverable__c`,
  `ChecklistItem__c`, `Stakeholder__c`, `ROAIBaseline__c`, `PhaseGate__c`) inherit sharing from
  `Engagement__c`. **Note:** Customer Community is a high-volume license that supports **sharing sets**
  (and share groups) but **not** sharing rules; any lookup-based child needing extra access uses Apex
  managed sharing — or we keep those children master-detail so they inherit. (If owner/criteria-based
  sharing rules become necessary, that implies upgrading to **Customer Community Plus**.) **Net effect:** a
  client logs in and sees *only* their own `Engagement__c` and its children — never another client's.
- **Field-level security** hides internal-only fields (`HandoffRecord__c`, commercials, internal health
  notes) from the community profile entirely.
- Deliverables appear in the portal only when `Client_Visible__c = true`.

#### 5.7.3 Page-by-page IA

For each page: the **LWR/Lightning components** used and the **exact object + fields** they bind to.

**1. Home / Dashboard** — *Where are we? What's next?*
- Components: progress ring (custom LWC), Crawl timeline with gate markers (custom LWC), "Next action" card,
  Concierge launcher (embedded Agentforce).
- Binds: `Engagement__c` (`Stage__c`, `Checklist_Completion__c`, `Health__c`, `Target_Walk_Ready_Date__c`);
  `Milestone__c` (timeline, next dated event); `PhaseGate__c` (entry/exit markers); next outstanding
  `ChecklistItem__c` (next action).

**2. Checklist** — the chase loop, client side.
- Components: grouped list (Document/Data/Access) with **status badges** (Not started/Requested/Received/
  Approved), due dates, **upload (small) / link (large)** control, inline help text.
- Binds: `ChecklistItem__c` (`Category__c`, `Title__c`, `Status__c`, `Due_Date__c`, `Help_Text__c`,
  `Upload__c`/`Link__c`, `Owner_Contact__c`).

**3. Documents / Deliverables** — client-visible outputs.
- Components: deliverable cards with type, status, download/open.
- Binds: `Deliverable__c` where `Client_Visible__c = true` (`Type__c`, `Status__c`, `Storage_Link__c`/
  `File__c`, `Delivered_Date__c`).

**4. Schedule** — sessions.
- Components: **embedded Cal.com** booking widget (`rami-alcheikh/strategy-call` and discovery event types)
  + upcoming/past sessions list.
- Binds: `Milestone__c` (`Type__c`, `Scheduled_Date__c`, `Actual_Date__c`, `Status__c`). New bookings flow
  back via the Cal.com webhook (5.6).

**5. Stakeholders** — confirm/edit + RACI.
- Components: stakeholder cards with role + RACI badges; **confirm/edit** action; RACI matrix view.
- Binds: `Stakeholder__c` (`Contact__c`, `Role__c`, `RACI__c`, `Confirmed__c`, `Workstream__c`).

**6. ROAI Baseline** — the "before" picture.
- Components: metric cards + charts (LWC chart bound to records).
- Binds: `ROAIBaseline__c` (`Metric__c`, `Baseline_Value__c`, `Unit__c`, `Target_Value__c`, `As_Of_Date__c`).

**7. Help / Requests** — Concierge + Cases.
- Components: **embedded Onboarding Concierge** (Agentforce) as primary; "Raise a request" form creating a
  **Case**; list of the client's open/closed Cases.
- Binds: `Case` (subject, description, status), scoped to the client's Account/Contact. Concierge grounded
  on the client's own engagement records.

> **Where the Concierge embeds:** persistent launcher on every page (Home dashboard + Help page primary
> surfaces). It reads the same sharing-scoped records the pages show, so its answers never cross clients.

---

## 6. Measurement

### 6.1 Instrumentation

Every KPI in 4.3 maps to a field or roll-up already in the data model — measurement is a *byproduct* of the
design, not a bolt-on. Date stamps (`Requested_Date__c`, `Received_Date__c`, `Decision_Date__c`, etc.) are
set by Flow at status transitions so cycle-time metrics are computed, not hand-entered.

### 6.2 Reporting

- **Internal:** Salesforce reports/dashboards — onboarding funnel (engagements by `Stage__c`), checklist
  completion and chase latency, gate cycle time, TTV distribution, health (`At risk`/`Blocked`) watchlist.
- **Client (portal):** the Home dashboard *is* the client-facing report — progress %, timeline, next action.
- **Data Cloud (optional, MVP-light):** engagement events can be ingested for cross-engagement analytics and
  to seed the ROAI story; kept within the ~10 GB Dev-Edition cap (aggregate/event data, not raw datasets).

### 6.3 Review cadence

- Weekly internal onboarding stand-up driven by the "At risk/Blocked" dashboard + Delivery Copilot summary.
- Per-engagement governance cadence set at kickoff (the local-prime promise) and logged on `Milestone__c`.
- Gate reviews logged on `PhaseGate__c` with evidence links.

---

## 7. Phased rollout

| Phase | Goal | Org | Scope | Exit criteria |
|---|---|---|---|---|
| **A. Showcase MVP** | A demoable onboarding running on a **seeded fictitious client** | Agentforce + Data Cloud **Dev Edition** | Full data model, 8-stage Orchestrator, both agents (bounded), portal, Cal.com + Resend wired, **Section 10 dataset loaded** | Founder can run a live prospect demo end-to-end against the seeded client |
| **B. Pilot** | First **real** client through the motion | Dev Edition (or early Enterprise) | Same, with real data — **gated on the UAE/KSA Gov/BFSI data-residency decision** (Section 8) | One real Crawl run start→Walk-ready; KPIs captured; client CSAT ≥ 8 |
| **C. Productionize** | Repeatable, licensed, scaled | **Enterprise org** | Proper licensing, hardened sharing/security, **Vela** integration for ROAI analytics, multi-engagement | Multiple concurrent engagements; SLA-backed; demo + production parity |

**Why this order:** the Showcase MVP de-risks the build *and* immediately produces sales value (the demo)
before any real client data — and before we must resolve data residency. The dogfooding payoff is front-loaded.

**Throughout:** this onboarding system is the **dogfooding reference** Emerge demos to prospects. Every phase
keeps the seeded demo client healthy and demoable, even after real clients arrive (the demo runs on its own
fictitious Account, fully sharing-isolated from real engagements).

---

## 8. Risks & open decisions

### 8.1 Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| **Data residency** — UAE/KSA Gov/BFSI may require in-region storage; Dev Edition/Data Cloud region is fixed | High | High (blocks real Gov/BFSI pilot) | **Gate the Pilot** on the residency decision; Showcase MVP uses only fictitious data; plan Enterprise/Hyperforce region at Productionize |
| Dev-Edition Agentforce generation cap (~150/hr) exceeded in a busy demo | Med | Med | On-demand, grounded agents; template (non-LLM) nudges; cap reminders |
| Dev-Edition file storage too small for client docs | High | Med | External storage + link by design; only small PDFs as Files |
| Cal.com ↔ Salesforce webhook drift (missed/duplicate bookings) | Med | Med | Idempotent upsert on `Cal_Booking_Id__c`; signature verification in Worker; reconciliation job |
| Resend deliverability / domain reputation | Low | Med | Reuse the already-verified brand domain and SPF/DKIM/DMARC from the marketing setup |
| External sharing misconfiguration leaks cross-client data | Low | **Critical** | Private OWD + sharing sets + FLS; explicit test: log in as Client A, confirm zero visibility of Client B; security review before Pilot |
| Over-reliance on the Concierge erodes the founder-led relationship | Med | Med | Concierge nudges/answers only; escalation-to-human by design; governance cadence stays human |
| Productionize licensing cost surprises | Med | Med | Cost model before Phase C; map Dev→Enterprise migration of metadata + data |

### 8.2 Open decisions (need Rami)

1. **Data residency posture** for the first real Gov/BFSI pilot — does the target client mandate in-region
   storage, and does that force an Enterprise/Hyperforce region *before* Pilot? **(Blocks Phase B.)**
2. **External storage choice** — Box vs Google Drive vs S3 for large documents (auth model, client trust,
   PDPL alignment).
3. **Cal.com event-type taxonomy** — one shared event type vs per-workstream discovery event types (affects
   `Milestone__c.Type__c` mapping).
4. **Concierge scope** — answers-only at MVP, or allowed to take actions (e.g., mark an item Received) at
   Pilot?
5. **Vela integration depth** at Productionize — does ROAI baseline data flow into Vela, and is the demo
   client aligned to existing Vela demo accounts?
6. **Internal license allocation** beyond the 2 MVP seats as the delivery team grows.

---

## 9. Appendix

### 9.1 SFDX metadata layout (proposed)

Salesforce DX source-format project. No source is shipped in this blueprint; this is the target layout the
build will populate.

```
emerge-onboarding-sfdx/
├── sfdx-project.json
├── config/
│   └── project-scratch-def.json          # (Dev Edition is the working org; scratch optional)
├── manifest/
│   └── package.xml
├── data/                                  # SFDX data tree (Section 10 dataset)
│   ├── plan.json                          # load order: Account→Contact→Opportunity→Engagement→children
│   ├── accounts.json
│   ├── contacts.json
│   ├── opportunities.json
│   ├── engagements.json
│   ├── phases.json
│   ├── phasegates.json
│   ├── milestones.json
│   ├── deliverables.json
│   ├── checklistitems.json
│   ├── stakeholders.json
│   ├── roaibaselines.json
│   └── handoffrecords.json
└── force-app/main/default/
    ├── objects/                           # Engagement__c, Phase__c, PhaseGate__c, Milestone__c,
    │                                      #   Deliverable__c, ChecklistItem__c, Stakeholder__c,
    │                                      #   ROAIBaseline__c, HandoffRecord__c (+ fields, listviews)
    ├── flows/                             # 8-stage Orchestrator + chase-loop + record-triggered flows
    ├── flowDefinitions/
    ├── classes/                           # Apex REST for Cal.com webhook; sharing helpers; tests
    ├── namedCredentials/                  # Resend, Cal.com
    ├── customMetadata/ | settings/        # API keys via protected custom metadata/settings
    ├── permissionsets/                    # Delivery (internal), Concierge service, Community access
    ├── sharingRules/                      # Engagement + children external sharing
    ├── genAiPlanners/ genAiPlugins/       # Agentforce: Delivery Copilot + Onboarding Concierge
    ├── bots/ | botVersions/              # Agent configuration
    ├── digitalExperiences/               # Experience Cloud LWR site (pages, theme, nav)
    ├── lwc/                               # portal components (progress ring, timeline, checklist, charts)
    └── staticresources/                   # brand tokens, fonts, journey-ribbon motif
```

**Load method:** `sf project deploy start` for metadata, then `sf data tree import --plan data/plan.json`
for the seeded dataset (Section 10). The plan file enforces parent-before-child order and resolves
relationships via reference ids.

### 9.2 Standard → custom field mapping from existing intake

Reuse the contact-form intake (`src/pages/contact.astro` → `worker.ts`) so nothing is re-asked post-sale:

| Intake field (contact form) | Lands on |
|---|---|
| `full-name` | Contact (sponsor/primary) Name |
| `company` | Account Name |
| `email` | Contact Email |
| `role` | Contact Title |
| `country` | Account `Region__c` / BillingCountry |
| `industry` | Account `Industry` |
| `reason` (situation) | Opportunity context / `HandoffRecord__c.Scope_Summary__c` |
| `brief` | `HandoffRecord__c.Scope_Summary__c` (seed) |
| `followup` | Contact preferred-channel |

### 9.3 Resend callout spec (Flow HTTP Callout)

Mirrors the `worker.ts` Resend integration.

```
POST https://api.resend.com/emails
Authorization: Bearer {!$Credential.Resend.API_Key}     // protected; never hardcoded
Content-Type: application/json

{
  "from": "Emerge Digital <noreply@site.emergedigital.com>",
  "to": ["{!recipientEmail}"],
  "reply_to": "rami@emergedigital.com",
  "subject": "{!subject}",
  "html": "{!brandedHtmlBody}",     // navy/teal, Lexend — same template family as contact email
  "text": "{!plainTextBody}"
}
```
- **Auth:** Named Credential / protected custom metadata — no secret in Flow or source (mirrors the
  Worker's env-var discipline).
- **Triggers:** handoff notify, welcome, kickoff/discovery scheduling links, chase reminders, gate decision.
- **Deliverability:** reuse the verified brand domain + SPF/DKIM/DMARC already set for the marketing site.
- **Error handling:** non-2xx → Flow fault path logs and retries with backoff; persistent failure raises an
  internal task (don't silently drop a client email).

### 9.4 Cal.com webhook spec (→ `Milestone__c`)

```
Event source: Cal.com (event type: rami-alcheikh/strategy-call + discovery event types)
Triggers:     BOOKING_CREATED, BOOKING_RESCHEDULED, BOOKING_CANCELLED
Transport:    Cal.com webhook  → (Cloudflare Worker: verify HMAC signature, normalize)
              → Salesforce Apex REST  /services/apexrest/calcom/booking
Auth:         shared secret / signed payload (verified in the Worker, mirroring worker.ts)
```
Upsert logic (idempotent):
```
key   = payload.uid            → Milestone__c.Cal_Booking_Id__c (External Id)
match Engagement__c via attendee email → Contact → Account → Engagement__c
set   Type__c          = map(eventTypeSlug)         // kickoff | discovery
      Scheduled_Date__c = payload.startTime
      Status__c        = CREATED→Scheduled | RESCHEDULED→Rescheduled | CANCELLED→Cancelled
      Attendees__c     = payload.attendees[*].email
```
- **Idempotency:** upsert on `Cal_Booking_Id__c` so retries/duplicates don't create duplicate milestones.
- **Held status:** `Actual_Date__c`/`Status = Held` set after the session (manual or calendar-completion).
- **Reconciliation:** periodic job compares Cal.com bookings vs `Milestone__c` to catch missed webhooks.

### 9.5 Salesforce facts — verification & sources

> Developer-Edition limits are vendor-set and change between releases. Verified against Salesforce
> documentation as of June 2026; the architecture is designed to tolerate tightening of any single cap.
> Verdicts: ✅ verified · ⚠️ partially true / needs precision · ❓ unconfirmed.

| # | Claim | Verdict | Notes |
|---|---|---|---|
| 1 | Agentforce + Data Cloud Developer Edition; 150 LLM gen/hr; ~10 GB Data Cloud | ⚠️ | **150 LLM generations/hour ✅ verified.** It's a free, *non-expiring* full-featured org ✅ — but **not the literal "only" free path** (product-specific trials and scratch/sandbox orgs also exist); reworded to "primary free org." **10 GB Data Cloud ❓ unconfirmed** — Data Cloud (Data 360) has its own DE limits; figure is easily conflated with the standard 10 GB Salesforce data-storage baseline. *Verify on the live page before quoting a number.* |
| 2 | Salesforce Scheduler not in Developer Edition → keep Cal.com | ✅ | Scheduler needs Enterprise/Unlimited + a base license; not in standard DE. (A dedicated Scheduler trial org exists for evaluation, but not in our generic DE org.) Cal.com is the right substitute. |
| 3 | DE file/data storage small → external for large docs | ⚠️ | **File storage ~20 MB ✅.** **Data storage ~5 MB** (not 20). Large docs external + link is correct. Confirm exact bytes for the Agentforce/Data Cloud DE if the design depends on them. |
| 4 | Customer Community + sharing sets scope external users to their own account's records | ✅ | Customer Community (high-volume) supports **sharing sets** (+ share groups), **not** sharing rules. Sharing rules / roles require **Customer Community Plus**. Sharing-set mechanism (access to records related to the user's Account/Contact) is correct. |
| 5 | Flow Orchestrator — multi-stage/multi-user (stages + steps) | ✅ | Flow Orchestration provides Stages (sequential groups) and Steps (assigned to users/queues, sequential or parallel). |
| 6 | Flow HTTP Callout to external REST APIs (Resend) | ✅ | Declarative HTTP Callout action; auth via Named Credentials. Caveat: callouts can't follow DML in the same transaction without an async path — standard Flow callout governor rules apply. |
| 7 | Experience Cloud "Build Your Own (LWR)" supports custom theming + LWC | ✅ | LWR (Lightning Web Runtime), LWC-only (no Aura), modern/performant. Theming via theme-layout components + scoped per-component CSS (no legacy Aura sitewide CSS editor). |
| 8 | Agentforce supports internal/employee and customer-facing agents | ✅ | Internal/employee agents (Slack, internal tooling) and customer-facing Service Agents deployable to Experience Cloud / messaging / web / WhatsApp / email. |

**Citations**
- Agentforce & Data Cloud Developer Edition (150 gen/hr): https://help.salesforce.com/s/articleView?id=xcloud.overview_developer_edition_agentforce_datacloud.htm — and https://developer.salesforce.com/blogs/2025/03/introducing-the-new-salesforce-developer-edition-now-with-agentforce-and-data-cloud
- Data Cloud (Data 360) DE limits (verify storage): https://help.salesforce.com/s/articleView?id=data.c360_a_limits_and_guidelines_dev_ed.htm
- DE storage allocations: https://help.salesforce.com/s/articleView?id=xcloud.overview_limits_developer.htm
- Salesforce Scheduler licensing/editions: https://help.salesforce.com/s/articleView?id=platform.ls_licenses_for_salesforce_scheduler.htm
- Sharing sets concept: https://help.salesforce.com/s/articleView?id=sf.sharing_sets.htm — Experience Cloud sharing deep-dive: https://www.salesforceben.com/salesforce-experience-cloud-sharing-model-a-deep-dive-for-admins/
- Flow Orchestrator: https://admin.salesforce.com/blog/2021/introducing-flow-orchestrator-unify-your-complex-business-processes-without-code
- Flow HTTP Callout: https://help.salesforce.com/s/articleView?id=platform.flow_http_callout.htm
- LWR template overview: https://developer.salesforce.com/docs/atlas.en-us.exp_cloud_lwr.meta/exp_cloud_lwr/template_overview.htm
- Agentforce employee agents: https://trailhead.salesforce.com/content/learn/modules/agentforce-for-employees-quick-look/get-started-with-agentforce-for-employees — Service Agents on Experience Cloud: https://www.salesforceben.com/agentforce-and-experience-cloud-how-to-leverage-ai-to-improve-customer-service/

---

## 10. Seeded fictitious demo dataset

> **⚠️ FICTITIOUS DATA — FOR DEMONSTRATION ONLY.** Every name, number, email, and metric below is invented
> for the Showcase MVP. No real client, person, or contract is represented. Emails use the reserved
> `example.com` domain. Load via SFDX data tree (`sf data tree import --plan data/plan.json`).

Two demo clients:
- **Primary (fully detailed):** *Saned Bank* — fictitious Tier-1 UAE & KSA retail bank (BFSI), aligned to the
  brand's sample BFSI case study (CDP / real-time CX). Closed-Won Crawl with mixed-status checklist so the
  chase loop is visible in a demo.
- **Secondary (lighter):** *Najd Retail Group* — fictitious KSA retail group, minimal records to show
  multi-engagement and sharing isolation.

### 10.1 Account

| Name | Industry | Region__c | Tier | Notes |
|---|---|---|---|---|
| Saned Bank *(fictitious)* | BFSI | UAE & KSA | Enterprise | Tier-1 retail bank; CDP/CX diagnostic |
| Najd Retail Group *(fictitious)* | Retail | KSA | Enterprise | Secondary demo; lighter dataset |

### 10.2 Contact (Saned Bank — 5; Najd Retail — 2)

| Account | Name | Title | Role (Stakeholder) | Email *(fictitious)* |
|---|---|---|---|---|
| Saned Bank | Layla Al-Mansoori | Chief Customer Officer | Sponsor | layla.almansoori@example.com |
| Saned Bank | Omar Haddad | Head of CX Transformation | Project lead | omar.haddad@example.com |
| Saned Bank | Fatima Noor | Chief Data Officer | Data/IT owner | fatima.noor@example.com |
| Saned Bank | Khalid Rahman | Head of IT Security | Data/IT owner (access) | khalid.rahman@example.com |
| Saned Bank | Mariam Saleh | General Counsel | Legal | mariam.saleh@example.com |
| Najd Retail | Yousef Al-Qahtani | VP Customer & Digital | Sponsor | yousef.alqahtani@example.com |
| Najd Retail | Sara Bint Faisal | Data Platform Lead | Data/IT owner | sara.faisal@example.com |

### 10.3 Opportunity (Closed-Won, Tier = Crawl)

| Name | Account | StageName | Tier__c | Amount | CloseDate |
|---|---|---|---|---|---|
| Saned Bank — Crawl Diagnostic | Saned Bank | Closed Won | Crawl | AED 280,000 | 2026-06-01 |
| Najd Retail — Crawl Diagnostic | Najd Retail Group | Closed Won | Crawl | SAR 240,000 | 2026-06-08 |

### 10.4 Engagement__c

| Name | Account | Stage__c | Tier | Closed_Won_Date__c | Target_Walk_Ready_Date__c | Health__c |
|---|---|---|---|---|---|---|
| ENG-0001 | Saned Bank | 6 — Discovery & collection | Crawl | 2026-06-01 | 2026-07-27 | At risk |
| ENG-0002 | Najd Retail Group | 4 — Kickoff scheduling | Crawl | 2026-06-08 | 2026-08-03 | On track |

### 10.5 Phase__c (Crawl)

| Engagement | Type__c | Status__c | Start_Date__c | End_Date__c |
|---|---|---|---|---|
| ENG-0001 | Crawl | In progress | 2026-06-02 | 2026-07-27 |
| ENG-0002 | Crawl | In progress | 2026-06-09 | 2026-08-03 |

### 10.6 PhaseGate__c (entry + exit, ENG-0001 detailed)

| Engagement/Phase | Gate_Type__c | Status__c | Criteria__c | Submitted | Decision |
|---|---|---|---|---|---|
| ENG-0001 / Crawl | Entry | Passed | Handoff accepted; sponsor confirmed; kickoff scheduled | 2026-06-02 | 2026-06-03 |
| ENG-0001 / Crawl | Exit | In review | All required docs Approved; ROAI baseline captured; diagnostic + roadmap Delivered; stakeholder RACI confirmed | 2026-07-20 | — |
| ENG-0002 / Crawl | Entry | Passed | Handoff accepted; sponsor confirmed | 2026-06-09 | 2026-06-10 |
| ENG-0002 / Crawl | Exit | Open | (same exit criteria template) | — | — |

### 10.7 Milestone__c (kickoff + 3–4 discovery, dated)

| Engagement | Type__c | Scheduled_Date__c | Status__c | Cal_Booking_Id__c |
|---|---|---|---|---|
| ENG-0001 | Kickoff | 2026-06-05 10:00 GST | Held | cal_demo_0001 |
| ENG-0001 | Discovery — CX | 2026-06-12 11:00 GST | Held | cal_demo_0002 |
| ENG-0001 | Discovery — Data | 2026-06-18 11:00 GST | Held | cal_demo_0003 |
| ENG-0001 | Discovery — AI/Agentforce | 2026-06-25 11:00 GST | Scheduled | cal_demo_0004 |
| ENG-0001 | Discovery — Governance | 2026-07-02 11:00 GST | Scheduled | cal_demo_0005 |
| ENG-0002 | Kickoff | 2026-06-15 13:00 GST | Scheduled | cal_demo_0006 |

### 10.8 Deliverable__c

| Engagement | Type__c | Status__c | Client_Visible__c | Delivered_Date__c |
|---|---|---|---|---|
| ENG-0001 | Diagnostic | In review | true | — |
| ENG-0001 | ROAI baseline | Delivered | true | 2026-06-26 |
| ENG-0001 | Roadmap | Draft | false | — |
| ENG-0002 | Diagnostic | Draft | false | — |

### 10.9 ChecklistItem__c (ENG-0001 — MIXED statuses → chase loop visible)

| Category__c | Title__c | Status__c | Required__c | Owner_Contact | Due_Date__c |
|---|---|---|---|---|---|
| Document | Org chart & CX operating model | Approved | true | Omar Haddad | 2026-06-10 |
| Document | Current-state CX journey maps | Received | true | Omar Haddad | 2026-06-14 |
| Data | Customer data dictionary | Requested | true | Fatima Noor | 2026-06-20 |
| Data | 12-month NPS & complaints extract | Requested | true | Fatima Noor | 2026-06-22 |
| Data | Campaign performance export (12 mo) | Not started | true | Fatima Noor | 2026-06-28 |
| Access | Read access to CDP/sandbox | Requested | true | Khalid Rahman | 2026-06-18 |
| Access | Analytics workspace (view) | Received | false | Khalid Rahman | 2026-06-21 |
| Document | Data-processing / PDPL agreement | Requested | true | Mariam Saleh | 2026-06-24 |

*(Najd Retail / ENG-0002: a lighter set — 3 items, mostly `Not started`/`Requested` — to keep the second
demo client minimal.)*

### 10.10 Stakeholder__c (RACI, ENG-0001)

| Contact | Role__c | RACI__c | Confirmed__c | Workstream__c |
|---|---|---|---|---|
| Layla Al-Mansoori | Sponsor | Accountable | true | Cross |
| Omar Haddad | Project lead | Responsible | true | CX |
| Fatima Noor | Data/IT owner | Responsible | false | Data |
| Khalid Rahman | Data/IT owner | Consulted | false | Data |
| Mariam Saleh | Legal | Consulted | false | Cross |

*(ENG-0002: Yousef Al-Qahtani = Sponsor/Accountable (confirmed); Sara Bint Faisal = Data owner/Responsible.)*

### 10.11 ROAIBaseline__c (ENG-0001)

| Metric__c | Baseline_Value__c | Unit__c | Target_Value__c | As_Of_Date__c |
|---|---|---|---|---|
| Net Promoter Score | 31 | score | 50 | 2026-06-26 |
| Cross-sell conversion | 4.8 | % | 8.0 | 2026-06-26 |
| Avg. handle time (contact center) | 7.4 | minutes | 5.5 | 2026-06-26 |
| Cost to serve (per active customer) | 18.0 | AED/mo | 13.0 | 2026-06-26 |
| Real-time campaign volume | 6 | campaigns/mo | 25 | 2026-06-26 |

### 10.12 HandoffRecord__c (ENG-0001)

| Field | Value *(fictitious)* |
|---|---|
| Scope_Summary__c | 6-week Crawl: CX maturity assessment, customer-data audit across source systems, real-time CDP opportunity sizing, Vision 2030-aligned roadmap. |
| Commercials__c | AED 280,000 fixed-scope; 50/50 milestone billing; local invoicing (Dubai Mainland entity). |
| Promises_Made__c | Founder-led governance cadence (weekly); Walk-ready decision within 8 weeks; PDPL-aligned data handling. |
| Known_Risks__c | Data access dependent on IT-security sign-off; legal review of data-processing terms may slip. |
| Sales_Owner__c → Delivery_Owner__c | Rami (sales) → Rami (delivery lead, MVP) |
| Accepted__c / Accepted_Date__c | true / 2026-06-02 |

### 10.13 Load order (SFDX data tree `plan.json`)

```
1. Account            (accounts.json)
2. Contact            (contacts.json)            → ref Account
3. Opportunity        (opportunities.json)       → ref Account
4. Engagement__c      (engagements.json)         → ref Account, Opportunity
5. Phase__c           (phases.json)              → ref Engagement
6. PhaseGate__c       (phasegates.json)          → ref Phase
7. Milestone__c       (milestones.json)          → ref Engagement
8. Deliverable__c     (deliverables.json)        → ref Engagement
9. ChecklistItem__c   (checklistitems.json)      → ref Engagement, Contact
10. Stakeholder__c    (stakeholders.json)        → ref Engagement, Contact
11. ROAIBaseline__c   (roaibaselines.json)       → ref Engagement
12. HandoffRecord__c  (handoffrecords.json)      → ref Engagement, User
```
Parents load before children; `@ref` ids in the JSON resolve master-detail/lookup relationships. Re-runnable
against a clean Dev/scratch org for repeatable demos.

---

*End of blueprint. This is a research document; implementation is tracked as the ranked backlog below.*

## Ranked implementation backlog

Ranked by value-to-effort for the Showcase MVP (Phase A) first, then Pilot/Productionize.

| # | Item | Phase | Why (value) | Effort |
|---|---|---|---|---|
| 1 | Custom objects + fields (engagement layer, §5.2) | A | Nothing works without the spine | M |
| 2 | Seeded demo dataset + SFDX data tree (§10) | A | Unlocks the dogfooding demo immediately | S |
| 3 | Closed-Won → provision Flow (Orchestrator stage 1) | A | Auto-creates the engagement; core motion | M |
| 4 | Chase-loop Flow on `ChecklistItem__c` (§5.3) | A | The most visible, most valuable automation | M |
| 5 | Resend HTTP Callout action + templates (§9.3) | A | Notifications/nudges across the journey | S |
| 6 | Experience Cloud LWR site + theme + nav/auth (§5.7) | A | The client-facing demo surface | L |
| 7 | External sharing model (Private OWD + sharing sets + FLS) (§5.7.2) | A | **Security-critical**; must pass cross-client isolation test | M |
| 8 | Portal pages: Home, Checklist, Schedule (priority 3) | A | Answers "where/what/next"; chase loop client side | L |
| 9 | Cal.com webhook → `Milestone__c` (§9.4) | A | Scheduling tied to system of record | M |
| 10 | Onboarding Concierge (client agent, grounded, bounded) | A | The headline Agentforce demo | M |
| 11 | Portal pages: Documents, Stakeholders, ROAI Baseline, Help | A | Completes the IA | M |
| 12 | Delivery Copilot (internal agent) | A | Internal Agentforce reference | M |
| 13 | Full 8-stage Orchestrator (handoff→gate) | A | End-to-end governed journey | L |
| 14 | Internal dashboards/reports (KPIs §6) | A | Proves measurement-by-design | S |
| 15 | Data-residency decision + plan | B | **Gates the Pilot** | — (decision) |
| 16 | External storage integration (Box/Drive/S3) | B | Real client large docs | M |
| 17 | Security review (sharing/FLS/secrets) before real data | B | Pre-Pilot gate | M |
| 18 | Enterprise org migration + licensing | C | Scale beyond Dev limits | L |
| 19 | Vela / ROAI analytics integration | C | Connects baseline to the ROAI product story | L |
| 20 | Multi-engagement hardening + SLAs | C | Productionize | L |
