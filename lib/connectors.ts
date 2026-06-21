export type ConnectorType =
  | "Input"
  | "Policy"
  | "Risk"
  | "Execution"
  | "Review"
  | "Audit"
  | "AI Provider";

export type ConnectorStatus = "Mocked" | "Connected" | "Needs Setup";

export type ConnectorDirection = "Inbound" | "Outbound" | "Bidirectional";

export interface Connector {
  id: string;
  name: string;
  type: ConnectorType;
  status: ConnectorStatus;
  direction: ConnectorDirection;
  lastSync: string;
  usedBy: string[];
  note: string;
}

export const CONNECTORS: Connector[] = [
  {
    id: "conn.ads-campaign-api",
    name: "Ads Campaign API",
    type: "Execution",
    status: "Mocked",
    direction: "Outbound",
    lastSync: "—",
    usedBy: ["Runtime Events", "Control Plane"],
    note: "Production: REST/gRPC endpoint that launches, pauses, and updates campaigns. Guardian must approve every execution.",
  },
  {
    id: "conn.advertiser-onboarding",
    name: "Advertiser Onboarding Service",
    type: "Input",
    status: "Mocked",
    direction: "Inbound",
    lastSync: "—",
    usedBy: ["Worker: Advertiser Onboarding Agent"],
    note: "Production: pulls advertiser identity, KYC, certification status, and linked-account graph for new advertiser activations.",
  },
  {
    id: "conn.creative-policy",
    name: "Creative Policy Service",
    type: "Policy",
    status: "Mocked",
    direction: "Bidirectional",
    lastSync: "—",
    usedBy: ["Worker: Creative Policy Agent", "Policy Console"],
    note: "Production: hosts versioned ad-policy taxonomy and creative classifiers used by the Creative Policy worker.",
  },
  {
    id: "conn.landing-page-scanner",
    name: "Landing Page Scanner",
    type: "Risk",
    status: "Mocked",
    direction: "Inbound",
    lastSync: "—",
    usedBy: ["Worker: Landing Page Screening Agent"],
    note: "Production: headless scanner returning disclosure quality, claim substantiation, and risk signals for each landing URL.",
  },
  {
    id: "conn.fraud-risk",
    name: "Fraud / Risk Service",
    type: "Risk",
    status: "Mocked",
    direction: "Inbound",
    lastSync: "—",
    usedBy: ["Worker: Fraud & Risk Screening Agent"],
    note: "Production: account-level risk graph (linked accounts, abnormal traffic, payment instrument changes) feeding Guardian risk scoring.",
  },
  {
    id: "conn.human-review",
    name: "Human Review Queue",
    type: "Review",
    status: "Mocked",
    direction: "Outbound",
    lastSync: "—",
    usedBy: ["Review Queue", "Case Detail"],
    note: "Production: durable case store + assignment/SLA system. Phase 2A in-memory + localStorage stands in for this today.",
  },
  {
    id: "conn.policy-rules",
    name: "Policy Rules Service",
    type: "Policy",
    status: "Mocked",
    direction: "Inbound",
    lastSync: "—",
    usedBy: ["Guardian Engine", "Policy Console"],
    note: "Production: versioned rule store with markets/verticals/severity metadata and rollout controls. Deterministic kernel reads from this.",
  },
  {
    id: "conn.audit-store",
    name: "Audit Store",
    type: "Audit",
    status: "Mocked",
    direction: "Outbound",
    lastSync: "—",
    usedBy: ["Audit Log", "Case Detail", "Export"],
    note: "Production: append-only, tamper-evident ledger for Guardian decisions and operator outcomes. localStorage stands in today.",
  },
  {
    id: "conn.byok-model",
    name: "BYOK Model Provider",
    type: "AI Provider",
    status: "Connected",
    direction: "Outbound",
    lastSync: "Live",
    usedBy: ["BYOK Settings", "Guardian explanation"],
    note: "Production: customer-supplied LLM credentials, used only for explanation/summarization. Never overrides the deterministic kernel.",
  },
  {
    id: "conn.notifications",
    name: "Notification Service",
    type: "Execution",
    status: "Needs Setup",
    direction: "Outbound",
    lastSync: "—",
    usedBy: ["Case Detail", "Review Queue"],
    note: "Production: advertiser communications + internal reviewer alerts (Slack/email/webhook) when cases change state.",
  },
];

export const CONNECTOR_STATUS_COLORS: Record<ConnectorStatus, string> = {
  Connected: "#6FB089",
  Mocked: "#C9A36B",
  "Needs Setup": "#D97448",
};

export const CONNECTOR_TYPE_COLORS: Record<ConnectorType, string> = {
  Input: "#8FA1B3",
  Policy: "#C7B8DC",
  Risk: "#D97448",
  Execution: "#F59E2E",
  Review: "#9B89B8",
  Audit: "#C9A36B",
  "AI Provider": "#6FB089",
};
