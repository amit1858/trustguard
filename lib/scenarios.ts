import type { Scenario, WorkerFinding, OrchestratorPlan } from "./types";

const WORKER_NAMES = {
  advertiser_onboarding: "Advertiser Onboarding Agent",
  creative_policy: "Creative Policy Agent",
  landing_page: "Landing Page Screening Agent",
  compliance: "Compliance Agent",
  fraud_risk: "Fraud & Risk Screening Agent",
  campaign_optimization: "Campaign Optimization Agent",
} as const;

function plan(goal: string, proposed: string[]): OrchestratorPlan {
  return {
    planId: `plan_${Math.random().toString(36).slice(2, 8)}`,
    goal,
    proposedActions: proposed,
    steps: [
      { step: 1, agentId: "orchestrator", agentName: "Orchestrator Agent", intent: "Decompose request into worker tasks" },
      { step: 2, agentId: "advertiser_onboarding", agentName: WORKER_NAMES.advertiser_onboarding, intent: "Verify advertiser identity, KYC, and account standing" },
      { step: 3, agentId: "creative_policy", agentName: WORKER_NAMES.creative_policy, intent: "Scan creatives for policy violations" },
      { step: 4, agentId: "landing_page", agentName: WORKER_NAMES.landing_page, intent: "Inspect landing page for disclosure and safety" },
      { step: 5, agentId: "compliance", agentName: WORKER_NAMES.compliance, intent: "Validate regional and vertical compliance" },
      { step: 6, agentId: "fraud_risk", agentName: WORKER_NAMES.fraud_risk, intent: "Score fraud, abuse, and account risk" },
      { step: 7, agentId: "campaign_optimization", agentName: WORKER_NAMES.campaign_optimization, intent: "Propose budget, bidding, and targeting" },
    ],
    note: "The Orchestrator can propose actions, but cannot override the Guardian Agent.",
  };
}

// ───────────── Scenario 1: Clean launch ─────────────
const s1Findings: WorkerFinding[] = [
  { agentId: "advertiser_onboarding", agentName: WORKER_NAMES.advertiser_onboarding, status: "pass", summary: "Verified business, clean account history.", evidence: [{ label: "KYC", detail: "Match on registered entity, GST verified" }, { label: "Account age", detail: "14 months, no prior violations" }], confidence: 0.96, recommendedAction: "Approve advertiser", signals: [] },
  { agentId: "creative_policy", agentName: WORKER_NAMES.creative_policy, status: "pass", summary: "All 6 creatives compliant.", evidence: [{ label: "Claims", detail: "No prohibited language detected" }], confidence: 0.94, recommendedAction: "Approve creatives", signals: [] },
  { agentId: "landing_page", agentName: WORKER_NAMES.landing_page, status: "pass", summary: "Landing page healthy and brand-safe.", evidence: [{ label: "Safe browsing", detail: "No malware, valid TLS" }, { label: "Disclosures", detail: "Privacy + T&Cs present" }], confidence: 0.93, recommendedAction: "Approve landing page", signals: [] },
  { agentId: "compliance", agentName: WORKER_NAMES.compliance, status: "pass", summary: "No regulated-vertical obligations in India for general fitness.", evidence: [{ label: "Vertical", detail: "Fitness — non-regulated" }], confidence: 0.97, recommendedAction: "Clear for launch", signals: [] },
  { agentId: "fraud_risk", agentName: WORKER_NAMES.fraud_risk, status: "pass", summary: "Risk score low; no linked-account anomalies.", evidence: [{ label: "Risk score", detail: "12 / 100" }], confidence: 0.95, recommendedAction: "Allow", signals: [] },
  { agentId: "campaign_optimization", agentName: WORKER_NAMES.campaign_optimization, status: "pass", summary: "Standard CPM bidding within budget norms.", evidence: [{ label: "Budget", detail: "₹250k / month, within tier" }], confidence: 0.9, recommendedAction: "Launch", signals: [] },
];

