/**
 * lib/executiveMetrics.ts — Phase 3D
 *
 * All metrics are deterministic — derived purely from seeded SCENARIOS,
 * the policy kernel (matchPolicies), evaluateGuardian, and the static
 * AGENT_REGISTRY + getRuntimeEvents(). No randomness; no external calls.
 */

import { SCENARIOS } from "./scenarios";
import { runOrchestrator } from "./orchestratorEngine";
import { evaluateGuardian } from "./guardianEngine";
import { POLICY_RULES } from "./policies";
import { AGENT_REGISTRY } from "./agentRegistry";
import { getRuntimeEvents } from "./runtimeEvents";
import type { GuardianDecision } from "./types";

// ─── Shared evaluation helper ─────────────────────────────────────────────────

interface EvaluatedRow {
  scenario: (typeof SCENARIOS)[0];
  guardian: ReturnType<typeof evaluateGuardian>;
}

function evaluateAll(): EvaluatedRow[] {
  return SCENARIOS.map((s) => ({
    scenario: s,
    guardian: evaluateGuardian(s, runOrchestrator(s)),
  }));
}

// ─── Executive Metrics ────────────────────────────────────────────────────────

export interface ExecutiveMetrics {
  /** Total number of scenarios evaluated (= number of agentic action evaluations in the dataset) */
  actionsEvaluated: number;
  actionsAllowed: number;
  actionsAllowedWithConditions: number;
  actionsRestricted: number;
  actionsEscalated: number;
  actionsBlocked: number;

  /** Percentage of evaluations that required a human reviewer */
  humanReviewRate: number;

  /** Average Guardian risk score across all evaluations (0–100) */
  avgRiskScore: number;

  /** Policy that fired most across all scenarios */
  topPolicyTriggered: { policyId: string; title: string; hitCount: number } | null;

  /** Vertical with the highest average risk score across its scenarios */
  highestRiskVertical: { name: string; avgRisk: number } | null;

  /** Market with the highest average risk score across its scenarios */
  highestRiskMarket: { name: string; avgRisk: number } | null;

  /**
   * Runtime interception coverage (%).
   *
   * Formula:
   *   coverage = (evaluated_events / total_events) × 100
   *
   * "Evaluated" events are those where Guardian has returned a decision
   * (status ≠ "New"). Total events = all events in the live event feed
   * (pending synthetic + resolved scenario-mapped). This reflects what
   * fraction of agentic actions the Guardian runtime has actually assessed.
   */
  runtimeInterceptionCoverage: number;

  /**
   * Estimated number of risky actions prevented.
   *
   * Derivation: count of scenario evaluations whose decision was BLOCK or
   * ESCALATE (actions that, without Guardian, would have proceeded unchecked).
   * RESTRICT is excluded because those actions are partially allowed with
   * guardrails rather than fully halted.
   */
  estimatedRiskyActionsPrevented: number;

  /** Percentage agreement between human reviewer outcomes and Guardian decisions */
  reviewerAgreementRate: number;
}

