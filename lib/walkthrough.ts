import type { Scenario, GuardianOutput } from "@/lib/types";

export interface WalkthroughStep {
  key: string;
  title: string;
  body: string;
  scenarioNote: string;
  highlightId: string;
}

export function buildWalkthrough(
  scenario: Scenario,
  guardian: GuardianOutput,
): WalkthroughStep[] {
  const decision = guardian.decision.replace("_", " ").toLowerCase();
  const failedAgents = scenario.workerFindings.filter((f) => f.status !== "pass");
  const failsList = failedAgents.length
    ? failedAgents.map((f) => f.agentName.replace(" Agent", "")).join(", ")
    : "no concerns";

  return [
    {
      key: "request",
      title: "1 · User Request",
      body:
        "An advertiser, campaign agent, or optimization agent requests an action — launching a campaign, increasing budget, changing targeting, processing an appeal, or approving an advertiser. In an agentic stack, many of these requests originate from other agents, not humans.",
      scenarioNote: `Current request: ${scenario.advertiser} (${scenario.vertical}, ${scenario.market}) → "${scenario.requestedAction}".`,
      highlightId: "section-scenarios",
    },
    {
      key: "orchestrator",
      title: "2 · Orchestrator Agent · Task Completion Layer",
      body:
        "The Orchestrator Agent decomposes the request into tasks and invokes specialized worker agents to do the work. Its job is task completion, not safety approval. The Orchestrator can propose actions — it cannot decide whether they are safe to ship.",
      scenarioNote: `Orchestrator proposed: "${scenario.interception.proposed}"`,
      highlightId: "section-orchestrator",
    },
    {
      key: "workers",
      title: "3 · Worker Agents",
      body:
        "Six specialized worker agents perform parallel checks: advertiser onboarding (KYC & history), creative policy, landing-page quality, compliance (regulated verticals), fraud and risk screening, and campaign optimization. Each returns a status, evidence, confidence, and a recommended action.",
      scenarioNote: `Worker checks: ${scenario.workerFindings.length} agents ran. ${failedAgents.length} flagged issues (${failsList}).`,
      highlightId: "section-workers",
    },
    {
      key: "guardian",
      title: "4 · Guardian Overlay · Trust & Safety Control Layer",
      body:
        "The Guardian Agent sits above the workflow as a separate overlay. It observes the orchestrator plan, evaluates worker-agent findings, applies policy, and intercepts risky actions before execution. The Guardian is the only agent that can permit, restrict, escalate, or block.",
      scenarioNote: `Guardian intercepted: "${scenario.interception.intercepted}"`,
      highlightId: "section-guardian",
    },
    {
      key: "kernel",
      title: "5 · Policy Kernel",
      body:
        "Final Guardian decisions are governed by a deterministic policy kernel — explicit rules (e.g., regulated-vertical certification, fairness in sensitive verticals, misleading-claim detection, agentic-action governance). BYOK AI can assist with explanation and summarization, but cannot override the kernel.",
      scenarioNote: `${guardian.matchedPolicies.length} polic${guardian.matchedPolicies.length === 1 ? "y" : "ies"} matched: ${guardian.matchedPolicies.map((p) => p.policyId).join(", ") || "none"}.`,
      highlightId: "section-guardian",
    },
    {
      key: "decision",
      title: "6 · Final Decision",
      body:
        "Guardian returns one of: Allow, Allow with Conditions, Restrict, Escalate, or Block. Each decision carries reason codes, allowed actions, blocked actions, and a plain-English explanation so the outcome is reviewable and actionable.",
      scenarioNote: `Decision: ${guardian.decision} · Risk ${guardian.riskScore}/100 (${guardian.riskLevel}) · ${decision} the orchestrator's proposal.`,
      highlightId: "section-interception",
    },
    {
      key: "audit",
      title: "7 · Audit & Human Review",
      body:
        "Every decision has reason codes, matched policies, allowed actions, blocked actions, and a full audit trail from user request to final decision. High-risk actions are routed to human review with the full evidence package ready for the reviewer.",
      scenarioNote: guardian.humanReviewRequired
        ? "This scenario requires human review — Guardian created a review task."
        : "This scenario did not trigger human review; the decision is fully autonomous and logged.",
      highlightId: "section-audit",
    },
  ];
}
