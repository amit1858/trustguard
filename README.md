# TrustGuard — Guardian Agent for Ads Trust & Safety

A working Next.js + TypeScript prototype that demonstrates a serious agentic AI architecture
for Ads Trust & Safety, where a **Guardian Agent** overlays an **Orchestrator Agent** and its
**worker agents**, and governs whether proposed actions are safe, compliant, explainable, and allowed.

> Runtime trust-and-safety control layer for agentic ads workflows.

---

## Product concept

Most agentic ads stacks today look like this:

```
User Request → Orchestrator Agent → Worker Agents → Action
```

That's not safe. Worker agents can be wrong, the orchestrator can be manipulated, and LLM
judgment is not policy enforcement. TrustGuard inserts a **separate Guardian Agent overlay**:

```
User Request → Orchestrator Agent → Worker Agents → Guardian Overlay → Safe Action / Human Review
```

- **Orchestrator Agent** coordinates the work and invokes worker agents.
- **Worker Agents** perform specialized checks (onboarding, creative policy, landing page, compliance, fraud, optimization).
- **Guardian Agent** is a separate overlay. It applies policy and risk controls and can **ALLOW**, **ALLOW_WITH_CONDITIONS**, **RESTRICT**, **ESCALATE**, or **BLOCK**. The orchestrator can propose; only the Guardian can permit.

The Guardian uses a **deterministic policy kernel** for final decisioning. An optional BYOK
AI provider may be used to generate plain-English explanations, but model output never overrides policy.

---

## Architecture

```
app/
  page.tsx              # main control-tower UI
  layout.tsx
  globals.css           # Phase 2B.5 enterprise theme (charcoal + warm amber)
  api/ai/route.ts       # server-side BYOK proxy (does not store/log API keys)
components/             # Header, Architecture strip, ScenarioTabs, OrchestratorPanel,
                        # WorkerFindings, GuardianPanel, ActionsColumns, BYOKPanel,
                        # AuditTrail, WhyItMatters
lib/
  types.ts              # shared types (Guardian decision, worker finding, BYOK config, ...)
  policies.ts           # POL-* policy rules + signal matcher
  scenarios.ts          # 5 mock scenarios with worker findings & orchestrator plans
  orchestratorEngine.ts # builds orchestrator run + audit events
  guardianEngine.ts     # deterministic decision kernel + Guardian output
```

### Worker agents

1. Advertiser Onboarding Agent
2. Creative Policy Agent
3. Landing Page Screening Agent
4. Compliance Agent
5. Fraud & Risk Screening Agent
6. Campaign Optimization Agent

### Guardian output

```ts
{ decision, riskScore, riskLevel, confidence, reasonCodes,
  explanation, allowedActions, blockedActions, humanReviewRequired,
  matchedPolicies, auditTrail }
```

---

## Scenarios

| # | Advertiser | Vertical | Market | Requested action | Outcome |
|---|---|---|---|---|---|
| 1 | Contoso Fitness | Fitness | India | Launch campaign | **ALLOW** |
| 2 | Northstar Credit Advisory | Financial Services | UAE | Launch campaign | **ALLOW_WITH_CONDITIONS** (SCA certification required) |
| 3 | BrightFast Loans | Financial Services | India | Launch campaign | **BLOCK** (misleading claim, weak disclosure, regulated vertical) |
| 4 | QuickWin Media | Lead Generation | United States | Increase budget 4x + expand targeting | **ESCALATE** (linked accounts, abnormal traffic, payment changed) |
| 5 | UrbanHire Jobs | Employment | United States | AI optimizer proposes excluding older ages, narrowing audience | **RESTRICT** (sensitive vertical, fairness/discrimination risk) |

Each scenario produces a different Guardian decision, reason codes, allowed/blocked actions, and audit trail.

---

## BYOK (Bring Your Own Key)

Two modes, selected from the **BYOK control in the top-right of the header**:

- **Demo (deterministic)** — works with no API key. Status pill: *Demo Mode Active*.
- **BYOK (AI-assisted)** — supply provider, API key, and model, then click *Test connection & generate AI explanation*. Status pill: *BYOK Connected* on success, *BYOK Error · falling back to Deterministic* on failure.

> AI assists with explanation and summarization. **Final Guardian decisions are governed by the deterministic policy kernel.** AI cannot change the decision, allowed actions, or blocked actions.

Supported providers:

- Azure OpenAI · OpenAI · Anthropic · Mistral AI · OpenRouter

### Module layout

```
lib/modelProviders.ts   # provider metadata (id, label, default model)
lib/promptTemplates.ts  # SYSTEM_PROMPT + buildPrompt(task, scenario, guardian)
lib/aiClient.ts         # provider adapters (OpenAI / Azure / Anthropic / Mistral / OpenRouter)
app/api/ai/route.ts     # POST /api/ai → { ok, task, text } | { ok:false, error, fallback }
```

The API route accepts `{ provider, apiKey, modelName, task, prompt, ... }` and:

- **never persists** the API key
- **never logs** the API key (server-side errors are scrubbed of the key string)
- **never echoes** the API key back to the client
- on failure, returns `{ ok: false, error, fallback }` so the UI gracefully falls back to deterministic mode

### Deterministic policy kernel

`lib/guardianEngine.ts` evaluates worker-agent signals against `lib/policies.ts` (POL-* rules) and produces the Guardian decision, risk score, reason codes, allowed/blocked actions, and audit trail. This kernel is the **source of truth** for safety decisions. The AI explanation, if present, replaces only the natural-language `explanation` field — it cannot alter any decision field.