export function computeExecutiveMetrics(): ExecutiveMetrics {
  const rows = evaluateAll();

  const byDecision: Record<GuardianDecision, number> = {
    ALLOW: 0,
    ALLOW_WITH_CONDITIONS: 0,
    RESTRICT: 0,
    ESCALATE: 0,
    BLOCK: 0,
  };
  let humanReviewCount = 0;
  let riskSum = 0;

  // Policy hit counts
  const policyCounts: Record<string, { title: string; count: number }> = {};

  // Vertical and market risk aggregation
  const verticalRisk: Record<string, { sum: number; count: number }> = {};
  const marketRisk: Record<string, { sum: number; count: number }> = {};

  for (const { scenario, guardian } of rows) {
    byDecision[guardian.decision]++;
    if (guardian.humanReviewRequired) humanReviewCount++;
    riskSum += guardian.riskScore;

    guardian.matchedPolicies.forEach((p) => {
      if (!policyCounts[p.policyId]) policyCounts[p.policyId] = { title: p.title, count: 0 };
      policyCounts[p.policyId].count++;
    });

    const v = scenario.vertical;
    if (!verticalRisk[v]) verticalRisk[v] = { sum: 0, count: 0 };
    verticalRisk[v].sum += guardian.riskScore;
    verticalRisk[v].count++;

    const m = scenario.market;
    if (!marketRisk[m]) marketRisk[m] = { sum: 0, count: 0 };
    marketRisk[m].sum += guardian.riskScore;
    marketRisk[m].count++;
  }

  const total = rows.length;

  // Top policy
  const topPolicyEntry = Object.entries(policyCounts).sort((a, b) => b[1].count - a[1].count)[0];
  const topPolicyTriggered = topPolicyEntry
    ? { policyId: topPolicyEntry[0], title: topPolicyEntry[1].title, hitCount: topPolicyEntry[1].count }
    : null;

  // Highest-risk vertical
  const vertEntries = Object.entries(verticalRisk).map(([name, { sum, count }]) => ({
    name,
    avgRisk: Math.round(sum / count),
  }));
  vertEntries.sort((a, b) => b.avgRisk - a.avgRisk);
  const highestRiskVertical = vertEntries[0] ?? null;

  // Highest-risk market
  const mktEntries = Object.entries(marketRisk).map(([name, { sum, count }]) => ({
    name,
    avgRisk: Math.round(sum / count),
  }));
  mktEntries.sort((a, b) => b.avgRisk - a.avgRisk);
  const highestRiskMarket = mktEntries[0] ?? null;

  // Runtime interception coverage
  // coverage = evaluated_events / total_events
  // Evaluated = status ≠ "New" (Guardian has run); Total = all events in feed
  const events = getRuntimeEvents();
  const evaluatedEvents = events.filter((e) => e.currentStatus !== "New").length;
  const runtimeInterceptionCoverage =
    events.length === 0 ? 0 : Math.round((evaluatedEvents / events.length) * 100);

  // Estimated risky actions prevented = BLOCK + ESCALATE
  const estimatedRiskyActionsPrevented = byDecision.BLOCK + byDecision.ESCALATE;

  return {
    actionsEvaluated: total,
    actionsAllowed: byDecision.ALLOW,
    actionsAllowedWithConditions: byDecision.ALLOW_WITH_CONDITIONS,
    actionsRestricted: byDecision.RESTRICT,
    actionsEscalated: byDecision.ESCALATE,
    actionsBlocked: byDecision.BLOCK,
    humanReviewRate: total === 0 ? 0 : Math.round((humanReviewCount / total) * 100),
    avgRiskScore: total === 0 ? 0 : Math.round(riskSum / total),
    topPolicyTriggered,
    highestRiskVertical,
    highestRiskMarket,
    runtimeInterceptionCoverage,
    estimatedRiskyActionsPrevented,
    reviewerAgreementRate: computeReviewerAgreementRate(),
  };
}

// ─── Reviewer Agreement Rate ──────────────────────────────────────────────────

/**
 * computeReviewerAgreementRate()
 *
 * Definition: percentage of cases where the latest human review outcome
 * upholds (agrees with) the original Guardian decision.
 *
 * Agreement mapping:
 *   - "Upheld Guardian Decision"      → AGREE  (reviewer confirmed Guardian was right)
 *   - "Approved with Conditions"       → AGREE  (aligns with ALLOW_WITH_CONDITIONS intent)
 *   - "Escalated to Policy"            → AGREE  (escalation outcome aligns with ESCALATE)
 *   - "Closed as Duplicate"            → neutral (excluded from calculation)
 *   - "No Action Needed"               → AGREE  (reviewer found no issue)
 *   - "Reversed after Evidence"        → DISAGREE (reviewer overturned Guardian)
 *
 * These seed outcomes are deterministic mocks derived from the same seeded
 * case data. In production, these would come from the real outcomes store.
 */

interface SeedOutcome {
  scenarioId: string;
  guardianDecision: GuardianDecision;
  reviewerOutcome:
    | "Upheld Guardian Decision"
    | "Approved with Conditions"
    | "Reversed after Evidence"
    | "Escalated to Policy"
    | "No Action Needed"
    | "Closed as Duplicate";
}