// ───────────── Scenario 2: Regulated vertical, missing cert ─────────────
const s2Findings: WorkerFinding[] = [
  { agentId: "advertiser_onboarding", agentName: WORKER_NAMES.advertiser_onboarding, status: "pass", summary: "Verified UAE financial advisory entity.", evidence: [{ label: "Trade license", detail: "Valid Dubai DED license" }], confidence: 0.92, recommendedAction: "Approve advertiser", signals: [] },
  { agentId: "creative_policy", agentName: WORKER_NAMES.creative_policy, status: "pass", summary: "Creatives compliant; no misleading claims.", evidence: [{ label: "Claims", detail: "Generic advisory language only" }], confidence: 0.9, recommendedAction: "Approve creatives", signals: [] },
  { agentId: "landing_page", agentName: WORKER_NAMES.landing_page, status: "warning", summary: "Disclosures present but small; regulator badge missing.", evidence: [{ label: "Disclosure", detail: "Risk note below the fold" }], confidence: 0.78, recommendedAction: "Request disclosure upgrade", signals: ["weak_landing_disclosure"] },
  { agentId: "compliance", agentName: WORKER_NAMES.compliance, status: "fail", summary: "SCA (UAE Securities & Commodities Authority) certification not on file.", evidence: [{ label: "Vertical", detail: "Financial Services — regulated in UAE" }, { label: "Certification", detail: "SCA license not uploaded" }], confidence: 0.96, recommendedAction: "Block until certification provided", signals: ["regulated_vertical", "missing_certification"] },
  { agentId: "fraud_risk", agentName: WORKER_NAMES.fraud_risk, status: "pass", summary: "Risk score low.", evidence: [{ label: "Risk score", detail: "18 / 100" }], confidence: 0.93, recommendedAction: "Allow", signals: [] },
  { agentId: "campaign_optimization", agentName: WORKER_NAMES.campaign_optimization, status: "pass", summary: "Standard plan; pending compliance gate.", evidence: [{ label: "Budget", detail: "AED 120k / month" }], confidence: 0.88, recommendedAction: "Hold for compliance", signals: [] },
];

// ───────────── Scenario 3: Misleading financial claim — BLOCK ─────────────
const s3Findings: WorkerFinding[] = [
  { agentId: "advertiser_onboarding", agentName: WORKER_NAMES.advertiser_onboarding, status: "warning", summary: "New advertiser, thin documentation.", evidence: [{ label: "Account age", detail: "11 days" }, { label: "KYC", detail: "Partial: PAN verified, GST pending" }], confidence: 0.74, recommendedAction: "Hold for enhanced KYC", signals: [] },
  { agentId: "creative_policy", agentName: WORKER_NAMES.creative_policy, status: "fail", summary: "Creative claims '100% guaranteed loan approval in 2 minutes — no credit check'.", evidence: [{ label: "Claim", detail: "Guaranteed approval language" }, { label: "Urgency", detail: "'Only 50 slots left today'" }], confidence: 0.97, recommendedAction: "Reject creatives", signals: ["misleading_financial_claim"] },
  { agentId: "landing_page", agentName: WORKER_NAMES.landing_page, status: "fail", summary: "No APR, no lender disclosure, lead-capture-only page.", evidence: [{ label: "APR", detail: "Missing" }, { label: "Lender", detail: "Not disclosed" }], confidence: 0.95, recommendedAction: "Reject landing page", signals: ["weak_landing_disclosure"] },
  { agentId: "compliance", agentName: WORKER_NAMES.compliance, status: "fail", summary: "Operating in a regulated vertical (lending) in India without RBI-registered NBFC mapping.", evidence: [{ label: "Vertical", detail: "Financial Services — regulated" }, { label: "Registration", detail: "No RBI NBFC link on record" }], confidence: 0.96, recommendedAction: "Block", signals: ["regulated_vertical", "missing_certification"] },
  { agentId: "fraud_risk", agentName: WORKER_NAMES.fraud_risk, status: "warning", summary: "Domain registered 9 days ago; shared infra with prior takedown.", evidence: [{ label: "Domain age", detail: "9 days" }, { label: "Infra", detail: "Shared ASN with 2 prior policy violators" }], confidence: 0.81, recommendedAction: "Escalate", signals: [] },
  { agentId: "campaign_optimization", agentName: WORKER_NAMES.campaign_optimization, status: "warning", summary: "Aggressive CPL bid 3.2x category median.", evidence: [{ label: "Bid", detail: "₹820 CPL vs ₹260 median" }], confidence: 0.85, recommendedAction: "Hold", signals: [] },
];

