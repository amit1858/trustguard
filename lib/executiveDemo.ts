import type { PresenterStep } from "@/components/PresenterDrawer";

/**
 * 7-step executive walkthrough for a senior Ads Trust & Safety product leader.
 * Each step can navigate the app to a specific view (via deepLink) and optionally
 * highlight a section by DOM id (must match an id rendered in that view).
 */
export const EXECUTIVE_DEMO_STEPS: PresenterStep[] = [
  {
    key: "thesis",
    title: "1 · Product thesis",
    body:
      "TrustGuard is a runtime Trust & Safety control layer for agentic ads workflows. As more advertiser, creative, optimization, and appeals decisions move to AI agents, a separate Guardian Agent is needed to intercept risky actions before they execute.",
    scenarioNote:
      "Orchestrator completes the task. Guardian decides whether the action is allowed. They are not the same agent.",
    goTo: { label: "Open Control Plane", deepLink: { view: "control-plane" } },
    highlightId: "section-scenarios",
  },
  {
    key: "runtime",
    title: "2 · Runtime interception",
    body:
      "Proposed agent actions arrive as runtime events — campaign launches, budget increases, targeting expansions, advertiser activations, appeal auto-approvals. TrustGuard evaluates them before execution. The event proceeds only if the Guardian decision allows it.",
    scenarioNote:
      "Each event carries source agent identity, proposed action, advertiser context, and a Guardian evaluation result.",
    goTo: { label: "Open Runtime Events", deepLink: { view: "runtime-events" } },
  },
  {
    key: "orchestrator-vs-guardian",
    title: "3 · Orchestrator vs Guardian",
    body:
      "The Orchestrator decomposes a request and runs worker agents. The Guardian sits above as an overlay — it applies the deterministic policy kernel and can ALLOW, ALLOW_WITH_CONDITIONS, RESTRICT, ESCALATE, or BLOCK. The orchestrator cannot override Guardian.",
    scenarioNote:
      "Six worker agents: Advertiser Onboarding, Creative Policy, Landing Page, Compliance, Fraud & Risk, Campaign Optimization.",
    goTo: { label: "Highlight the Guardian panel", deepLink: { view: "control-plane", scenario: "clean_launch" } },
    highlightId: "section-guardian",
  },
  {
    key: "guardian-decision",
    title: "4 · Guardian decision · BrightFast Loans",
    body:
      "BrightFast Loans (financial services, India) requests a campaign launch with the claim '100% guaranteed approval in 2 minutes — no credit check'. Guardian returns BLOCK with reason codes: misleading_financial_claim, weak_landing_page_disclosure, regulated_vertical_unregistered.",
    scenarioNote:
      "Final decision is governed by the deterministic policy kernel — not the AI model. BYOK only assists with explanation.",
    goTo: {
      label: "Open BrightFast Loans scenario",
      deepLink: { view: "control-plane", scenario: "misleading_finance" },
    },
    highlightId: "section-guardian",
  },
  {
    key: "human-review",
    title: "5 · Human review",
    body:
      "When Guardian returns ESCALATE, BLOCK, or RESTRICT, a case lands in the Review Queue with the full evidence package: worker findings, matched policies, reason codes, allowed/blocked actions, and an immutable audit trail. Reviewers record outcomes that flow back into the decision ledger.",
    scenarioNote:
      "Operators can: assign, request advertiser evidence, approve with conditions, escalate to policy, block, close, and export an audit pack.",
    goTo: {
      label: "Open the BrightFast review case",
      deepLink: { view: "review-queue", case: "TG-MISL-IND" },
    },
  },
  {
    key: "policy-simulation",
    title: "6 · Policy governance & simulation",
    body:
      "Every Guardian decision traces back to versioned policies in the Policy Console. The Simulation Lab lets policy teams replay all scenarios against the current rule set before publishing — so a rule change's impact (more BLOCKs? more ESCALATEs?) is visible up-front.",
    scenarioNote:
      "Deterministic kernel = source of truth. AI is advisory only. Policies are auditable artefacts, not model prompts.",
    goTo: { label: "Open Simulation Lab", deepLink: { view: "simulation-lab" } },
  },
  {
    key: "readiness",
    title: "7 · Integration readiness",
    body:
      "Connectors and the Deployment Readiness panel show what is built, what is mocked, and what needs real integration for production: event ingestion, policy rules service, agent identity, tool/action authorization, human review queue, audit store, BYOK provider, and telemetry.",
    scenarioNote:
      "This prototype uses mock events, mock connectors, and localStorage persistence. The contract shows how TrustGuard would sit between agentic workflow orchestration and execution APIs.",
    goTo: { label: "Open Connectors", deepLink: { view: "connectors" } },
  },
];