/**
 * Deterministic seed review outcomes for the cases generated from scenarios.
 * These mirror realistic reviewer behaviour against the Guardian decisions.
 */
const SEED_REVIEW_OUTCOMES: SeedOutcome[] = [
  // misleading_finance → BLOCK → reviewer upheld
  {
    scenarioId: "misleading_finance",
    guardianDecision: "BLOCK",
    reviewerOutcome: "Upheld Guardian Decision",
  },
  // suspicious_budget → ESCALATE → policy specialist confirmed escalation
  {
    scenarioId: "suspicious_budget",
    guardianDecision: "ESCALATE",
    reviewerOutcome: "Escalated to Policy",
  },
  // risky_ai_targeting → RESTRICT → reviewer upheld (fair-targeting guardrail confirmed)
  {
    scenarioId: "risky_ai_targeting",
    guardianDecision: "RESTRICT",
    reviewerOutcome: "Upheld Guardian Decision",
  },
  // appeal_review → ESCALATE → reviewer reversed after advertiser provided substantiation
  // (this is the one disagreement case, used for CalibrationPanel deep-links)
  {
    scenarioId: "appeal_review",
    guardianDecision: "ESCALATE",
    reviewerOutcome: "Reversed after Evidence",
  },
];

const AGREEMENT_OUTCOMES = new Set([
  "Upheld Guardian Decision",
  "Approved with Conditions",
  "Escalated to Policy",
  "No Action Needed",
]);

export function computeReviewerAgreementRate(): number {
  const countable = SEED_REVIEW_OUTCOMES.filter(
    (o) => o.reviewerOutcome !== "Closed as Duplicate",
  );
  if (countable.length === 0) return 100;
  const agreed = countable.filter((o) => AGREEMENT_OUTCOMES.has(o.reviewerOutcome)).length;
  return Math.round((agreed / countable.length) * 100);
}

export function getDisagreementCases(): SeedOutcome[] {
  return SEED_REVIEW_OUTCOMES.filter((o) => !AGREEMENT_OUTCOMES.has(o.reviewerOutcome));
}

// ─── Policy Pressure ──────────────────────────────────────────────────────────

export interface PolicyPressureRow {
  policyId: string;
  title: string;
  hitCount: number;
  reviewLoadCount: number; // scenarios that required human review and matched this policy
  blockCount: number;
  escalateCount: number;
}

export function computePolicyPressure(): {
  topByFiring: PolicyPressureRow[];
  topByReviewLoad: PolicyPressureRow[];
  topByBlock: PolicyPressureRow[];
  topByEscalate: PolicyPressureRow[];
  zerohits: { policyId: string; title: string; status: string }[];
} {
  const rows = evaluateAll();
  const pressure: Record<string, PolicyPressureRow> = {};

  // Initialise every policy
  for (const p of POLICY_RULES) {
    pressure[p.id] = {
      policyId: p.id,
      title: p.title,
      hitCount: 0,
      reviewLoadCount: 0,
      blockCount: 0,
      escalateCount: 0,
    };
  }

  for (const { guardian } of rows) {
    for (const p of guardian.matchedPolicies) {
      if (!pressure[p.policyId]) {
        pressure[p.policyId] = {
          policyId: p.policyId,
          title: p.title,
          hitCount: 0,
          reviewLoadCount: 0,
          blockCount: 0,
          escalateCount: 0,
        };
      }
      pressure[p.policyId].hitCount++;
      if (guardian.humanReviewRequired) pressure[p.policyId].reviewLoadCount++;
      if (guardian.decision === "BLOCK") pressure[p.policyId].blockCount++;
      if (guardian.decision === "ESCALATE") pressure[p.policyId].escalateCount++;
    }
  }

  const all = Object.values(pressure);
  const hitting = all.filter((r) => r.hitCount > 0);
  const zero = POLICY_RULES.filter((p) => !hitting.find((r) => r.policyId === p.id)).map((p) => ({
    policyId: p.id,
    title: p.title,
    status: p.status,
  }));

  const top5 = (arr: PolicyPressureRow[], key: keyof PolicyPressureRow) =>
    [...arr].sort((a, b) => (b[key] as number) - (a[key] as number)).slice(0, 5);

  return {
    topByFiring: top5(hitting, "hitCount"),
    topByReviewLoad: top5(hitting, "reviewLoadCount"),
    topByBlock: top5(hitting, "blockCount"),
    topByEscalate: top5(hitting, "escalateCount"),
    zerohits: zero,
  };
}

