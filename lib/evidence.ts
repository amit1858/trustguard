import type { Scenario, GuardianOutput } from "./types";

export interface EvidenceSection {
  label: string;
  items: { key: string; value: string }[];
}

/**
 * Derive an Evidence Pack for a case from the underlying scenario and Guardian output.
 * This is the bundle of signals Guardian used to produce its decision.
 */
export function buildEvidencePack(scenario: Scenario, guardian: GuardianOutput): EvidenceSection[] {
  const findings = scenario.workerFindings;
  const get = (id: string) => findings.find((f) => f.agentId === id);

  const creative = get("creative_policy");
  const landing = get("landing_page");
  const onboarding = get("advertiser_onboarding");
  const compliance = get("compliance");
  const fraud = get("fraud_risk");
  const optim = get("campaign_optimization");

  const sections: EvidenceSection[] = [
    {
      label: "Ad creative",
      items: [
        { key: "Status", value: creative ? creative.status.toUpperCase() : "n/a" },
        { key: "Headline summary", value: creative?.summary ?? "—" },
        ...(creative?.evidence ?? []).slice(0, 2).map((e) => ({ key: e.label, value: e.detail })),
      ],
    },
    {
      label: "Landing page",
      items: [
        { key: "Status", value: landing ? landing.status.toUpperCase() : "n/a" },
        { key: "Disclosure quality", value: landing?.summary ?? "—" },
        ...(landing?.evidence ?? []).slice(0, 2).map((e) => ({ key: e.label, value: e.detail })),
      ],
    },
    {
      label: "Advertiser profile",
      items: [
        { key: "Advertiser", value: scenario.advertiser },
        { key: "Vertical", value: scenario.vertical },
        { key: "Market", value: scenario.market },
        { key: "Onboarding", value: onboarding?.summary ?? "—" },
        ...(onboarding?.evidence ?? []).slice(0, 1).map((e) => ({ key: e.label, value: e.detail })),
      ],
    },
    {
      label: "Compliance & licensing",
      items: [
        { key: "Status", value: compliance ? compliance.status.toUpperCase() : "n/a" },
        { key: "Summary", value: compliance?.summary ?? "—" },
        ...(compliance?.evidence ?? []).slice(0, 2).map((e) => ({ key: e.label, value: e.detail })),
      ],
    },
    {
      label: "Payment & billing signals",
      items: [
        { key: "Status", value: fraud ? fraud.status.toUpperCase() : "n/a" },
        { key: "Summary", value: fraud?.summary ?? "—" },
        ...(fraud?.evidence ?? []).slice(0, 2).map((e) => ({ key: e.label, value: e.detail })),
      ],
    },
    {
      label: "Campaign optimization proposal",
      items: [
        { key: "Status", value: optim ? optim.status.toUpperCase() : "n/a" },
        { key: "Summary", value: optim?.summary ?? "—" },
        ...(optim?.evidence ?? []).slice(0, 2).map((e) => ({ key: e.label, value: e.detail })),
      ],
    },
    {
      label: "Policy evidence",
      items: guardian.matchedPolicies.length
        ? guardian.matchedPolicies.map((p) => ({ key: p.policyId, value: p.title }))
        : [{ key: "—", value: "No policy matched." }],
    },
    {
      label: "Risk signals",
      items: [
        { key: "Reason codes", value: guardian.reasonCodes.join(", ") || "—" },
        { key: "Risk score", value: `${guardian.riskScore} (${guardian.riskLevel})` },
        { key: "Confidence", value: `${Math.round(guardian.confidence * 100)}%` },
      ],
    },
  ];

  return sections;
}