---

## Run the prototype

```bash
cd trustguard
npm install      # already installed if scaffolded
npm run dev
```

Open http://localhost:3000.

The app works with **no API key**. Switch to BYOK in the settings panel to try AI-assisted explanations.

---

## Control plane features

Beyond the scenario walkthrough, the prototype includes operator-style surfaces that show how a Guardian Agent would feel in production:

- **Control Plane Metrics** — aggregates across all 6 scenarios: total actions, intercepted (non-ALLOW), human reviews, decision distribution, average risk score, total policies fired. Demonstrates fleet-wide telemetry the Trust & Safety team would expect.
- **Human Review Queue** — clickable cards for every scenario whose Guardian decision is `ESCALATE` or `BLOCK`. Clicking a card switches the dashboard to that scenario so reviewers can drill in.
- **Export Decision JSON** — the Guardian panel exposes an `⬇ Export JSON` button that downloads the full Guardian output (decision, reason codes, allowed/blocked actions, matched policies, audit trail, timestamp) as an audit-ready payload.
- **Presenter Mode** — `Start Demo Walkthrough` in the header runs a 7-step guided tour that scrolls to and pulse-highlights each section, with scenario-specific narration.

---

## Demo flow (suggested for a Trust & Safety product leader)

1. Open the app — read the header, the architecture strip, and the "Why this matters" panel.
2. Click **Clean Launch** → ALLOW. Note that the Orchestrator proposed actions and the Guardian permits them.
3. Click **Missing Certification** → ALLOW_WITH_CONDITIONS. Show the Compliance Agent's failure and how the Guardian translates it into a conditional allow.
4. Click **Misleading Claim** → BLOCK. Show how multiple critical policies (creative, landing page, regulated vertical) compound.
5. Click **Suspicious Budget** → ESCALATE. Point out that **the orchestrator's optimizer proposed the 4x action — the Guardian routed it to a human.**
6. Click **Risky AI Targeting** → RESTRICT. Show that the Guardian doesn't block the campaign — it blocks the *specific* AI action that creates fairness risk.
7. Open the **BYOK** panel. Switch to BYOK mode, paste a key, click *Generate AI explanation*. The model rewrites the explanation; **the decision does not change**.
8. Walk through the **Audit trail** — user → orchestrator → workers → guardian → decision.

---

## Acceptance criteria — status

- ✅ App runs with `npm run dev`
- ✅ Scenario switching works
- ✅ Each scenario produces a different Guardian decision
- ✅ Orchestrator and Guardian are visually and conceptually distinct
- ✅ BYOK UI is present (provider, key, model, mode, tasks)
- ✅ App works without an API key (deterministic demo mode)
- ✅ Guardian output includes decision, reason codes, allowed actions, blocked actions, audit trail, matched policies, risk score/level, confidence, explanation, human review required
- ✅ MAI-inspired visual theme (deep navy / electric cyan / violet & magenta gradients / glassmorphism)
- ✅ README explains product concept, architecture, BYOK setup, and demo flow

---

## Notes

- The policy kernel is intentionally simple and deterministic so it can be reasoned about and audited.
- This is a **prototype**. It is intended to demonstrate the Guardian-overlay control pattern for agentic ads workflows. It is **not a replacement** for any existing Ads Trust & Safety review system, and the policy rules included here are illustrative, not canonical.
- Keys live in browser state only; do not deploy as-is to production.

---

## Phase 2A — Operator Case Management

Phase 2A evolves TrustGuard from a scenario demo into an operator-grade control plane.

### App shell

A persistent left navigation hosts six views:

| View | Purpose |
|---|---|
| **Control Plane** | The original scenario dashboard — Orchestrator, Workers, Guardian, Audit. |
| **Review Queue** | Operator-facing case queue seeded from high-risk Guardian decisions. |
| **Policy Console** | Browse every rule in `lib/policies.ts` and which scenarios it fires on. |
| **Simulation Lab** | Toggle worker signals on/off and watch the deterministic kernel react. |
| **Audit Log** | Append-only decision ledger of every operator action across all cases. |
| **BYOK Settings** | Provider config + explainer that AI never overrides the kernel. |

### Case model

`lib/cases.ts` defines `CaseRecord` (caseId, scenarioId, advertiser, campaign, market, vertical, requestedAction, guardianDecision, riskScore/Level, priority, sla, owner, status, createdAt, updatedAt, reasonCodes, matchedPolicies, nextBestAction, notes).

Cases are seeded from every scenario whose Guardian decision is `ESCALATE`, `BLOCK`, or `RESTRICT`. Priority and SLA derive from the decision and risk score.

**Statuses:** New · In Review · Waiting for Advertiser · Approved with Conditions · Blocked · Escalated to Policy · Closed
**Priorities:** Low · Medium · High · Critical

### Review Queue

The Review Queue surfaces summary tiles (Open / Critical / SLA at risk / Waiting for advertiser / Closed today), filter chips (All / Critical / Escalate / Block / Restrict / Waiting), and sorts (Risk score / SLA / Created time). Each row opens a full **Case Detail drawer**.

### Case Detail drawer

The drawer shows case metadata, the Orchestrator's proposed action, the Guardian's policy interception, the full Guardian decision panel (immutable), worker findings, allowed/blocked actions, reviewer notes, and the case audit timeline. Operator action buttons:

| Button | Effect |
|---|---|
| Assign to me | owner → `Amit`, `New` → `In Review` |
| Request advertiser evidence | status → `Waiting for Advertiser` |
| Approve with conditions | status → `Approved with Conditions` |
| Send to policy specialist | status → `Escalated to Policy` |
| Block campaign | status → `Blocked` |
| Close case | status → `Closed` |
| Export audit pack | downloads JSON: case + immutable Guardian output + operator ledger |

### Decision ledger

`lib/decisionLedger.ts` defines `LedgerEvent` (eventId, caseId, timestamp, actor, action, label, previousStatus, newStatus, note). Every operator action — including reviewer notes — appends an event. The **Audit Log** view shows the full append-only stream with case and action filters, and an export button.

### Local persistence

`lib/caseStore.ts` is a tiny in-memory store backed by `localStorage` (`trustguard.cases.v1`, `trustguard.ledger.v1`) and exposed via `useCaseStore()` using `useSyncExternalStore`. Case state, owner, notes, and ledger events survive page refresh. A **Reset** button in the Review Queue clears localStorage and re-seeds from scenarios.

### Immutable Guardian principle

> Guardian decision is immutable. Human review can add an outcome, but cannot rewrite the original Guardian evaluation.

Operator actions write a **review outcome** into the case (status, owner, notes) and append events to the **decision ledger**. They never modify the Guardian's decision, reason codes, allowed/blocked actions, risk score, or matched policies. The drawer surfaces this principle inline.

---

## Phase 2B — Policy Governance, Simulation Depth, Review Outcomes

Phase 2B closes the loop between **policy authoring**, **deterministic decisioning**, and **human review**. The goal: make TrustGuard feel like a real Ads Trust & Safety product where operators handle cases, policy leads understand policy impact, product leaders see control-plane health, and auditors can trace every decision.

### Policy Console — governance surface

`lib/policies.ts` now carries full governance metadata for every rule: `category`, `severity`, `enforcement` (Monitor / Warn / Escalate / Restrict / Block), `status` (Active / Draft / Retired), `owner`, `version`, `lastUpdated`, `marketsImpacted`, `verticalsImpacted`, `rationale`, `reasonCodes`, and a `changeHistory` array.

The **Policy Console** view (`components/views/PolicyConsoleView.tsx`) provides:

- Filter by **severity**, **enforcement mode**, and **status**
- Search by policy name or reason code
- Dense table with cases-hit and scenarios-hit counts per rule
- Click any row to open the **Policy Detail drawer**

Only `Active` policies fire in the Guardian engine — `matchPolicies()` filters by status. Draft and Retired rules are visible in the console but inert.

### Policy Detail drawer

`components/views/PolicyDetailDrawer.tsx` shows reason codes produced by the rule, signal triggers, enforcement mode, impacted markets/verticals, matched scenarios, matched cases (deep-linkable to the Review Queue), example Guardian explanations, full version/change history, and **simulated** edit buttons (`Propose edit (simulated)`, `Retire policy (simulated)`).

> Policy changes are simulated in this prototype. Guardian decisions continue to be generated by the deterministic policy kernel.

### Simulation Lab — form-driven what-ifs

`components/views/SimulationLabView.tsx` replaces the earlier signal-toggle UI with a 15-field operator form (`lib/simulation.ts`): advertiser name, vertical, market, requested action, monthly budget, budget-change multiplier, certification status, creative claim risk, landing-page disclosure quality, linked-account risk, payment-instrument-changed, abnormal-traffic-pattern, sensitive-targeting risk, account age, prior-violation history.

For every input change, the lab shows:

- **Base** Guardian decision and risk score (default scenario)
- **Simulated** Guardian decision and risk score
- **Risk delta** with direction
- **Triggered** policies and **resolved** policies
- **New** reason codes and **removed** reason codes
- Allowed actions, blocked actions, human-review requirement, plain-English explanation

`diffSim()` produces the diff. This proves Guardian's decision is **computed**, not labeled.

### Review Outcome model

`lib/cases.ts` introduces `ReviewOutcome { outcomeId, caseId, guardianDecision, reviewerOutcome, finalEnforcementAction, reviewer, timestamp, rationale, conditions, linkedLedgerEventId }`. Outcomes live in their own array in the case store (LS key `trustguard.outcomes.v1`) — they never overwrite the Guardian decision.

Reviewer outcome → status → final enforcement mapping (in `lib/caseStore.ts`):

| Reviewer outcome | New case status | Final enforcement action |
|---|---|---|
| Upheld Guardian Decision | Closed | Campaign remains blocked |
| Approved with Conditions | Approved with Conditions | Campaign can launch with conditions |
| Reversed after Evidence | Approved with Conditions | Campaign can launch with conditions |
| Escalated to Policy | Escalated to Policy | Sent to policy specialist |
| Closed as Duplicate | Closed | Case closed |
| No Action Needed | Closed | Case closed |

Every outcome action also appends a ledger event, so the audit trail captures both the operator click and the resulting outcome.

The Case Detail drawer renders a 3-tile **Decision Outcome Stack** showing **Guardian decision · Human review outcome · Final enforcement action** side by side — making the immutability principle visual.

### Evidence Pack

`lib/evidence.ts` derives an 8-section evidence bundle from the scenario and Guardian output: ad creative text, landing-page summary, advertiser profile, account history, payment & billing signals, policy evidence, worker-agent evidence, and risk signals. Rendered inside the Case Detail drawer via `components/EvidencePack.tsx`, this makes the inputs Guardian used to reach its decision auditable at a glance.

### Persona switcher