// ───────────── Scenario 4: Suspicious budget increase — ESCALATE ─────────────
const s4Findings: WorkerFinding[] = [
  { agentId: "advertiser_onboarding", agentName: WORKER_NAMES.advertiser_onboarding, status: "warning", summary: "Linked to 3 sibling accounts; one previously suspended.", evidence: [{ label: "Linked accounts", detail: "3 detected via device + billing fingerprint" }, { label: "History", detail: "1 prior suspension (invalid traffic)" }], confidence: 0.86, recommendedAction: "Review", signals: ["linked_account_risk"] },
  { agentId: "creative_policy", agentName: WORKER_NAMES.creative_policy, status: "pass", summary: "Creatives unchanged; previously approved.", evidence: [{ label: "Diff", detail: "No new creatives" }], confidence: 0.92, recommendedAction: "No action", signals: [] },
  { agentId: "landing_page", agentName: WORKER_NAMES.landing_page, status: "pass", summary: "No landing page change.", evidence: [{ label: "URL", detail: "Same as prior approved" }], confidence: 0.9, recommendedAction: "No action", signals: [] },
  { agentId: "compliance", agentName: WORKER_NAMES.compliance, status: "pass", summary: "Lead-gen vertical in US — no certification gap.", evidence: [{ label: "Vertical", detail: "Lead generation" }], confidence: 0.9, recommendedAction: "No action", signals: [] },
  { agentId: "fraud_risk", agentName: WORKER_NAMES.fraud_risk, status: "fail", summary: "Abnormal click pattern past 24h + payment instrument changed 2h before request.", evidence: [{ label: "Traffic", detail: "78% clicks from 4 ASNs, IVT score 0.61" }, { label: "Payment", detail: "Card swapped 2h ago, new BIN country" }], confidence: 0.93, recommendedAction: "Escalate to human", signals: ["abnormal_traffic", "payment_change", "linked_account_risk"] },
  { agentId: "campaign_optimization", agentName: WORKER_NAMES.campaign_optimization, status: "warning", summary: "Optimizer proposes 4x budget and broad geo expansion.", evidence: [{ label: "Budget delta", detail: "$50k → $200k / day" }, { label: "Geo", detail: "+22 new metros" }], confidence: 0.8, recommendedAction: "Hold", signals: ["high_impact_action"] },
];

// ───────────── Scenario 5: Risky AI optimization — RESTRICT ─────────────
const s5Findings: WorkerFinding[] = [
  { agentId: "advertiser_onboarding", agentName: WORKER_NAMES.advertiser_onboarding, status: "pass", summary: "Verified employer; clean history.", evidence: [{ label: "KYC", detail: "Verified employer entity" }], confidence: 0.94, recommendedAction: "No action", signals: [] },
  { agentId: "creative_policy", agentName: WORKER_NAMES.creative_policy, status: "pass", summary: "Job ads comply with employment ad policy.", evidence: [{ label: "Claims", detail: "No exclusionary language" }], confidence: 0.92, recommendedAction: "Approve", signals: [] },
  { agentId: "landing_page", agentName: WORKER_NAMES.landing_page, status: "pass", summary: "Career site is safe and accessible.", evidence: [{ label: "Accessibility", detail: "WCAG AA pass" }], confidence: 0.9, recommendedAction: "Approve", signals: [] },
  { agentId: "compliance", agentName: WORKER_NAMES.compliance, status: "warning", summary: "US employment ads — special category, requires fair audience.", evidence: [{ label: "Vertical", detail: "Employment (sensitive)" }, { label: "Regulation", detail: "EEOC alignment required" }], confidence: 0.95, recommendedAction: "Apply fair-audience constraints", signals: ["sensitive_vertical_targeting"] },
  { agentId: "fraud_risk", agentName: WORKER_NAMES.fraud_risk, status: "pass", summary: "No fraud signals.", evidence: [{ label: "Risk score", detail: "14 / 100" }], confidence: 0.93, recommendedAction: "Allow", signals: [] },
  { agentId: "campaign_optimization", agentName: WORKER_NAMES.campaign_optimization, status: "fail", summary: "Optimizer proposes excluding ages 50+ and narrowing to ZIPs that proxy protected classes.", evidence: [{ label: "Age", detail: "Exclude 50–65+" }, { label: "Geo", detail: "Removes ZIPs with majority-minority demographics" }], confidence: 0.91, recommendedAction: "Reject targeting change", signals: ["discriminatory_targeting", "sensitive_vertical_targeting", "high_impact_action"] },
];

