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

export type ActionSensitivity = "Low" | "Medium" | "High" | "Critical";

export interface RuntimeEvent {
  eventId: string;
  timestamp: string;
  sourceAgent: string;
  sourceSystem: string;
  // Phase 3C: Agent identity fields
  sourceAgentId?: string;
  requestedPermission?: string;
  actionSensitivity?: ActionSensitivity;
  guardianRequired?: boolean;
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

export type EventLifecycleStatus =
  | "received"
  | "evaluating"
  | "guardian_decisioned"
  | "allowed"
  | "restricted"
  | "escalated"
  | "blocked"
  | "review_created"
  | "reviewed"
  | "closed";

export interface LifecycleStep {
  step: number;
  label: string;
  timestamp: string;
  status: EventLifecycleStatus;
  detail?: string;
  isDone: boolean; // true if this step is completed
}

export const LIFECYCLE_STATUS_COLORS: Record<EventLifecycleStatus, string> = {
  received: "#8FA1B3",
  evaluating: "#C9A36B",
  guardian_decisioned: "#C7B8DC",
  allowed: "#6FB089",
  restricted: "#9B89B8",
  escalated: "#D97448",
  blocked: "#B83A3A",
  review_created: "#F59E2E",
  reviewed: "#6FB089",
  closed: "#7F776B",
};

export interface RuntimeEventDetail {
  event: RuntimeEvent;
  scenario: Scenario;
  orchestrator: OrchestratorRun;
  guardian: GuardianOutput;
  apiRequest: object;
  apiResponse: object;
}

const SOURCE_AGENTS: Record<
  string,
  {
    agent: string;
    system: string;
    agentId: string;
    permission: string;
    sensitivity: ActionSensitivity;
    guardianRequired: boolean;
  }
> = {
  "Launch campaign": {
    agent: "Campaign Orchestrator Agent v3.2",
    system: "Campaign Manager API",
    agentId: "campaign-orchestrator",
    permission: "propose_campaign_launch",
    sensitivity: "Medium",
    guardianRequired: true,
  },
  "Increase budget by 4x and expand targeting": {
    agent: "Budget Optimization Agent v2.1",
    system: "Optimizer Service",
    agentId: "budget-optimization",
    permission: "execute_budget_increase_above_2x",
    sensitivity: "High",
    guardianRequired: true,
  },
  "AI optimization agent proposes excluding older age groups and narrowing audience aggressively":
    {
      agent: "Creative Optimization Agent v1.8",
      system: "Optimizer Service",
      agentId: "creative-optimization",
      permission: "narrow_audience",
      sensitivity: "High",
      guardianRequired: true,
    },
  "Auto-approve appeal after ad rejection": {
    agent: "Appeal Resolution Agent v1.4",
    system: "Trust & Safety Appeals API",
    agentId: "appeal-resolution",
    permission: "auto_approve_restricted_vertical_appeal",
    sensitivity: "Critical",
    guardianRequired: true,
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

function caseIdFor(scenario: Scenario): string {
  return `TG-${scenario.id.toUpperCase().slice(0, 4)}-${scenario.market.replace(/\s+/g, "").slice(0, 3).toUpperCase()}`;
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
      system: "Workflow Automation API",
      agentId: "campaign-orchestrator",
      permission: "propose_campaign_launch",
      sensitivity: "Medium" as ActionSensitivity,
      guardianRequired: true,
    };
    const status = decisionToStatus(g.decision);
    return {
      eventId: `EVT-${1000 + idx + 4}`,
      timestamp: deterministicTimestamp(idx + 4),
      sourceAgent: sa.agent,
      sourceSystem: sa.system,
      sourceAgentId: sa.agentId,
      requestedPermission: sa.permission,
      actionSensitivity: sa.sensitivity,
      guardianRequired: sa.guardianRequired,
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
          ? caseIdFor(s)
          : undefined,
    };
  });

