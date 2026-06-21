import type { PolicyMatch } from "./types";

export type PolicyEnforcement = "Monitor" | "Warn" | "Escalate" | "Restrict" | "Block";
export type PolicyStatus = "Active" | "Draft" | "Retired";

export interface PolicyRule {
  id: string;
  title: string;
  category: string;
  severity: PolicyMatch["severity"];
  enforcement: PolicyEnforcement;
  status: PolicyStatus;
  owner: string;
  version: string;
  lastUpdated: string;
  markets: string[]; // e.g. ["India","UAE","United States","Global"]
  verticals: string[]; // e.g. ["Financial Services","Health"]
  description: string;
  rationale: string;
  reasonCodes: string[];
  // Signals this policy reacts to
  triggers: string[];
  changeHistory: { version: string; date: string; note: string }[];
}

export const POLICY_RULES: PolicyRule[] = [
  {
    id: "POL-REG-001",
    title: "Regulated Vertical Certification",
    category: "Compliance",
    severity: "high",
    enforcement: "Escalate",
    status: "Active",
    owner: "Compliance · Priya N.",
    version: "v3.2",
    lastUpdated: "2026-04-12",
    markets: ["India", "UAE", "United States", "EU"],
    verticals: ["Financial Services", "Healthcare", "Employment"],
    description:
      "Advertisers in regulated verticals (financial services, healthcare, employment) must hold valid regional certification before launch.",
    rationale:
      "Local financial and health regulators require licensed-entity disclosure. Launching without certification creates platform liability and user harm.",
    reasonCodes: ["REGULATED_VERTICAL", "CERTIFICATION_REQUIRED"],
    triggers: ["regulated_vertical", "missing_certification"],
    changeHistory: [
      { version: "v3.2", date: "2026-04-12", note: "Added UAE financial certification scope." },
      { version: "v3.1", date: "2026-02-03", note: "Expanded to healthcare advertisers in IN/EU." },
      { version: "v3.0", date: "2025-11-08", note: "Initial Active version after T&S council review." },
    ],
  },
  {
    id: "POL-CRE-014",
    title: "No Misleading Financial Claims",
    category: "Creative Policy",
    severity: "critical",
    enforcement: "Block",
    status: "Active",
    owner: "Creative Policy · Diego M.",
    version: "v5.0",
    lastUpdated: "2026-05-30",
    markets: ["India", "United States", "EU", "Global"],
    verticals: ["Financial Services"],
    description:
      "Creatives must not contain guaranteed-return language, false urgency, or unverifiable APR/loan claims.",
    rationale:
      "Misleading financial creatives drive user financial harm, regulatory action, and chargeback risk for the platform.",
    reasonCodes: ["MISLEADING_CLAIM", "WEAK_DISCLOSURE"],
    triggers: ["misleading_financial_claim"],
    changeHistory: [
      { version: "v5.0", date: "2026-05-30", note: "Tightened guaranteed-return language detection." },
      { version: "v4.4", date: "2026-01-20", note: "Added APR substantiation requirement." },
    ],
  },
  {
    id: "POL-LAN-008",
    title: "Landing Page Disclosure Standards",
    category: "Landing Page",
    severity: "high",
    enforcement: "Restrict",
    status: "Active",
    owner: "Policy · Ana K.",
    version: "v2.7",
    lastUpdated: "2026-03-18",
    markets: ["Global"],
    verticals: ["Financial Services", "Healthcare", "Lead Generation"],
    description:
      "Landing pages for regulated offers must surface APR, fees, T&Cs, and licensed-entity disclosure above the fold.",
    rationale:
      "Users harmed by lead-gen and finance offers usually report missing or hidden disclosures. Above-the-fold disclosure cuts harm substantially.",
    reasonCodes: ["WEAK_DISCLOSURE", "LANDING_PAGE_RISK"],
    triggers: ["weak_landing_disclosure"],
    changeHistory: [
      { version: "v2.7", date: "2026-03-18", note: "Added APR placement criteria." },
      { version: "v2.5", date: "2025-12-02", note: "Initial Active." },
    ],
  },
  {
    id: "POL-FRD-022",
    title: "Linked Account & Payment Anomaly",
    category: "Fraud & Risk",
    severity: "high",
    enforcement: "Escalate",
    status: "Active",
    owner: "Fraud · Sam T.",
    version: "v4.1",
    lastUpdated: "2026-06-01",
    markets: ["Global"],
    verticals: ["Lead Generation", "Financial Services", "All"],
    description:
      "Sudden budget spikes combined with payment-instrument change or linked-account risk require human review.",
    rationale:
      "This signal combo correlates with takeover, money-laundering proxy spend, and click-fraud rings. Holding for human review prevents revenue loss and user harm.",
    reasonCodes: ["LINKED_ACCOUNT_RISK", "ABNORMAL_TRAFFIC", "PAYMENT_CHANGE"],
    triggers: ["linked_account_risk", "payment_change", "abnormal_traffic"],
    changeHistory: [
      { version: "v4.1", date: "2026-06-01", note: "Tuned thresholds; lowered FP rate by 17%." },
      { version: "v4.0", date: "2026-02-14", note: "Combined three previously separate rules." },
    ],
  },
  {
    id: "POL-FAI-003",
    title: "Fair Targeting in Sensitive Verticals",
    category: "Fairness",
    severity: "critical",
    enforcement: "Restrict",
    status: "Active",
    owner: "Responsible AI · Lin H.",
    version: "v6.0",
    lastUpdated: "2026-05-10",
    markets: ["United States", "EU", "Global"],
    verticals: ["Employment", "Housing", "Credit"],
    description:
      "In employment, housing, and credit, age, gender, and ZIP-based exclusions that correlate with protected classes are disallowed.",
    rationale:
      "Discriminatory targeting in HEC verticals creates legal and societal harm. Restricting AI optimization is required by responsible-AI principles.",
    reasonCodes: ["FAIRNESS_RISK", "SENSITIVE_VERTICAL"],
    triggers: ["discriminatory_targeting", "sensitive_vertical_targeting"],
    changeHistory: [
      { version: "v6.0", date: "2026-05-10", note: "Expanded to AI-optimizer proposals, not only manual." },
      { version: "v5.3", date: "2026-01-09", note: "Added housing scope." },
    ],
  },
  {
    id: "POL-OPS-101",
    title: "Agentic Action Governance",
    category: "Agent Governance",
    severity: "medium",
    enforcement: "Warn",
    status: "Active",
    owner: "Platform · Mia O.",
    version: "v1.4",
    lastUpdated: "2026-06-09",
    markets: ["Global"],
    verticals: ["All"],
    description:
      "Autonomous agent actions that change budget >2x, alter targeting scope, or approve advertisers require Guardian sign-off.",
    rationale:
      "As ads workflows become agentic, the platform needs a runtime control layer over high-impact autonomous actions.",
    reasonCodes: ["HIGH_IMPACT_AGENT_ACTION"],
    triggers: ["high_impact_action"],
    changeHistory: [
      { version: "v1.4", date: "2026-06-09", note: "Lowered budget multiplier threshold from 3x to 2x." },
      { version: "v1.0", date: "2026-03-22", note: "Bootstrapped for Guardian Agent." },
    ],
  },
  {
    id: "POL-HLT-007",
    title: "Health & Supplements Claim Substantiation",
    category: "Compliance",
    severity: "high",
    enforcement: "Escalate",
    status: "Active",
    owner: "Health Policy · Rao V.",
    version: "v2.1",
    lastUpdated: "2026-05-22",
    markets: ["United States", "EU", "Global"],
    verticals: ["Health", "Supplements", "Wellness"],
    description:
      "Health, wellness, and supplement claims require substantiated evidence and may not be approved automatically — even when the advertiser is otherwise low-risk. Auto-approval of appeals on rejected health creatives is disallowed.",
    rationale:
      "Health claims with weak substantiation cause direct user harm. Appeals require human policy review even when account risk is low.",
    reasonCodes: ["HEALTH_CLAIM_REVIEW", "WEAK_SUBSTANTIATION", "APPEAL_REQUIRES_HUMAN"],
    triggers: ["restricted_health_claim", "weak_substantiation", "appeal_auto_approval"],
    changeHistory: [
      { version: "v2.1", date: "2026-05-22", note: "Added appeal auto-approval block." },
      { version: "v2.0", date: "2026-01-30", note: "Initial Active version." },
    ],
  },
  {
    id: "POL-CRE-021",
    title: "Sensational Health Claim Detection",
    category: "Creative Policy",
    severity: "medium",
    enforcement: "Warn",
    status: "Draft",
    owner: "Creative Policy · Diego M.",
    version: "v0.3",
    lastUpdated: "2026-06-15",
    markets: ["United States"],
    verticals: ["Health", "Supplements"],
    description:
      "Detects sensationalized health language (\"miracle\", \"100% guaranteed cure\") and surfaces a warning for human policy review.",
    rationale: "Pre-launch draft expanding POL-HLT-007 with creative-side language detection.",
    reasonCodes: ["SENSATIONAL_HEALTH_LANGUAGE"],
    triggers: ["sensational_health_language"],
    changeHistory: [{ version: "v0.3", date: "2026-06-15", note: "Drafted for council review." }],
  },
];

export function matchPolicies(signals: string[]): PolicyMatch[] {
  return POLICY_RULES.filter(
    (p) => p.status === "Active" && p.triggers.some((t) => signals.includes(t)),
  ).map((p) => ({
    policyId: p.id,
    title: p.title,
    severity: p.severity,
    rationale: p.description,
  }));
}

export function getPolicy(id: string): PolicyRule | undefined {
  return POLICY_RULES.find((p) => p.id === id);
}