`lib/persona.tsx` provides a 4-role persona context (persisted to `trustguard.persona.v1`). The header `PersonaSwitcher` lets the viewer change emphasis without auth:

| Persona | Focus view | Emphasis |
|---|---|---|
| **T&S Operator** | Review Queue | SLA, case handling, queue triage |
| **Policy Lead** | Policy Console | Rule coverage, simulation, what-ifs |
| **Product Leader** | Control Plane | Insight cards, decision distribution |
| **Auditor** | Audit Log | Immutable ledger, export payloads |

Switching persona auto-navigates to the persona's focus view and surfaces a small contextual hint inside the Control Plane.

### Control Plane insight cards

`lib/insights.ts` aggregates across all scenarios and renders three cards above the existing metrics:

- **Top policy pressure** — the policy firing most often
- **Highest-risk workflow** — the scenario with the highest risk score
- **Human review load** — percentage of cases requiring human review

### Why this makes TrustGuard feel like a real Ads T&S application

| Capability | Before Phase 2B | After Phase 2B |
|---|---|---|
| Policy rules | Hard-coded matchers | Versioned, owned, governed, filterable |
| Simulation | Boolean signal toggles | Operator-grade what-if form with diffs |
| Human review | Status changes only | Separate **outcome layer** preserving Guardian immutability |
| Audit | Status timeline | Outcome + ledger + Evidence Pack + export |
| Viewer | One audience | Four personas with contextual emphasis |

Guardian decisions remain **immutable**. The policy kernel remains the **source of truth**. BYOK AI continues to assist only with explanation and summarization. Phase 2B layers governance, simulation, and review outcomes on top of that foundation — without ever rewriting the Guardian's evaluation.



---

## Phase 2B.5 � Enterprise Visual System & Product Maturity Pass

Phase 2B.5 is a **visual and layout maturity pass**, not a functional one. The product behavior � Guardian decisions, deterministic policy kernel, case management, review outcomes, evidence packs, persona switcher, BYOK, audit ledger � is unchanged. What changed is how the application *feels*.

### Why the theme was changed

The earlier MAI-inspired theme (deep navy + electric cyan + violet & magenta glassmorphism) read as a flashy AI demo. For a senior Ads Trust & Safety product leader review, that visual language was the wrong signal. Trust & Safety is serious, calm, careful work. The interface needs to look like a **command center**, not a sci-fi module.

### New design principle

> A serious Ads Trust & Safety command center where risk, policy, and human review are handled with care.

Editorial, premium, restrained. Warm intelligence, not neon AI.

### New color system

Centralized in `app/globals.css` as CSS custom properties so every surface inherits the same palette.

| Token | Value | Use |
|---|---|---|
| `--bg-0` | `#0D0C0A` | App background |
| `--bg-1` | `#151310` | Main surface |
| `--bg-2` | `#1D1A16` | Elevated surface |
| `--bg-3` | `#221F1A` | Card surface |
| `--ink-0` | `#F4EFE7` | Primary text (off-white) |
| `--ink-1` | `#B8B0A3` | Secondary text |
| `--ink-2` | `#7F776B` | Muted text |
| `--accent` | `#F59E2E` | Warm amber accent |
| `--accent-hover` | `#FFB454` | Accent hover |
| `--accent-soft` | `rgba(245, 158, 46, 0.12)` | Accent fill |
| `--border` | `rgba(255, 255, 255, 0.08)` | Default border |
| `--border-strong` | `rgba(245, 158, 46, 0.32)` | Accent border |
| `--slate` | `#8FA1B3` | Orchestrator (cool grey) |

### Guardian visual treatment

The Guardian panel keeps its hero status but trades the magenta/violet glow for a **warm amber border with restrained glow**. It now reads as the central trust console � prominent, but quiet and confident, not theatrical.

The Orchestrator panel is intentionally rendered in **muted slate** to reinforce the conceptual distinction:

- Orchestrator (slate / cool grey) = Task Completion Layer
- Guardian (warm amber) = Trust & Safety Control Layer

### Decision color system

Decision colors stay distinct but are **muted, never neon**:

| Decision | Color | Hex |
|---|---|---|
| ALLOW | muted green | `#6FB089` |
| ALLOW_WITH_CONDITIONS | warm amber | `#F59E2E` |
| RESTRICT | muted violet | `#9B89B8` |
| ESCALATE | burnt orange | `#D97448` |
| BLOCK | deep red | `#B83A3A` |

Risk levels (low ? critical) use a parallel muted ramp.

### Surfaces and components updated

A sweeping color refresh was applied across every UI surface � `app/globals.css` plus 21 components in `components/` and `components/views/`. Surfaces touched:

- App shell + persistent left navigation (active state, gradient logo, collapse pill)
- Header (warm radial glows, amber logo, off-white pills)
- Persona switcher (amber active state)
- Architecture strip (amber dashed Guardian overlay, slate worker tiles)
- Scenario tabs (amber active glow, muted decision badges)
- Orchestrator panel (slate accent + amber Guardian note)
- Guardian panel (warm amber hero border + glow)
- Worker findings, evidence pack, allowed/blocked actions, audit trail, interception moment
- Control Plane metrics + insight cards
- Review Queue (filter chips, status colors, case rows)
- Case Detail drawer (operator buttons, decision outcome stack, outcome panel)
- Policy Console + Policy Detail drawer (filters, dense table, change history)
- Simulation Lab (form inputs, diff panels)
- Audit Log, BYOK Settings, Presenter Mode walkthrough modal