  // Synthetic pending events — show "New" / "Evaluated" states.
  const pending: RuntimeEvent[] = [
    {
      eventId: "EVT-1003",
      timestamp: deterministicTimestamp(3),
      sourceAgent: "Creative Optimization Agent v2.0",
      sourceSystem: "Creative Management API",
      sourceAgentId: "creative-optimization",
      requestedPermission: "relaunch_rejected_ad",
      actionSensitivity: "Medium",
      guardianRequired: true,
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
      sourceAgent: "Advertiser Onboarding Agent v1.7",
      sourceSystem: "Onboarding Service API",
      sourceAgentId: "advertiser-onboarding",
      requestedPermission: "activate_advertiser_account",
      actionSensitivity: "Low",
      guardianRequired: true,
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
      sourceAgent: "Budget Optimization Agent v2.4",
      sourceSystem: "Optimizer Service",
      sourceAgentId: "budget-optimization",
      requestedPermission: "propose_budget_increase",
      actionSensitivity: "Medium",
      guardianRequired: true,
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
      sourceSystem: "Optimizer Service",
      sourceAgentId: "budget-optimization",
      requestedPermission: "propose_budget_increase",
      actionSensitivity: "Medium",
      guardianRequired: true,
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

function decisionToLifecycleStatus(decision: string): EventLifecycleStatus {
  switch (decision) {
    case "ALLOW":
    case "ALLOW_WITH_CONDITIONS":
      return "allowed";
    case "RESTRICT":
      return "restricted";
    case "ESCALATE":
      return "escalated";
    case "BLOCK":
      return "blocked";
    default:
      return "guardian_decisioned";
  }
}

export function getEventLifecycle(event: RuntimeEvent): LifecycleStep[] {
  const base = new Date(event.timestamp).getTime();
  const isNew = event.currentStatus === "New";
  const isEvaluated = event.currentStatus === "Evaluated";
  const hasDecision = !isNew && !isEvaluated;

  const steps: LifecycleStep[] = [
    {
      step: 1,
      label: "Event received",
      timestamp: new Date(base).toISOString(),
      status: "received",
      detail: `${event.sourceAgent} -> ${event.sourceSystem}`,
      isDone: true,
    },
    {
      step: 2,
      label: "Orchestrator plan created",
      timestamp: new Date(base + 90_000).toISOString(),
      status: "evaluating",
      detail: event.requestedAction,
      isDone: !isNew,
    },
    {
      step: 3,
      label: "Worker agents invoked",
      timestamp: new Date(base + 150_000).toISOString(),
      status: "evaluating",
      detail: "Parallel checks: advertiser onboarding, creative policy, landing page, compliance, fraud/risk",
      isDone: hasDecision || isEvaluated,
    },
    {
      step: 4,
      label: "Worker findings returned",
      timestamp: new Date(base + 210_000).toISOString(),
      status: "evaluating",
      detail: "All worker-agent checks completed",
      isDone: hasDecision,
    },
    {
      step: 5,
      label: "Guardian evaluated policy",
      timestamp: new Date(base + 228_000).toISOString(),
      status: "guardian_decisioned",
      detail: "Deterministic policy kernel applied",
      isDone: hasDecision,
    },
    {
      step: 6,
      label: "Decision issued",
      timestamp: new Date(base + 238_000).toISOString(),
      status: hasDecision
        ? decisionToLifecycleStatus(
            event.currentStatus === "Intercepted"
              ? "RESTRICT"
              : event.currentStatus === "Allowed"
                ? "ALLOW"
                : event.currentStatus === "Blocked"
                  ? "BLOCK"
                  : event.currentStatus === "Escalated"
                    ? "ESCALATE"
                    : "guardian_decisioned",
          )
        : "guardian_decisioned",
      detail: hasDecision ? `Guardian: ${event.currentStatus}` : "Pending",
      isDone: hasDecision,
    },
  ];

  if (event.linkedCaseId) {
    steps.push({
      step: 7,
      label: "Review case created",
      timestamp: new Date(base + 260_000).toISOString(),
      status: "review_created",
      detail: event.linkedCaseId,
      isDone: true,
    });
  }

  return steps;
}

export interface LiveStreamEntry {
  id: string;
  timestamp: string;
  label: string;
  detail: string;
  dotColor: string;
}

export function getLiveStreamEntries(): LiveStreamEntry[] {
  const events = getRuntimeEvents();
  const entries: LiveStreamEntry[] = [];

  let i = 0;
  for (const evt of events) {
    const base = new Date(evt.timestamp).getTime();

    entries.push({
      id: `stream-recv-${evt.eventId}`,
      timestamp: new Date(base).toISOString(),
      label: "New agentic action received",
      detail: `${evt.sourceAgent} -> ${evt.requestedAction.slice(0, 60)}`,
      dotColor: "#8FA1B3",
    });

    if (evt.currentStatus !== "New") {
      entries.push({
        id: `stream-worker-${evt.eventId}`,
        timestamp: new Date(base + 210_000).toISOString(),
        label: "Worker checks completed",
        detail: `${evt.advertiser} | ${evt.vertical}`,
        dotColor: "#C9A36B",
      });
    }

    if (evt.linkedCaseId) {
      entries.push({
        id: `stream-case-${evt.eventId}`,
        timestamp: new Date(base + 260_000).toISOString(),
        label: "Review case created",
        detail: evt.linkedCaseId,
        dotColor: "#F59E2E",
      });
    }

    if (evt.currentStatus === "Blocked") {
      entries.push({
        id: `stream-block-${evt.eventId}`,
        timestamp: new Date(base + 240_000).toISOString(),
        label: "Guardian blocked launch",
        detail: evt.advertiser,
        dotColor: "#B83A3A",
      });
    }

    if (evt.currentStatus === "Allowed") {
      entries.push({
        id: `stream-allowed-${evt.eventId}`,
        timestamp: new Date(base + 240_000).toISOString(),
        label: "Action allowed to proceed",
        detail: `${evt.advertiser} | ${evt.requestedAction.slice(0, 50)}`,
        dotColor: "#6FB089",
      });
    }

    if (i === 2) {
      entries.push({
        id: "stream-policy-match-1",
        timestamp: new Date(base + 230_000).toISOString(),
        label: "Policy matched",
        detail: "POL-FIN-007 | Financial advertiser certification",
        dotColor: "#9B89B8",
      });
    }

    if (i === 4) {
      entries.push({
        id: "stream-audit-export-1",
        timestamp: new Date(base + 300_000).toISOString(),
        label: "Audit payload exported",
        detail: "Operator-initiated export",
        dotColor: "#C7B8DC",
      });
    }

    i++;
  }

  return entries.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}