// ───────────── Scenario 6: Policy Appeal Review — ESCALATE ─────────────
const s6Findings: WorkerFinding[] = [
  { agentId: "advertiser_onboarding", agentName: WORKER_NAMES.advertiser_onboarding, status: "pass", summary: "Verified supplement brand; clean account history.", evidence: [{ label: "KYC", detail: "Verified US entity, 3.4 years on platform" }, { label: "History", detail: "No prior policy actions" }], confidence: 0.94, recommendedAction: "No action", signals: [] },
  { agentId: "creative_policy", agentName: WORKER_NAMES.creative_policy, status: "fail", summary: "Creative makes unsubstantiated health-outcome claim (\"clinically proven to lower cholesterol in 14 days\").", evidence: [{ label: "Claim", detail: "Health-outcome claim without cited study" }, { label: "Disclaimer", detail: "Missing FDA/structure-function disclaimer" }], confidence: 0.93, recommendedAction: "Keep creative rejected pending substantiation", signals: ["restricted_health_claim"] },
  { agentId: "landing_page", agentName: WORKER_NAMES.landing_page, status: "warning", summary: "Landing page cites \"clinical study\" but does not link to it; substantiation weak.", evidence: [{ label: "Study link", detail: "Missing" }, { label: "Source", detail: "Cited as \"internal study\"" }], confidence: 0.85, recommendedAction: "Request substantiation", signals: ["weak_substantiation"] },
  { agentId: "compliance", agentName: WORKER_NAMES.compliance, status: "fail", summary: "Restricted health-related claims in US — FDA/FTC review obligations apply.", evidence: [{ label: "Vertical", detail: "Health / supplements (restricted)" }, { label: "Regulator", detail: "FDA structure/function rules + FTC substantiation" }], confidence: 0.96, recommendedAction: "Block auto-approval", signals: ["restricted_health_claim", "appeal_auto_approval"] },
  { agentId: "fraud_risk", agentName: WORKER_NAMES.fraud_risk, status: "pass", summary: "No fraud or abuse signals; account is healthy.", evidence: [{ label: "Risk score", detail: "11 / 100" }], confidence: 0.94, recommendedAction: "No action", signals: [] },
  { agentId: "campaign_optimization", agentName: WORKER_NAMES.campaign_optimization, status: "pass", summary: "No optimization change requested in this appeal.", evidence: [{ label: "Change", detail: "Appeal only — no targeting/budget delta" }], confidence: 0.9, recommendedAction: "No action", signals: [] },
];