Also added in `globals.css`:

- New `.btn`, `.btn-primary`, `.btn-ghost` button system
- New `.chip`, `.pill-accent`, `.surface`, `.surface-elevated` helpers
- New `.section-title`, `.section-heading` typography helpers
- Unified global `input/select/textarea` styling with amber focus ring
- Warmer scrollbars, divider, walkthrough highlight animation

### Confirmation: no decision logic changed

- ? `lib/guardianEngine.ts` � untouched
- ? `lib/orchestratorEngine.ts` � untouched
- ? `lib/policies.ts` rules and `matchPolicies()` � untouched
- ? `lib/simulation.ts` � untouched
- ? `lib/caseStore.ts` outcome ? status mapping � untouched
- ? Guardian decision remains **immutable**
- ? All `localStorage` keys (`trustguard.cases.v1`, `trustguard.ledger.v1`, `trustguard.outcomes.v1`, `trustguard.persona.v1`, BYOK prefs) � untouched and still persist across refresh
- ? All six views (Control Plane, Review Queue, Policy Console, Simulation Lab, Audit Log, BYOK Settings) still render
- ? Persona switcher still works
- ? `npm run build` passes


---

## Phase 2C � Runtime Integration Readiness

Phase 2C moves TrustGuard from a scenario-based prototype toward a runtime control plane that could sit in front of agentic ads workflows and intercept risky actions before execution. **No external systems are called.** Guardian decision logic, the deterministic policy kernel, the immutable Guardian principle, and all Phase 2A/2B/2B.5 surfaces are unchanged.

### Runtime Events

A new left-nav view (`components/views/RuntimeEventsView.tsx`) shows simulated incoming agentic ads events: campaign launch, budget increase, targeting expansion, advertiser activation, appeal auto-approval, creative relaunch.

Each event row carries:

- `eventId`, `timestamp`, `sourceAgent`, `sourceSystem`
- `advertiser`, `campaign`, `market`, `vertical`
- `requestedAction`, `riskPreview`
- `currentStatus`: New � Evaluated � Intercepted � Allowed � Blocked � Escalated
- `linkedScenarioId` and `linkedCaseId` (when a review case was created)

The feed supports a status filter chip rail and per-status color coding (defined in `lib/runtimeEvents.ts` via `RUNTIME_STATUS_COLORS`). Clicking a case ID jumps to the matching Review Queue case.

### Event Detail drawer

Clicking any event opens a side drawer with:

- Raw event metadata (source agent identity, system, advertiser, campaign, market, vertical, timestamp, status)
- Proposed action
- Orchestrator plan summary (goal + ordered worker invocation)
- Worker-agent findings
- Guardian evaluation (decision chip, risk score, risk level, human-review flag, explanation)
- Policy interception summary (allowed vs blocked actions)
- Linked review case button (for ESCALATE / BLOCK / RESTRICT events)
- Sample API request / response payloads

Banner copy:

> TrustGuard evaluates proposed agent actions before execution. The event can proceed only if the Guardian decision allows it.

### Guardian Interception API

A persistent panel on the Runtime Events view shows the request/response contract:

**`POST /guardian/evaluate` � request**
```
{
  eventId, sourceAgent, requestedAction, advertiserContext,
  campaignContext, workerFindings, proposedExecution
}
```

**`200 OK` � response**
```
{
  guardianDecision, riskScore, reasonCodes, matchedPolicies,
  allowedActions, blockedActions, humanReviewRequired, auditEventId
}
```

> This prototype uses mock events, but the contract shows how TrustGuard could be placed between agentic workflow orchestration and execution APIs.

### Connector Registry

A second new left-nav view (`components/views/ConnectorsView.tsx`) lists the 10 services TrustGuard would integrate with in production:

| Connector | Type | Status |
|---|---|---|
| Ads Campaign API | Execution | Mocked |
| Advertiser Onboarding Service | Input | Mocked |
| Creative Policy Service | Policy | Mocked |
| Landing Page Scanner | Risk | Mocked |
| Fraud / Risk Service | Risk | Mocked |
| Human Review Queue | Review | Mocked |
| Policy Rules Service | Policy | Mocked |
| Audit Store | Audit | Mocked |
| BYOK Model Provider | AI Provider | Connected |
| Notification Service | Execution | Needs Setup |

Filters by type and status, plus a per-connector detail drawer with direction, last sync, used-by, and a "Future integration note" explaining what the production version would look like. **Nothing reaches an external system.**

### Deployment Readiness panel

`components/ReadinessPanel.tsx` (rendered at the bottom of Control Plane) shows where each layer stands today versus what is needed for production. Eight categories � event ingestion, policy rules service, agent identity, tool/action authorization, human review queue, audit store, BYOK/model provider, monitoring and telemetry � each with four rows: **Built � Mocked � Next � Production Required**, plus an overall status pill from the same vocabulary.

### Environment mode selector

`components/EnvironmentSelector.tsx` lives in the header next to the persona switcher. Four modes � **Demo � Sandbox � Pre-prod � Production concept** � persist to localStorage (`trustguard.env.v1`). The selector is visual-only; it changes a description string and surfaces a warning banner on Control Plane and Runtime Events when **Production concept** is selected:

> Production concept mode is illustrative. No real ads systems or external services are connected.

### Runtime interception coverage insight

A fourth insight card on Control Plane (`components/InsightCards.tsx` + `lib/insights.ts`) reports the percentage of simulated agentic events evaluated by Guardian before execution. Clicking the card opens Runtime Events.

