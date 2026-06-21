import { SCENARIOS, getScenario } from "./scenarios";
import { runOrchestrator } from "./orchestratorEngine";
import { evaluateGuardian } from "./guardianEngine";
import type { Scenario, GuardianOutput } from "./types";
import type { OrchestratorRun } from "./orchestratorEngine";

export type RuntimeEventStatus =
  | "New"
  | "Evaluated"
  | "Intercepted"
  | "Allowed"
  | "Blocked"
  | "Escalated";

export interface RuntimeEvent {
  eventId: string;
  timestamp: string;
  sourceAgent: string;
  sourceSystem: string;
  advertiser: string;
  campaign: string;
  requestedAction: string;
  market: string;
  vertical: string;
  riskPreview: "low" | "moderate" | "elevated" | "high" | "critical";
  currentStatus: RuntimeEventStatus;
  linkedScenarioId?: string;
  linkedCaseId?: string;
}

export interface RuntimeEventDetail {
  event: RuntimeEvent;
  scenario: Scenario;
  orchestrator: OrchestratorRun;
  guardian: GuardianOutput;
  apiRequest: object;
  apiResponse: object;
}

const SOURCE_AGENTS: Record<string, { agent: string; system: string }> = {
  "Launch campaign": {
    agent: "Campaign Launch Agent v3.2",
    system: "ads-orchestrator/launch",
  },
  "Increase budget by 4x and expand targeting": {
    agent: "Budget Optimization Agent v2.1",
    system: "ads-orchestrator/optimization",
  },
  "AI optimization agent proposes excluding older age groups and narrowing audience aggressively":
    {
      agent: "Audience Optimization Agent v1.8",
      system: "ads-orchestrator/optimization",
    },
  "Auto-approve appeal after ad rejection": {
    agent: "Appeal Resolution Agent v1.4",
    system: "trust-and-safety/appeals",
  },
};

function decisionToStatus(decision: string): RuntimeEventStatus {
  switch (decision) {
    case "ALLOW":
    case "ALLOW_WITH_CONDITIONS":
      return "Allowed";
    case "RESTRICT":
      return "Intercepted";
    case "ESCALATE":
      return "Escalated";
    case "BLOCK":
      return "Blocked";
    default:
      return "Evaluated";
  }
}

function deterministicTimestamp(seed: number): string {
  // Deterministic, server-render-safe timestamps walking backwards from a fixed anchor.
  const base = new Date("2026-06-21T14:00:00Z").getTime();
  return new Date(base - seed * 6 * 60_000).toISOString();
}

function campaignFor(scenario: Scenario): string {
  return scenario.advertiser.replace(/\s+/g, "-").toLowerCase() + "-q3-2026";
}

function caseIdFor(scenarioId: string): string {
  // Match the case-seeding scheme in lib/cases.ts (CASE-<scn>)
  return `CASE-${scenarioId.toUpperCase()}`;
}

/**
 * Builds a deterministic feed of runtime events. Each Scenario maps to one
 * "evaluated" event; a few synthetic pending events are added at the top so
 * the feed shows live "New" / "Evaluated" states alongside resolved ones.
 */
