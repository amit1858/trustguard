import { runOrchestrator } from "./orchestratorEngine";
import { evaluateGuardian } from "./guardianEngine";
import type { Scenario, WorkerFinding, GuardianOutput } from "./types";

export type ClaimRisk = "none" | "mild" | "misleading";
export type DisclosureQuality = "strong" | "adequate" | "weak";
export type RiskLevelChoice = "low" | "medium" | "high";
export type YesNo = "no" | "yes";
export type CertStatus = "certified" | "missing" | "not_required";

export interface SimInputs {
  advertiserName: string;
  vertical: string;
  market: string;
  requestedAction: string;
  monthlyBudget: number;
  budgetMultiplier: number;
  certification: CertStatus;
  creativeClaimRisk: ClaimRisk;
  landingDisclosure: DisclosureQuality;
  linkedAccountRisk: RiskLevelChoice;
  paymentChanged: YesNo;
  abnormalTraffic: YesNo;
  sensitiveTargeting: YesNo;
  accountAgeMonths: number;
  priorViolations: number;
}

export const DEFAULT_SIM: SimInputs = {
  advertiserName: "Acme Advertiser",
  vertical: "Financial Services",
  market: "India",
  requestedAction: "Launch campaign",
  monthlyBudget: 25000,
  budgetMultiplier: 1,
  certification: "missing",
  creativeClaimRisk: "mild",
  landingDisclosure: "adequate",
  linkedAccountRisk: "low",
  paymentChanged: "no",
  abnormalTraffic: "no",
  sensitiveTargeting: "no",
  accountAgeMonths: 9,
  priorViolations: 0,
};

const REGULATED = ["Financial Services", "Healthcare", "Health", "Supplements", "Employment", "Credit"];

function inputsToSignals(i: SimInputs): string[] {
  const signals: string[] = [];
  if (REGULATED.includes(i.vertical)) signals.push("regulated_vertical");
  if (i.certification === "missing" && REGULATED.includes(i.vertical))
    signals.push("missing_certification");
  if (i.creativeClaimRisk === "misleading" && i.vertical === "Financial Services")
    signals.push("misleading_financial_claim");
  if (i.landingDisclosure === "weak") signals.push("weak_landing_disclosure");
  if (i.linkedAccountRisk !== "low") signals.push("linked_account_risk");
  if (i.paymentChanged === "yes") signals.push("payment_change");
  if (i.abnormalTraffic === "yes") signals.push("abnormal_traffic");
  if (i.budgetMultiplier >= 2) signals.push("high_impact_action");
  if (i.sensitiveTargeting === "yes" && ["Employment", "Housing", "Credit"].includes(i.vertical))
    signals.push("discriminatory_targeting", "sensitive_vertical_targeting");
  if (["Health", "Supplements"].includes(i.vertical) && i.creativeClaimRisk !== "none")
    signals.push("restricted_health_claim");
  if (["Health", "Supplements"].includes(i.vertical) && i.landingDisclosure === "weak")
    signals.push("weak_substantiation");
  return Array.from(new Set(signals));
}