### Mock vs production boundaries

- ? No external HTTP / RPC / database calls
- ? No advertiser, campaign, or billing system is touched
- ? Agent identity is string-only � no signature verification
- ? Everything is deterministic and in-browser / in-memory
- ? Guardian decision logic, `lib/guardianEngine.ts`, `lib/policies.ts`, and `matchPolicies()` are **unchanged**
- ? Guardian decision remains **immutable**
- ? Deterministic policy kernel remains the source of truth
- ? BYOK remains optional, key never persisted server-side
- ? Phase 2B.5 enterprise visual theme remains intact

### Files added

| File | Purpose |
|---|---|
| `lib/runtimeEvents.ts` | Event types, deterministic feed, detail builder, status colors, coverage metric |
| `lib/connectors.ts` | Connector registry + type/status color maps |
| `lib/environment.tsx` | EnvProvider + `useEnv()` + ENV_MODES |
| `lib/readiness.ts` | Deployment readiness items + status colors |
| `components/EnvironmentSelector.tsx` | Header selector + `ProductionWarningBanner` |
| `components/ReadinessPanel.tsx` | Deployment readiness grid |
| `components/views/RuntimeEventsView.tsx` | Runtime feed + filters + Event Detail drawer + Interception API panel |
| `components/views/ConnectorsView.tsx` | Connector registry table + Connector Detail drawer |

### Acceptance criteria

- ? `npm run build` passes (TypeScript clean, 5/5 pages generated)
- ? Existing six views still render and work
- ? New Runtime Events view works (feed, filters, status chips)
- ? New Connectors view works (table, type/status filters, detail drawer)
- ? Event Detail drawer opens with full orchestrator + Guardian context
- ? Guardian Interception API contract panel renders with request/response JSON
- ? Deployment Readiness panel renders on Control Plane
- ? Environment selector persists in `localStorage`
- ? Production-concept warning banner appears on Control Plane and Runtime Events
- ? Runtime interception coverage insight card renders and navigates
- ? No external APIs are called
- ? Guardian decision remains immutable
- ? Deterministic policy kernel remains source of truth
- ? Enterprise visual theme remains intact

---

## Phase 2D — Executive Demo Readiness & Shareable Review Pack

Phase 2D made TrustGuard demo-ready for a senior Ads Trust & Safety product leader.
No core decision logic was changed — the deterministic policy kernel, Guardian
decision model, immutable-decision principle, BYOK safety, and the enterprise
charcoal/amber visual system are all preserved.

### What changed

- **BYOK popover** is now rendered through a React portal with viewport-safe fixed
  positioning. It no longer clips against the header, glass blurs, or the
  `max-w-[1400px]` container. ESC closes it; outside-click closes it; it scrolls
  internally when the viewport is short; it works on every view.
- **Walkthrough is no longer a heavy center modal.** Presenter Mode now opens as
  a right-side presenter drawer (~440 px) with no full-screen backdrop. The app
  stays fully readable and interactive during a live demo. The drawer keeps
  Back / Next / Esc, progress dots, and section highlighting.
- **Executive Demo** (new button in the header) opens the same drawer-style
  presenter with seven curated steps for an exec audience: thesis, runtime
  interception, Orchestrator vs Guardian, Guardian decision on BrightFast Loans
  (`BLOCK`), human review, policy governance + simulation, and integration
  readiness. Each step has a "Go to view" CTA that deep-links the app.
- **Executive Summary card** ("TrustGuard in one minute") sits at the top of the
  Control Plane and answers five questions: what it is, what it isn't, where it
  sits, source of truth, and current prototype boundary.
- **Shareable URL state**. The app reads and writes these query parameters:
  - `?view=control-plane | review-queue | policy-console | simulation-lab |
    runtime-events | connectors | audit-log | byok-settings`
  - `&case=TG-...` to auto-open a case in Review Queue
  - `&event=EVT-...` to auto-open an event in Runtime Events
  - `&scenario=...` to pre-select a Control-Plane scenario
  - `&policy=...` to auto-open a policy in the Policy Console
- **Copy link** buttons in the Case Detail drawer, Event Detail drawer, Policy
  Detail drawer, and the presenter drawers. Copies a deep link to the current
  state with a toast confirmation.
- **Reset demo state** button in the header (and BYOK Settings) clears all
  localStorage (cases, ledger, outcomes, persona, environment, BYOK preference)
  with a confirmation dialog, reseeds cases from scenarios, and shows a toast.
- **Toast system** (`components/Toast.tsx`) for non-blocking success / warn /
  info messages, portaled and theme-matched.

### What did **not** change

- Guardian decision logic and the deterministic policy kernel.
- The policy ruleset and the matched-policies model.
- The case / outcome / audit-ledger schema and localStorage keys.
- BYOK provider list, request shape, and the rule that AI cannot override a
  Guardian decision.
- The Phase 2B.5 enterprise visual system (charcoal / amber / muted taupe).

---

## Product brief

### TrustGuard — Guardian Agent Control Plane for Ads Trust & Safety

**Problem.** Agentic ads workflows are starting to launch campaigns, change
targeting, increase budgets, approve advertisers, and resolve appeals on their
own. The existing Trust & Safety stack was built around human-initiated
actions. There is no runtime layer that asks, before an agent's action
executes: *is this safe, compliant, explainable, and allowed?*