// ─── Agent Risk Leaderboard ───────────────────────────────────────────────────

export type LeaderboardSortKey = "interventions" | "blocked" | "escalationRate" | "avgRisk";

export interface AgentLeaderboardRow {
  agentId: string;
  name: string;
  type: string;
  trustTier: string;
  totalEvents: number;
  interventions: number;
  blockedActions: number;
  escalationRate: number; // 0–100 %
  avgRiskScore: number;
}

export function computeAgentLeaderboard(sort: LeaderboardSortKey = "interventions"): AgentLeaderboardRow[] {
  const events = getRuntimeEvents();

  const rowMap: Record<string, AgentLeaderboardRow> = {};

  // Initialise from registry
  for (const agent of AGENT_REGISTRY) {
    rowMap[agent.agentId] = {
      agentId: agent.agentId,
      name: agent.name,
      type: agent.type,
      trustTier: agent.trustTier,
      totalEvents: 0,
      interventions: 0,
      blockedActions: 0,
      escalationRate: 0,
      avgRiskScore: 0,
    };
  }

  // Tally risk scores per agent from scenario evaluations
  const agentRiskSums: Record<string, { sum: number; count: number }> = {};

  for (const { scenario, guardian } of evaluateAll()) {
    // Determine which registry agent was the source for this scenario
    const evt = events.find((e) => e.linkedScenarioId === scenario.id);
    const agentId = evt?.sourceAgentId;
    if (!agentId || !rowMap[agentId]) continue;

    if (!agentRiskSums[agentId]) agentRiskSums[agentId] = { sum: 0, count: 0 };
    agentRiskSums[agentId].sum += guardian.riskScore;
    agentRiskSums[agentId].count++;
  }

  // Tally event metrics
  const escalatedCounts: Record<string, number> = {};
  for (const evt of events) {
    const id = evt.sourceAgentId;
    if (!id || !rowMap[id]) continue;
    rowMap[id].totalEvents++;
    if (
      evt.currentStatus === "Intercepted" ||
      evt.currentStatus === "Blocked" ||
      evt.currentStatus === "Escalated"
    ) {
      rowMap[id].interventions++;
    }
    if (evt.currentStatus === "Blocked" || evt.currentStatus === "Intercepted") {
      rowMap[id].blockedActions++;
    }
    if (evt.currentStatus === "Escalated") {
      escalatedCounts[id] = (escalatedCounts[id] ?? 0) + 1;
    }
  }

  // Finalise derived metrics
  for (const row of Object.values(rowMap)) {
    row.escalationRate =
      row.totalEvents === 0
        ? 0
        : Math.round(((escalatedCounts[row.agentId] ?? 0) / row.totalEvents) * 100);
    const rs = agentRiskSums[row.agentId];
    row.avgRiskScore = rs && rs.count > 0 ? Math.round(rs.sum / rs.count) : 0;
  }

  const active = Object.values(rowMap).filter((r) => r.totalEvents > 0);

  const sortFn: Record<LeaderboardSortKey, (a: AgentLeaderboardRow, b: AgentLeaderboardRow) => number> = {
    interventions: (a, b) => b.interventions - a.interventions,
    blocked: (a, b) => b.blockedActions - a.blockedActions,
    escalationRate: (a, b) => b.escalationRate - a.escalationRate,
    avgRisk: (a, b) => b.avgRiskScore - a.avgRiskScore,
  };

  return active.sort(sortFn[sort]);
}