function buildSimScenario(i: SimInputs): Scenario {
  const signals = inputsToSignals(i);
  // Build a single synthetic worker finding carrying all the signals
  const workerFindings: WorkerFinding[] = [
    {
      agentId: "advertiser_onboarding",
      agentName: "Advertiser Onboarding Agent",
      status: i.certification === "missing" ? "fail" : i.priorViolations > 0 ? "warning" : "pass",
      summary: `Account age ${i.accountAgeMonths} months, ${i.priorViolations} prior violations, ${i.certification} certification.`,
      evidence: [
        { label: "Vertical", detail: i.vertical },
        { label: "Market", detail: i.market },
      ],
      confidence: 0.9,
      recommendedAction: "—",
      signals: signals.filter((s) =>
        ["regulated_vertical", "missing_certification"].includes(s),
      ),
    },
    {
      agentId: "creative_policy",
      agentName: "Creative Policy Agent",
      status:
        i.creativeClaimRisk === "misleading"
          ? "fail"
          : i.creativeClaimRisk === "mild"
          ? "warning"
          : "pass",
      summary: `Creative claim risk: ${i.creativeClaimRisk}.`,
      evidence: [],
      confidence: 0.88,
      recommendedAction: "—",
      signals: signals.filter((s) =>
        ["misleading_financial_claim", "restricted_health_claim"].includes(s),
      ),
    },
    {
      agentId: "landing_page",
      agentName: "Landing Page Screening Agent",
      status:
        i.landingDisclosure === "weak"
          ? "fail"
          : i.landingDisclosure === "adequate"
          ? "warning"
          : "pass",
      summary: `Landing disclosure: ${i.landingDisclosure}.`,
      evidence: [],
      confidence: 0.86,
      recommendedAction: "—",
      signals: signals.filter((s) => ["weak_landing_disclosure", "weak_substantiation"].includes(s)),
    },
    {
      agentId: "compliance",
      agentName: "Compliance Agent",
      status: i.certification === "missing" && REGULATED.includes(i.vertical) ? "fail" : "pass",
      summary: `Certification: ${i.certification}, vertical: ${i.vertical}.`,
      evidence: [],
      confidence: 0.92,
      recommendedAction: "—",
      signals: [],
    },
    {
      agentId: "fraud_risk",
      agentName: "Fraud & Risk Screening Agent",
      status:
        i.linkedAccountRisk === "high" || i.paymentChanged === "yes" || i.abnormalTraffic === "yes"
          ? "fail"
          : i.linkedAccountRisk === "medium"
          ? "warning"
          : "pass",
      summary: `Linked acct: ${i.linkedAccountRisk}, payment changed: ${i.paymentChanged}, abnormal traffic: ${i.abnormalTraffic}.`,
      evidence: [],
      confidence: 0.84,
      recommendedAction: "—",
      signals: signals.filter((s) =>
        ["linked_account_risk", "payment_change", "abnormal_traffic"].includes(s),
      ),
    },
    {
      agentId: "campaign_optimization",
      agentName: "Campaign Optimization Agent",
      status:
        i.sensitiveTargeting === "yes" || i.budgetMultiplier >= 2 ? "warning" : "pass",
      summary: `Proposed budget ${i.budgetMultiplier}x current ($${(
        i.monthlyBudget * i.budgetMultiplier
      ).toLocaleString()}/mo), sensitive targeting: ${i.sensitiveTargeting}.`,
      evidence: [],
      confidence: 0.83,
      recommendedAction: "—",
      signals: signals.filter((s) =>
        ["high_impact_action", "discriminatory_targeting", "sensitive_vertical_targeting"].includes(s),
      ),
    },
  ];

  const scenario: Scenario = {
    id: "_simulated",
    title: "Simulated request",
    advertiser: i.advertiserName,
    vertical: i.vertical,
    market: i.market,
    requestedAction: i.requestedAction,
    shortLabel: "Simulated",
    expectedDecision: "ALLOW",
    summary: "Synthetic scenario built from Simulation Lab inputs.",
    workerFindings,
    orchestratorPlan: {
      planId: "plan_sim",
      goal: i.requestedAction,
      proposedActions: [i.requestedAction],
      steps: [],
      note: "Synthetic orchestrator plan.",
    },
    interception: {
      proposed: i.requestedAction,
      intercepted: "Guardian evaluation in progress",
      outcome: "—",
    },
  };
  return scenario;
}

export interface SimResult {
  inputs: SimInputs;
  scenario: Scenario;
  signals: string[];
  guardian: GuardianOutput;
}

export function simulate(inputs: SimInputs): SimResult {
  const scenario = buildSimScenario(inputs);
  const orch = runOrchestrator(scenario);
  const guardian = evaluateGuardian(scenario, orch);
  return { inputs, scenario, signals: inputsToSignals(inputs), guardian };
}

export interface SimDiff {
  riskDelta: number;
  triggeredPolicies: string[]; // present in next, not base
  resolvedPolicies: string[]; // present in base, not next
  newReasonCodes: string[];
  removedReasonCodes: string[];
  addedSignals: string[];
  removedSignals: string[];
}

export function diffSim(base: SimResult, next: SimResult): SimDiff {
  const basePol = new Set(base.guardian.matchedPolicies.map((p) => p.policyId));
  const nextPol = new Set(next.guardian.matchedPolicies.map((p) => p.policyId));
  const baseRc = new Set(base.guardian.reasonCodes);
  const nextRc = new Set(next.guardian.reasonCodes);
  const baseSig = new Set(base.signals);
  const nextSig = new Set(next.signals);
  return {
    riskDelta: next.guardian.riskScore - base.guardian.riskScore,
    triggeredPolicies: [...nextPol].filter((p) => !basePol.has(p)),
    resolvedPolicies: [...basePol].filter((p) => !nextPol.has(p)),
    newReasonCodes: [...nextRc].filter((r) => !baseRc.has(r)),
    removedReasonCodes: [...baseRc].filter((r) => !nextRc.has(r)),
    addedSignals: [...nextSig].filter((s) => !baseSig.has(s)),
    removedSignals: [...baseSig].filter((s) => !nextSig.has(s)),
  };
}