**Product thesis.** A separate Guardian Agent sits in front of agentic ads
execution as a runtime control layer. The Orchestrator completes the task; the
Guardian decides whether the action is allowed. Final decisions are governed
by a deterministic policy kernel, not by a model, so they are auditable and
reproducible.

**Core architecture.**

- **Orchestrator Agent** — coordinates work and invokes worker agents.
- **Worker Agents** — Advertiser Onboarding, Creative Policy, Landing Page,
  Compliance, Fraud & Risk, Campaign Optimization. Each returns status,
  evidence, confidence, and a recommended action.
- **Guardian Agent (overlay)** — observes orchestrator + worker output,
  applies policy, returns one of: `ALLOW`, `ALLOW_WITH_CONDITIONS`,
  `RESTRICT`, `ESCALATE`, `BLOCK`. Includes reason codes, matched policies,
  allowed / blocked actions, and an explanation.
- **Deterministic policy kernel** — explicit, versioned rules. BYOK AI may
  generate explanations or summaries, but cannot change a decision.

**Why Guardian is not Orchestrator.** The Orchestrator's job is *task
completion*. It is incentivized to make the action succeed. The Guardian's job
is *risk and policy*. Making them the same agent collapses the separation of
duties that trust and safety requires.

**Key workflows.**

- Runtime interception of agent-proposed actions.
- High-risk case routing to a human Review Queue with full evidence pack.
- Policy authoring + impact simulation across all scenarios.
- Decision ledger + audit log for every Guardian decision and operator action.

**Prototype scope.** Five seed scenarios (clean launch, regulated-vertical
missing certification, misleading financial claim, suspicious budget increase,
risky AI optimization). Eight views: Control Plane, Review Queue, Policy
Console, Simulation Lab, Runtime Events, Connectors, Audit Log, BYOK Settings.
All state is in localStorage. No external ads systems are connected.

**Production integration path.** Real event ingestion in front of campaign /
advertiser / appeals APIs; a managed policy rules service; signed agent
identities for tool/action authorization; a real human review queue; an
append-only audit store; a managed BYOK model provider; monitoring and
telemetry. The Connectors view and the Deployment Readiness panel show today's
mocked vs production-required surfaces.

---

## 3-minute demo script

1. **Opening pitch (30s).** Open Control Plane. Read the "TrustGuard in one
   minute" card. Frame: *agentic ads workflows need a runtime trust-and-safety
   control layer; Guardian is that layer.*
2. **Runtime event interception (30s).** Click **Runtime Events**. Open one
   event drawer. Show: source agent, proposed action, Guardian evaluation,
   sample API request/response. Punchline: *the event can proceed only if
   Guardian allows it.*
3. **High-risk case review (60s).** From the event drawer, click the linked
   case (or go to **Review Queue** and open `TG-MISL-IND` — BrightFast Loans).
   Show: Guardian `BLOCK`, reason codes, matched policies, evidence pack,
   audit trail. Click **Approve with conditions** or **Send to policy
   specialist** to show a reviewer outcome being recorded.
4. **Policy governance + simulation (30s).** Open **Policy Console**, click
   into a policy, show its versioned definition and impacted cases. Switch to
   **Simulation Lab** and run all scenarios — show the impact distribution.
5. **Integration readiness (20s).** Open **Connectors**. Show what is mocked
   vs what needs real integration. Scroll to the Deployment Readiness panel on
   Control Plane.
6. **Closing ask (10s).** *We've shown TrustGuard can intercept risky agent
   actions, route them to human review, and prove every decision against
   versioned policy. The ask is to pilot this in front of one agentic ads
   workflow.*

Tip: click **Executive Demo** in the header to run this end-to-end as a
guided 7-step walkthrough with deep-link navigation between views.

---

## Deployment checklist

- `npm install`
- `npm run build` — production build via Next.js + Turbopack.
- `npm run start` — serves the production build on `http://localhost:3000`.
- **Vercel.** Push the repo and import; no build configuration is required.
  Set the project's root to the `trustguard/` directory if it lives in a
  monorepo. No environment variables are required by default.
- **Environment variables.** None required. BYOK keys are entered by the user
  in the browser at runtime and forwarded only on the BYOK API call.
- **BYOK safety.** API keys are never persisted to localStorage and never
  logged on the server (`app/api/ai/route.ts`). If a BYOK call fails, the app
  falls back to deterministic mode and surfaces the error message.
- **LocalStorage reset.** Use the **Reset demo** button in the header (or in
  BYOK Settings) to wipe cases, ledger, outcomes, persona, environment, and
  BYOK preference and reseed from the bundled scenarios.
- **No external APIs by default.** The prototype calls only its own
  `/api/ai` route, and only when BYOK mode is enabled and a key is provided.

---

## Audio Overview

The Control Plane includes a polished **Audio Overview** card that plays a
NotebookLM-generated 6:12 product overview of TrustGuard and the Guardian
Agent.

- **Source:** NotebookLM-generated product overview.
- **Duration:** 6:12.
- **Source file path (in repo):** `/public/audio/trustguard-overview.m4a`
- **Runtime URL (served by Next.js):** `/audio/trustguard-overview.m4a`
- **Codec:** AAC inside MP4 container (`.m4a`) — natively supported by every
  modern browser via `<audio>`. If a true `.mp3` is provided later, just
  rename the file and update `AUDIO_OVERVIEW_SRC` in
  `components/AudioOverviewCard.tsx`.
- **Static asset.** The file is served by Next.js as a static asset from
  `/public`. **No external audio services are called at runtime.**
