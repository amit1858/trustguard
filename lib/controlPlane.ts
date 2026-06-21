import { SCENARIOS } from "./scenarios";
import { runOrchestrator } from "./orchestratorEngine";
import { evaluateGuardian } from "./guardianEngine";
import type { GuardianDecision, Scenario, GuardianOutput } from "./types";

export interface ControlPlaneMetrics {
  totalActions: number;
  byDecision: Record<GuardianDecision, number>;
  intercepted: number; // anything not pure ALLOW
  humanReviews: number;
  policiesFired: number;
  avgRisk: number;
}

export interface ReviewQueueItem {
  scenarioId: string;
  advertiser: string;
  vertical: string;
  market: string;
  decision: GuardianDecision;
  riskScore: number;
  reasonCodes: string[];
  requestedAction: string;
  proposed: string;
}

interface Evaluated {
  scenario: Scenario;
  guardian: GuardianOutput;
}

function evaluateAll(): Evaluated[] {
  return SCENARIOS.map((s) => {
    const orch = runOrchestrator(s);
    const guardian = evaluateGuardian(s, orch);
    return { scenario: s, guardian };
  });
}

export function getControlPlaneMetrics(): ControlPlaneMetrics {
  const rows = evaluateAll();
  const byDecision: Record<GuardianDecision, number> = {
    ALLOW: 0,
    ALLOW_WITH_CONDITIONS: 0,
    RESTRICT: 0,
    ESCALATE: 0,
    BLOCK: 0,
  };
  let intercepted = 0;
  let humanReviews = 0;
  let policiesFired = 0;
  let riskSum = 0;
  rows.forEach(({ guardian }) => {
    byDecision[guardian.decision]++;
    if (guardian.decision !== "ALLOW") intercepted++;
    if (guardian.humanReviewRequired) humanReviews++;
    policiesFired += guardian.matchedPolicies.length;
    riskSum += guardian.riskScore;
  });
  return {
    totalActions: rows.length,
    byDecision,
    intercepted,
    humanReviews,
    policiesFired,
    avgRisk: Math.round(riskSum / rows.length),
  };
}

export function getReviewQueue(): ReviewQueueItem[] {
  return evaluateAll()
    .filter(({ guardian }) => guardian.humanReviewRequired || guardian.decision === "ESCALATE" || guardian.decision === "BLOCK")
    .map(({ scenario, guardian }) => ({
      scenarioId: scenario.id,
      advertiser: scenario.advertiser,
      vertical: scenario.vertical,
      market: scenario.market,
      decision: guardian.decision,
      riskScore: guardian.riskScore,
      reasonCodes: guardian.reasonCodes,
      requestedAction: scenario.requestedAction,
      proposed: scenario.interception.proposed,
    }))
    .sort((a, b) => b.riskScore - a.riskScore);
}
