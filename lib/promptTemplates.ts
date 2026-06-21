import type { Scenario, GuardianOutput } from "./types";

export type AITask =
  | "guardian_explanation"
  | "worker_findings_summary"
  | "risk_summary";

export const SYSTEM_PROMPT =
  "You are TrustGuard's explanation assistant for an Ads Trust & Safety Guardian Agent. " +
  "Produce a concise, plain-English response (<= 120 words). " +
  "Never override policy decisions; only explain or summarize them. " +
  "If unsure, defer to the deterministic policy kernel's output.";

export function buildPrompt(
  task: AITask,
  scenario: Scenario,
  guardian: GuardianOutput,
): string {
  const ctx = [
    `Advertiser: ${scenario.advertiser}`,
    `Vertical: ${scenario.vertical} | Market: ${scenario.market}`,
    `Requested action: ${scenario.requestedAction}`,
    `Guardian decision (final, set by deterministic policy kernel): ${guardian.decision}`,
    `Risk score: ${guardian.riskScore}/100 (${guardian.riskLevel})`,
    `Reason codes: ${guardian.reasonCodes.join(", ") || "—"}`,
    `Matched policies: ${guardian.matchedPolicies.map((p) => p.policyId + " " + p.title).join("; ") || "—"}`,
    `Worker findings:`,
    ...scenario.workerFindings.map((f) => `- ${f.agentName} [${f.status}] ${f.summary}`),
  ].join("\n");

  switch (task) {
    case "guardian_explanation":
      return `${ctx}\n\nIn <=120 words, explain in plain English why the Guardian made this decision. Do not change the decision.`;
    case "worker_findings_summary":
      return `${ctx}\n\nIn 3–5 short bullets, summarize what the worker agents found. Be neutral and specific.`;
    case "risk_summary":
      return `${ctx}\n\nIn 2–3 sentences, summarize the top risk signals and why the risk score is what it is.`;
  }
}