export function getRuntimeEvents(): RuntimeEvent[] {
  const evaluated: RuntimeEvent[] = SCENARIOS.map((s, idx) => {
    const orch = runOrchestrator(s);
    const g = evaluateGuardian(s, orch);
    const sa = SOURCE_AGENTS[s.requestedAction] ?? {
      agent: "Ads Workflow Agent v1.0",
      system: "ads-orchestrator/generic",
    };
    const status = decisionToStatus(g.decision);
    return {
      eventId: `EVT-${1000 + idx + 4}`,
      timestamp: deterministicTimestamp(idx + 4),
      sourceAgent: sa.agent,
      sourceSystem: sa.system,
      advertiser: s.advertiser,
      campaign: campaignFor(s),
      requestedAction: s.requestedAction,
      market: s.market,
      vertical: s.vertical,
      riskPreview: g.riskLevel,
      currentStatus: status,
      linkedScenarioId: s.id,
      linkedCaseId:
        g.decision === "ESCALATE" || g.decision === "BLOCK" || g.decision === "RESTRICT"
          ? caseIdFor(s.id)
          : undefined,
    };
  });

  // Synthetic pending events — show "New" / "Evaluated" states.
  const pending: RuntimeEvent[] = [
    {
      eventId: "EVT-1003",
      timestamp: deterministicTimestamp(3),
      sourceAgent: "Creative Refresh Agent v2.0",
      sourceSystem: "ads-orchestrator/creative",
      advertiser: "Lumen Travel Co.",
      campaign: "lumen-travel-q3-2026",
      requestedAction: "Creative relaunch requested",
      market: "United Kingdom",
      vertical: "Travel",
      riskPreview: "low",
      currentStatus: "Evaluated",
    },
    {
      eventId: "EVT-1002",
      timestamp: deterministicTimestamp(2),
      sourceAgent: "Advertiser Activation Agent v1.7",
      sourceSystem: "ads-orchestrator/onboarding",
      advertiser: "Northwind Retail",
      campaign: "northwind-retail-q3-2026",
      requestedAction: "Advertiser activation requested",
      market: "United States",
      vertical: "Retail",
      riskPreview: "low",
      currentStatus: "New",
    },
    {
      eventId: "EVT-1001",
      timestamp: deterministicTimestamp(1),
      sourceAgent: "Targeting Optimization Agent v2.4",
      sourceSystem: "ads-orchestrator/optimization",
      advertiser: "Atlas Insurance",
      campaign: "atlas-insurance-q3-2026",
      requestedAction: "Targeting expansion requested",
      market: "Canada",
      vertical: "Insurance",
      riskPreview: "moderate",
      currentStatus: "New",
    },
    {
      eventId: "EVT-1000",
      timestamp: deterministicTimestamp(0),
      sourceAgent: "Budget Optimization Agent v2.1",
      sourceSystem: "ads-orchestrator/optimization",
      advertiser: "Helios Fitness",
      campaign: "helios-fitness-q3-2026",
      requestedAction: "Budget increase requested",
      market: "India",
      vertical: "Fitness",
      riskPreview: "low",
      currentStatus: "New",
    },
  ];

  return [...pending, ...evaluated];
}

export function getRuntimeEventDetail(event: RuntimeEvent): RuntimeEventDetail | null {
  if (!event.linkedScenarioId) {
    // For "New" events we still synthesize a plausible plan from a placeholder
    // scenario shell, but we never evaluate Guardian (the decision is "pending").
    return null;
  }
  const scenario = getScenario(event.linkedScenarioId);
  const orchestrator = runOrchestrator(scenario);
  const guardian = evaluateGuardian(scenario, orchestrator);

  const apiRequest = {
    eventId: event.eventId,
    timestamp: event.timestamp,
    sourceAgent: {
      name: event.sourceAgent,
      system: event.sourceSystem,
    },
    requestedAction: event.requestedAction,
    advertiserContext: {
      name: scenario.advertiser,
      vertical: scenario.vertical,
      market: scenario.market,
    },
    campaignContext: {
      campaign: event.campaign,
      monthlyBudget: 80000,
      certified: !["Financial Services", "Health", "Supplements"].includes(
        scenario.vertical,
      ),
    },
    workerFindings: scenario.workerFindings.map((f) => ({
      agent: f.agentName,
      status: f.status,
      confidence: f.confidence,
      summary: f.summary,
    })),
    proposedExecution: {
      target: event.sourceSystem,
      actions: orchestrator.plan.proposedActions,
    },
  };

  const apiResponse = {
    eventId: event.eventId,
    guardianDecision: guardian.decision,
    riskScore: guardian.riskScore,
    riskLevel: guardian.riskLevel,
    confidence: guardian.confidence,
    reasonCodes: guardian.reasonCodes,
    matchedPolicies: guardian.matchedPolicies.map((p) => ({
      policyId: p.policyId,
      title: p.title,
      severity: p.severity,
    })),
    allowedActions: guardian.allowedActions,
    blockedActions: guardian.blockedActions,
    humanReviewRequired: guardian.humanReviewRequired,
    auditEventId: `AUDIT-${event.eventId}`,
  };

  return { event, scenario, orchestrator, guardian, apiRequest, apiResponse };
}

export const RUNTIME_STATUS_COLORS: Record<RuntimeEventStatus, string> = {
  New: "#8FA1B3",
  Evaluated: "#C9A36B",
  Intercepted: "#9B89B8",
  Allowed: "#6FB089",
  Blocked: "#B83A3A",
  Escalated: "#D97448",
};

export function interceptionCoverage(): { percent: number; evaluated: number; total: number } {
  const events = getRuntimeEvents();
  const evaluated = events.filter(
    (e) => e.currentStatus !== "New",
  ).length;
  return {
    percent: events.length === 0 ? 0 : Math.round((evaluated / events.length) * 100),
    evaluated,
    total: events.length,
  };
}
