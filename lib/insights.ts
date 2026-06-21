import { SCENARIOS } from "./scenarios";
import { runOrchestrator } from "./orchestratorEngine";
import { evaluateGuardian } from "./guardianEngine";
import { interceptionCoverage } from "./runtimeEvents";

export interface Insights {
  topPolicy: { policyId: string; title: string; count: number } | null;
  highestRisk: { scenarioId: string; advertiser: string; risk: number; decision: string } | null;
  humanReviewLoad: { percent: number; needsReview: number; total: number };
  interceptionCoverage: { percent: number; evaluated: number; total: number };
}

export function computeInsights(): Insights {
  const counts: Record<string, { title: string; count: number }> = {};
  let highest: Insights["highestRisk"] = null;
  let needsReview = 0;

  SCENARIOS.forEach((s) => {
    const g = evaluateGuardian(s, runOrchestrator(s));
    g.matchedPolicies.forEach((p) => {
      if (!counts[p.policyId]) counts[p.policyId] = { title: p.title, count: 0 };
      counts[p.policyId].count++;
    });
    if (!highest || g.riskScore > highest.risk) {
      highest = {
        scenarioId: s.id,
        advertiser: s.advertiser,
        risk: g.riskScore,
        decision: g.decision,
      };
    }
    if (g.humanReviewRequired) needsReview++;
  });

  const topEntry = Object.entries(counts).sort((a, b) => b[1].count - a[1].count)[0];
  const topPolicy = topEntry
    ? { policyId: topEntry[0], title: topEntry[1].title, count: topEntry[1].count }
    : null;

  return {
    topPolicy,
    highestRisk: highest,
    humanReviewLoad: {
      needsReview,
      total: SCENARIOS.length,
      percent: Math.round((needsReview / SCENARIOS.length) * 100),
    },
    interceptionCoverage: interceptionCoverage(),
  };
}