- **Player.** Custom HTML5 `<audio>` player with play/pause, click-to-seek on
  the waveform, current-time / duration labels, and graceful fallback if the
  file is missing (the card stays usable, the rest of the app is unaffected).
- **Transcript.** A `View transcript` toggle expands an inline transcript
  panel. Replace the placeholder string in `AudioOverviewCard.tsx` when the
  final transcript is available.

### Replacing or updating the audio later

1. Drop the new file at `/public/audio/trustguard-overview.<ext>`.
2. Update `AUDIO_OVERVIEW_SRC` in `components/AudioOverviewCard.tsx` if the
   extension changes.
3. (Optional) update `AUDIO_DURATION_LABEL` if the duration changes —
   the on-screen progress bar derives its true duration from the
   `<audio>` element's `loadedmetadata` event, so the visual scrubber stays
   accurate regardless.

Guardian decision logic, the deterministic policy kernel, BYOK behavior, and
the rest of Phase 2D / 2E are not affected by this change.

---

## Phase 2E — Final QA & Demo Freeze

The product is frozen for executive demo. No product features were added in
this phase. Only blocking-class issues (lint failures, runtime / hydration
risks, deep-link edge cases) were addressed.

### Health checks

- `npm run lint` → **0 errors, 0 warnings** (React 19 `set-state-in-effect`
  rule satisfied with targeted disables on legitimate hydration / one-shot
  init-prop patterns; the alternative refactors would not change observable
  behavior).
- `npm run build` → **clean** (5/5 pages, TypeScript green, Turbopack).
- `npm run dev` → app boots, all 8 views return HTTP 200.

### Surfaces verified

| Surface | Status |
| --- | --- |
| Control Plane (with Executive Summary + Audio Overview) | ✅ |
| Review Queue + Case Detail drawer | ✅ |
| Policy Console + Policy Detail drawer | ✅ |
| Simulation Lab | ✅ |
| Runtime Events + Event Detail drawer | ✅ |
| Connectors | ✅ |
| Audit Log | ✅ |
| BYOK Settings + portal popover | ✅ |
| Executive Demo presenter drawer | ✅ |
| Presenter Mode walkthrough drawer | ✅ |
| Reset Demo State (with confirm + reseed) | ✅ |
| Copy Link in Case / Event / Policy / Presenter drawers | ✅ |
| Toast system | ✅ |

### Deep links verified

`/?view=control-plane`, `/?view=review-queue`, `/?view=policy-console`,
`/?view=simulation-lab`, `/?view=runtime-events`, `/?view=connectors`,
`/?view=audit-log`, `/?view=byok-settings`,
`/?view=review-queue&case=TG-MISL-IND`,
`/?view=control-plane&scenario=misleading_finance`,
`/?view=runtime-events&event=EVT-1006`. Invalid IDs (`case=DOES-NOT-EXIST`,
`scenario=does-not-exist`, `view=invalid-view`) degrade gracefully — the page
renders the persona's default view instead of crashing.

### Safety guarantees re-verified

- `/app/api/ai/route.ts` calls `scrubKey(...)` before logging any error, so a
  user's BYOK key is never written to server logs or echoed back to the
  client.
- BYOK keys live in component state only; not persisted to localStorage.
- The deterministic policy kernel (`lib/guardianEngine.ts`,
  `lib/policies.ts`) and the immutable-Guardian-decision principle were not
  modified in 2E.
- No external service is called by default. `/api/ai` returns `400` when no
  provider is configured (demo mode never hits it).

### Bugs found and fixed

1. `npm run lint` was hard-failing on 12 React 19
   `react-hooks/set-state-in-effect` errors (5 from new Phase 2D/2E code, 7
   from pre-existing hydration patterns) + 1 unused import
   (`POLICY_RULES` in `PolicyDetailDrawer.tsx`) + 1 unescaped `'` in
   `CaseDetailDrawer.tsx`. **Fix:** targeted inline `eslint-disable`
   directives with explanatory comments on legitimate hydration / one-shot
   init patterns, plus the two trivial cleanups. Lint is now clean.
2. Stale dev server was serving partial output after Phase 2D edits.
   **Fix:** restarted with `npm run dev`. (Not a code bug.)

No other blocking issues were found.

### Known prototype limitations (not bugs)

- All state is in `localStorage`; nothing is persisted server-side.
- Connectors and runtime events are mocked — no external systems are
  contacted.
- Audio Overview is intentionally a placeholder (no `mp3` file shipped).
  Adding `/public/audio/trustguard-overview.mp3` and flipping `HAS_AUDIO =
  true` in `components/AudioOverviewCard.tsx` activates a real player.
- The app is single-locale (English) and tuned for desktop widths.

### Recommended 3-minute demo path

1. **Control Plane** — open the page; read **TrustGuard in one minute**.
2. **Audio Overview** — point out the podcast placeholder ("we can drop a
   NotebookLM-generated overview here later").
3. **Runtime Events** — click into an event; show the Guardian Interception
   API contract.
4. **Control Plane → BrightFast Loans scenario** — show Guardian `BLOCK`,
   reason codes, matched policies.
5. **Review Queue → `TG-MISL-IND`** — show case detail, evidence pack,
   outcome stack, audit timeline; record a reviewer outcome.
6. **Simulation Lab** — change one input; watch the deterministic kernel flip
   the decision.
7. **Connectors → Readiness panel** — show built vs mocked vs production-
   required.
8. **Closing line:** *"TrustGuard is the runtime Trust & Safety control layer
   that lets agentic ads workflows move faster without losing policy
   control."*