export const SCENARIOS: Scenario[] = [
  {
    id: "clean_launch",
    shortLabel: "Clean Launch",
    title: "Clean Advertiser Launch",
    advertiser: "Contoso Fitness",
    vertical: "Fitness",
    market: "India",
    requestedAction: "Launch campaign",
    expectedDecision: "ALLOW",
    summary: "Healthy advertiser, non-regulated vertical, no risk signals.",
    workerFindings: s1Findings,
    orchestratorPlan: plan("Launch Contoso Fitness campaign in India", ["Launch campaign", "Apply standard CPM bidding"]),
    interception: {
      proposed: "Launch Contoso Fitness campaign at standard CPM bidding for the Indian fitness audience.",
      intercepted: "No policy violations detected. All six worker agents passed; no regulated-vertical or fairness signals raised.",
      outcome: "Campaign launch permitted. Standard monitoring applied; no human review required.",
    },
  },
  {
    id: "regulated_missing_cert",
    shortLabel: "Missing Certification",
    title: "Regulated Vertical — Missing Certification",
    advertiser: "Northstar Credit Advisory",
    vertical: "Financial Services",
    market: "UAE",
    requestedAction: "Launch campaign",
    expectedDecision: "ALLOW_WITH_CONDITIONS",
    summary: "Otherwise healthy, but missing SCA certification required to advertise financial services in UAE.",
    workerFindings: s2Findings,
    orchestratorPlan: plan("Launch Northstar Credit Advisory in UAE", ["Launch campaign", "Apply finance-vertical disclosures"]),
    interception: {
      proposed: "Launch Northstar Credit Advisory financial-services campaign in the UAE.",
      intercepted: "Policy gate triggered: financial services in UAE is a regulated vertical and the SCA certification is not on file. Landing page disclosure also weak.",
      outcome: "Conditional allow. Hold launch until SCA license is uploaded and verified, and the landing-page risk disclosure is upgraded above the fold.",
    },
  },
  {
    id: "misleading_finance",
    shortLabel: "Misleading Claim",
    title: "Misleading Financial Claim",
    advertiser: "BrightFast Loans",
    vertical: "Financial Services",
    market: "India",
    requestedAction: "Launch campaign",
    expectedDecision: "BLOCK",
    summary: "Multiple critical violations: misleading claims, weak disclosures, regulated vertical without registration.",
    workerFindings: s3Findings,
    orchestratorPlan: plan("Launch BrightFast Loans lead-gen campaign", ["Launch campaign", "Optimize for CPL"]),
    interception: {
      proposed: "Launch BrightFast Loans campaign after minor copy edits and run lead-capture landing page.",
      intercepted: "Policy risk detected: misleading financial claim (\"100% guaranteed approval\"), weak landing page disclosure (no APR, no lender), and operating in a regulated vertical without RBI NBFC registration.",
      outcome: "Campaign launch blocked. Save draft, request creative and landing-page correction, and create a policy review case for the advertiser.",
    },
  },
  {
    id: "suspicious_budget",
    shortLabel: "Suspicious Budget",
    title: "Suspicious Advertiser Budget Increase",
    advertiser: "QuickWin Media",
    vertical: "Lead Generation",
    market: "United States",
    requestedAction: "Increase budget by 4x and expand targeting",
    expectedDecision: "ESCALATE",
    summary: "Linked accounts, abnormal traffic, payment instrument changed — needs human review.",
    workerFindings: s4Findings,
    orchestratorPlan: plan("Scale QuickWin Media campaign", ["Increase daily budget 4x", "Expand geo to +22 metros"]),
    interception: {
      proposed: "Increase QuickWin Media daily budget from $50k to $200k and expand targeting to 22 new metros.",
      intercepted: "High-impact agentic action combined with risk signals: linked-account risk, abnormal traffic pattern (IVT 0.61), and payment instrument changed two hours before request.",
      outcome: "Escalated to a human Trust & Safety reviewer. Campaign continues at existing budget; proposed 4x increase and geo expansion are held pending decision.",
    },
  },
  {
    id: "risky_ai_targeting",
    shortLabel: "Risky AI Targeting",
    title: "Risky AI Optimization Action",
    advertiser: "UrbanHire Jobs",
    vertical: "Employment",
    market: "United States",
    requestedAction: "AI optimization agent proposes excluding older age groups and narrowing audience",
    expectedDecision: "RESTRICT",
    summary: "Sensitive vertical; proposed targeting raises fairness and discrimination risk.",
    workerFindings: s5Findings,
    orchestratorPlan: plan("Optimize UrbanHire Jobs campaign performance", ["Exclude ages 50+", "Narrow ZIP targeting", "Increase bid on remaining audience"]),
    interception: {
      proposed: "Apply AI optimizer's recommendation: exclude age 50+ and narrow ZIPs to lift CTR on the UrbanHire Jobs employment campaign.",
      intercepted: "Fairness risk detected in a sensitive vertical (employment): age-based exclusion and ZIP targeting that proxies protected demographics.",
      outcome: "Targeting change restricted. Campaign continues with a fair-audience targeting set; the specific AI optimizer action is blocked and logged for fairness review.",
    },
  },
  {
    id: "appeal_review",
    shortLabel: "Policy Appeal",
    title: "Policy Appeal Review",
    advertiser: "MedSure Supplements",
    vertical: "Health / Supplements",
    market: "United States",
    requestedAction: "Auto-approve appeal after ad rejection",
    expectedDecision: "ESCALATE",
    summary: "Clean advertiser history, but health-claim policy still requires human substantiation review before any appeal can be approved.",
    workerFindings: s6Findings,
    orchestratorPlan: plan("Process MedSure Supplements policy appeal", ["Auto-approve appeal", "Relaunch rejected creative"]),
    interception: {
      proposed: "Approve appeal because advertiser provided an explanation and has a clean account history.",
      intercepted: "Health-related claims require substantiated evidence and human policy review — clean advertiser history is not sufficient to auto-approve.",
      outcome: "Appeal escalated to a policy specialist. Reopen the appeal case, request substantiation from the advertiser, and keep the rejected creative offline until reviewed.",
    },
  },
];

export function getScenario(id: string) {
  return SCENARIOS.find((s) => s.id === id) ?? SCENARIOS[0];
}
