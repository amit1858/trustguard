import { matchPolicies } from "./policies";
import type {
  Scenario,
  GuardianOutput,
  GuardianDecision,
  RiskLevel,
  AuditEvent,
} from "./types";
import type { OrchestratorRun } from "./orchestratorEngine";

function riskLevelFromScore(score: number): RiskLevel {
  if (score >= 85) return "critical";
  if (score >= 65) return "high";
  if (score >= 45) return "elevated";
  if (score >= 25) return "moderate";
  return "low";
}

// Deterministic policy kernel. AI output (if any) is only an explanation overlay.
export function evaluateGuardian(
  scenario: Scenario,
  orchestrator: OrchestratorRun,
  aiExplanation?: string,
): GuardianOutput {
  const allSignals = scenario.workerFindings.flatMap((f) => f.signals);
  const matched = matchPolicies(allSignals);

  // Risk scoring
  let risk = 0;
  scenario.workerFindings.forEach((f) => {
    if (f.status === "warning") risk += 12;
    if (f.status === "fail") risk += 28;
  });
  matched.forEach((p) => {
    if (p.severity === "critical") risk += 25;
    else if (p.severity === "high") risk += 15;
    else if (p.severity === "medium") risk += 8;
  });
  risk = Math.min(100, risk);

  // Decision kernel (deterministic, policy-precedence)
  let decision: GuardianDecision = "ALLOW";
  const reasonCodes: string[] = [];
  const allowed: string[] = [];
  const blocked: string[] = [];
  let humanReview = false;

  const has = (sig: string) => allSignals.includes(sig);

  if (has("discriminatory_targeting")) {
    decision = "RESTRICT";
    reasonCodes.push("FAIRNESS_RISK", "SENSITIVE_VERTICAL");
    blocked.push("Exclude age 50+ from targeting", "Narrow ZIP targeting on sensitive demographics");
    allowed.push("Run campaign with fair-audience targeting", "Use approved creatives unchanged");
    humanReview = false;
  } else if (has("misleading_financial_claim")) {
    decision = "BLOCK";
    reasonCodes.push("MISLEADING_CLAIM", "WEAK_DISCLOSURE", "REGULATED_VERTICAL");
    blocked.push("Launch campaign", "Run lead-capture landing page", "Pay out commissions");
    humanReview = true;
  } else if (has("appeal_auto_approval") && (has("restricted_health_claim") || has("weak_substantiation"))) {
    decision = "ESCALATE";
    reasonCodes.push("HEALTH_CLAIM_REVIEW", "WEAK_SUBSTANTIATION", "APPEAL_REQUIRES_HUMAN");
    blocked.push("Auto-approve appeal", "Relaunch rejected creative");
    allowed.push("Reopen appeal case", "Request substantiation from advertiser", "Route to policy specialist");
    humanReview = true;
  } else if (has("payment_change") && (has("abnormal_traffic") || has("linked_account_risk"))) {
    decision = "ESCALATE";
    reasonCodes.push("LINKED_ACCOUNT_RISK", "ABNORMAL_TRAFFIC", "PAYMENT_CHANGE");
    blocked.push("Increase budget 4x", "Expand geo targeting");
    allowed.push("Continue current campaign at existing budget");
    humanReview = true;
  } else if (has("missing_certification") && has("regulated_vertical")) {
    decision = "ALLOW_WITH_CONDITIONS";
    reasonCodes.push("REGULATED_VERTICAL", "CERTIFICATION_REQUIRED");
    allowed.push("Launch campaign after SCA certification uploaded", "Apply regional finance-vertical disclosures");
    blocked.push("Launch campaign immediately without certification");
    humanReview = false;
  } else {
    decision = "ALLOW";
    reasonCodes.push("ALL_CHECKS_PASS");
    allowed.push(...scenario.orchestratorPlan.proposedActions);
  }

  // Confidence: average of worker confidences, slightly penalized by warnings/fails
  const avgConf = scenario.workerFindings.reduce((a, f) => a + f.confidence, 0) / scenario.workerFindings.length;
  const penalty = scenario.workerFindings.filter((f) => f.status !== "pass").length * 0.02;
  const confidence = Math.max(0.6, Math.min(0.99, avgConf - penalty));

  const explanation =
    aiExplanation?.trim() ||
    buildDeterministicExplanation(scenario, decision, matched);

  // Audit
  const audit: AuditEvent[] = [
    ...orchestrator.audit,
    { ts: new Date().toISOString(), actor: "guardian", event: "Guardian evaluated policy and risk" },
    ...matched.map((p) => ({
      ts: new Date().toISOString(),
      actor: "guardian" as const,
      event: `Policy matched: ${p.policyId}`,
      detail: p.title,
    })),
    { ts: new Date().toISOString(), actor: "guardian", event: `Final decision issued: ${decision}`, detail: `Risk ${risk} (${riskLevelFromScore(risk)})` },
  ];
  if (humanReview) {
    audit.push({ ts: new Date().toISOString(), actor: "guardian", event: "Human review task created" });
  }

  return {
    decision,
    riskScore: risk,
    riskLevel: riskLevelFromScore(risk),
    confidence,
    reasonCodes,
    explanation,
    allowedActions: allowed,
    blockedActions: blocked,
    humanReviewRequired: humanReview,
    matchedPolicies: matched,
    auditTrail: audit,
  };
}

function buildDeterministicExplanation(
  scenario: Scenario,
  decision: GuardianDecision,
  matched: { title: string }[],
): string {
  const base = `For ${scenario.advertiser} (${scenario.vertical}, ${scenario.market}), the requested action "${scenario.requestedAction}" was evaluated against ${scenario.workerFindings.length} worker-agent findings and ${matched.length} policy rule(s).`;
  switch (decision) {
    case "ALLOW":
      return `${base} All checks passed. Guardian permits the orchestrator's proposed actions.`;
    case "ALLOW_WITH_CONDITIONS":
      return `${base} Guardian permits launch only after conditions are satisfied — primarily the regulated-vertical certification gap flagged by the Compliance Agent.`;
    case "RESTRICT":
      return `${base} Guardian restricts the AI optimizer's proposed targeting changes because they create fairness and discrimination risk in a sensitive vertical. The campaign itself may continue with safer targeting.`;
    case "ESCALATE":
      return `${base} Guardian routes the request to a human reviewer because the request exceeds the autonomous-action threshold for this advertiser, vertical, or signal mix.`;
    case "BLOCK":
      return `${base} Guardian blocks the campaign: critical creative-policy and landing-page violations, in a regulated vertical without registration, present unacceptable harm to users.`;
  }
}
