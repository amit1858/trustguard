import { SCENARIOS, getScenario } from "./scenarios";
import { runOrchestrator } from "./orchestratorEngine";
import { evaluateGuardian } from "./guardianEngine";
import { SLA_DUE_AT_POOL, computeSlaState } from "./sla";
import type { SlaState } from "./sla";
import type {
  GuardianDecision,
  GuardianOutput,
  RiskLevel,
  Scenario,
  EvidenceCategory,
  EvidenceRequest,
  AssignmentHistoryEntry,
  QualityMarker,
} from "./types";

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
  slaDueAt?: string;
  slaState?: SlaState;
  owner: string; // "Unassigned" or username
  status: CaseStatus;
  createdAt: string;
  updatedAt: string;
  reasonCodes: string[];
  matchedPolicies: { policyId: string; title: string }[];
  nextBestAction: string;
  notes: string[]; // reviewer notes
  // Phase 3B
  assignmentHistory: AssignmentHistoryEntry[];
  evidenceRequests: EvidenceRequest[];
  qualityMarker: QualityMarker;
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

// ── Phase 3B: per-scenario seed extras ───────────────────────────────────────

interface SeedExtras {
  owner?: string;
  status?: CaseStatus;
  assignmentHistory?: AssignmentHistoryEntry[];
  evidenceRequests?: EvidenceRequest[];
  qualityMarker?: QualityMarker;
}

const SEED_EXTRAS: Record<string, SeedExtras> = {
  misleading_finance: {
    owner: "Sarah Chen",
    status: "In Review",
    assignmentHistory: [
      {
        ownerId: "system",
        ownerName: "System (Auto-triage)",
        assignedAt: "2026-06-21T06:00:00Z",
        source: "queue_rule",
      },
      {
        ownerId: "sarah_chen",
        ownerName: "Sarah Chen",
        assignedAt: "2026-06-21T08:30:00Z",
        source: "manual",
      },
    ],
    evidenceRequests: [
      {
        id: "er_mf_1",
        category: "business_verification" as EvidenceCategory,
        status: "accepted",
        requestedAt: "2026-06-21T08:45:00Z",
        updatedAt: "2026-06-21T10:00:00Z",
        note: "Business registration verified — GST confirmed.",
      },
      {
        id: "er_mf_2",
        category: "claim_substantiation" as EvidenceCategory,
        status: "insufficient",
        requestedAt: "2026-06-21T08:50:00Z",
        updatedAt: "2026-06-21T11:00:00Z",
        note: "Advertiser provided a blog post, not a peer-reviewed study. Rejected.",
      },
      {
        id: "er_mf_3",
        category: "landing_page_disclosure" as EvidenceCategory,
        status: "requested",
        requestedAt: "2026-06-21T09:00:00Z",
        note: "APR and lender identity must be disclosed above the fold.",
      },
    ],
    qualityMarker: "needs_qa",
  },
  suspicious_budget: {
    owner: "Marcus Lee",
    status: "In Review",
    assignmentHistory: [
      {
        ownerId: "marcus_lee",
        ownerName: "Marcus Lee",
        assignedAt: "2026-06-21T07:00:00Z",
        source: "queue_rule",
      },
    ],
    evidenceRequests: [
      {
        id: "er_sb_1",
        category: "payment_instrument_proof" as EvidenceCategory,
        status: "received",
        requestedAt: "2026-06-21T07:15:00Z",
        updatedAt: "2026-06-21T09:30:00Z",
        note: "Card verification documents received — pending specialist review.",
      },
      {
        id: "er_sb_2",
        category: "business_verification" as EvidenceCategory,
        status: "requested",
        requestedAt: "2026-06-21T07:20:00Z",
        note: "Verify current linked account relationships and ownership structure.",
      },
    ],
    qualityMarker: "policy_calibration_needed",
  },
  risky_ai_targeting: {
    qualityMarker: "qa_passed",
  },
  appeal_review: {
    assignmentHistory: [
      {
        ownerId: "system",
        ownerName: "System (Auto-triage)",
        assignedAt: "2026-06-21T05:00:00Z",
        source: "system",
      },
    ],
    evidenceRequests: [
      {
        id: "er_ar_1",
        category: "appeal_explanation" as EvidenceCategory,
        status: "requested",
        requestedAt: "2026-06-21T05:10:00Z",
        note: "Advertiser must explain deviation from health claim policy and proposed remedy.",
      },
      {
        id: "er_ar_2",
        category: "claim_substantiation" as EvidenceCategory,
        status: "received",
        requestedAt: "2026-06-21T05:15:00Z",
        updatedAt: "2026-06-21T08:00:00Z",
        note: "Study link received — pending policy specialist review of methodology.",
      },
    ],
    qualityMarker: "not_reviewed",
  },
};

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
    .map(({ scenario, guardian }, idx): CaseRecord => {
      const priority = priorityFromDecision(guardian.decision, guardian.riskScore);
      const slaDueAt = SLA_DUE_AT_POOL[idx % 4];
      const extras = SEED_EXTRAS[scenario.id] ?? {};
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
        slaDueAt,
        slaState: computeSlaState(slaDueAt),
        owner: extras.owner ?? "Unassigned",
        status: extras.status ?? "New",
        createdAt: now,
        updatedAt: now,
        reasonCodes: guardian.reasonCodes,
        matchedPolicies: guardian.matchedPolicies.map((p) => ({ policyId: p.policyId, title: p.title })),
        nextBestAction: nextBestAction(guardian.decision),
        notes: [],
        assignmentHistory: extras.assignmentHistory ?? [],
        evidenceRequests: extras.evidenceRequests ?? [],
        qualityMarker: extras.qualityMarker ?? "not_reviewed",
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

// ─── Phase 3B: Quality Marker & Evidence Request constants ───────────────────

export const QUALITY_MARKER_LABELS: Record<QualityMarker, string> = {
  not_reviewed: "Not Reviewed",
  needs_qa: "Needs QA",
  qa_passed: "QA Passed",
  policy_calibration_needed: "Policy Cal.",
};

export const QUALITY_MARKER_COLORS: Record<QualityMarker, string> = {
  not_reviewed: "#7F776B",
  needs_qa: "#F59E2E",
  qa_passed: "#6FB089",
  policy_calibration_needed: "#D97448",
};

export const EVIDENCE_CATEGORY_LABELS: Record<EvidenceCategory, string> = {
  business_verification: "Business Verification",
  certification_document: "Certification Document",
  landing_page_disclosure: "Landing Page Disclosure",
  claim_substantiation: "Claim Substantiation",
  payment_instrument_proof: "Payment Instrument Proof",
  appeal_explanation: "Appeal Explanation",
};

export const EVIDENCE_REQUEST_STATUS_LABELS: Record<string, string> = {
  requested: "Requested",
  received: "Received",
  insufficient: "Insufficient",
  accepted: "Accepted",
};

export const EVIDENCE_REQUEST_STATUS_COLORS: Record<string, string> = {
  requested: "#F59E2E",
  received: "#8FA1B3",
  insufficient: "#B83A3A",
  accepted: "#6FB089",
};
