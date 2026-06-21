import { SCENARIOS, getScenario } from "./scenarios";
import { runOrchestrator } from "./orchestratorEngine";
import { evaluateGuardian } from "./guardianEngine";
import type { GuardianDecision, GuardianOutput, RiskLevel, Scenario } from "./types";

export type CaseStatus =
  | "New"
  | "In Review"
  | "Waiting for Advertiser"
  | "Approved with Conditions"
  | "Blocked"
  | "Escalated to Policy"
  | "Closed";

export type CasePriority = "Low" | "Medium" | "High" | "Critical";

export type ReviewerOutcome =
  | "Upheld Guardian Decision"
  | "Approved with Conditions"
  | "Reversed after Evidence"
  | "Escalated to Policy"
  | "Closed as Duplicate"
  | "No Action Needed";

export type FinalEnforcementAction =
  | "Campaign remains blocked"
  | "Campaign can launch with conditions"
  | "Advertiser evidence requested"
  | "Sent to policy specialist"
  | "Campaign restricted"
  | "Case closed";

export interface ReviewOutcome {
  outcomeId: string;
  caseId: string;
  guardianDecision: import("./types").GuardianDecision;
  reviewerOutcome: ReviewerOutcome;
  finalEnforcementAction: FinalEnforcementAction;
  reviewer: string;
  timestamp: string;
  conditions: string[];
  rationale: string;
  linkedLedgerEventId?: string;
}

export interface CaseRecord {
  caseId: string;
  scenarioId: string;
  advertiserName: string;
  campaignName: string;
  market: string;
  vertical: string;
  requestedAction: string;
  guardianDecision: GuardianDecision;
  riskScore: number;
  riskLevel: RiskLevel;
  priority: CasePriority;
  sla: string; // e.g. "4h", "24h"
  owner: string; // "Unassigned" or username
  status: CaseStatus;
  createdAt: string;
  updatedAt: string;
  reasonCodes: string[];
  matchedPolicies: { policyId: string; title: string }[];
  nextBestAction: string;
  notes: string[]; // reviewer notes
}

function priorityFromDecision(decision: GuardianDecision, risk: number): CasePriority {
  if (decision === "BLOCK" || risk >= 80) return "Critical";
  if (decision === "ESCALATE" || risk >= 60) return "High";
  if (decision === "RESTRICT" || risk >= 40) return "Medium";
  return "Low";
}

function slaFromPriority(p: CasePriority): string {
  switch (p) {
    case "Critical":
      return "2h";
    case "High":
      return "4h";
    case "Medium":
      return "24h";
    default:
      return "48h";
  }
}

function nextBestAction(decision: GuardianDecision): string {
  switch (decision) {
    case "BLOCK":
      return "Confirm block and notify advertiser with reason codes.";
    case "ESCALATE":
      return "Assign to policy specialist for human review.";
    case "RESTRICT":
      return "Apply targeting guardrails and request advertiser acknowledgement.";
    case "ALLOW_WITH_CONDITIONS":
      return "Request advertiser certification before launch.";
    default:
      return "Monitor.";
  }
}

function campaignName(s: Scenario): string {
  // Stable campaign label derived from scenario
  return `${s.advertiser.split(" ")[0]}-${s.market.replace(/\s+/g, "")}-Q3`;
}

function caseIdFor(s: Scenario): string {
  // Stable, readable case id (no random per render)
  return `TG-${s.id.toUpperCase().slice(0, 4)}-${s.market.replace(/\s+/g, "").slice(0, 3).toUpperCase()}`;
}

interface SeedRow {
  scenario: Scenario;
  guardian: GuardianOutput;
}

function evaluateAll(): SeedRow[] {
  return SCENARIOS.map((s) => ({
    scenario: s,
    guardian: evaluateGuardian(s, runOrchestrator(s)),
  }));
}

/**
 * Build the initial set of cases from scenarios that produced a high-risk Guardian
 * decision (ESCALATE / BLOCK / RESTRICT). These seed the Review Queue on first load.
 */
export function seedCasesFromScenarios(): CaseRecord[] {
  const now = new Date().toISOString();
  return evaluateAll()
    .filter(({ guardian }) => ["ESCALATE", "BLOCK", "RESTRICT"].includes(guardian.decision))
    .map(({ scenario, guardian }): CaseRecord => {
      const priority = priorityFromDecision(guardian.decision, guardian.riskScore);
      return {
        caseId: caseIdFor(scenario),
        scenarioId: scenario.id,
        advertiserName: scenario.advertiser,
        campaignName: campaignName(scenario),
        market: scenario.market,
        vertical: scenario.vertical,
        requestedAction: scenario.requestedAction,
        guardianDecision: guardian.decision,
        riskScore: guardian.riskScore,
        riskLevel: guardian.riskLevel,
        priority,
        sla: slaFromPriority(priority),
        owner: "Unassigned",
        status: "New",
        createdAt: now,
        updatedAt: now,
        reasonCodes: guardian.reasonCodes,
        matchedPolicies: guardian.matchedPolicies.map((p) => ({ policyId: p.policyId, title: p.title })),
        nextBestAction: nextBestAction(guardian.decision),
        notes: [],
      };
    })
    .sort((a, b) => b.riskScore - a.riskScore);
}

/** Re-evaluate the underlying scenario for a case (Guardian decision is immutable per case). */
export function getScenarioForCase(c: CaseRecord) {
  const scenario = getScenario(c.scenarioId);
  const orchestrator = runOrchestrator(scenario);
  const guardian = evaluateGuardian(scenario, orchestrator);
  return { scenario, orchestrator, guardian };
}

export const PRIORITY_COLORS: Record<CasePriority, string> = {
  Critical: "#B83A3A",
  High: "#D97448",
  Medium: "#F59E2E",
  Low: "#6FB089",
};

export const STATUS_COLORS: Record<CaseStatus, string> = {
  New: "#C9A36B",
  "In Review": "#8FA1B3",
  "Waiting for Advertiser": "#F59E2E",
  "Approved with Conditions": "#6FB089",
  Blocked: "#B83A3A",
  "Escalated to Policy": "#D97448",
  Closed: "#7F776B",
};

export const DECISION_COLORS: Record<GuardianDecision, string> = {
  ALLOW: "#6FB089",
  ALLOW_WITH_CONDITIONS: "#F59E2E",
  RESTRICT: "#9B89B8",
  ESCALATE: "#D97448",
  BLOCK: "#B83A3A",
};
