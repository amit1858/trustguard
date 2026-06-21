export type WorkerAgentId =
  | "advertiser_onboarding"
  | "creative_policy"
  | "landing_page"
  | "compliance"
  | "fraud_risk"
  | "campaign_optimization";

export type WorkerStatus = "pass" | "warning" | "fail";

export interface Evidence {
  label: string;
  detail: string;
}

export interface WorkerFinding {
  agentId: WorkerAgentId;
  agentName: string;
  status: WorkerStatus;
  summary: string;
  evidence: Evidence[];
  confidence: number; // 0-1
  recommendedAction: string;
  signals: string[]; // signal codes consumed by Guardian
}

export type GuardianDecision =
  | "ALLOW"
  | "ALLOW_WITH_CONDITIONS"
  | "RESTRICT"
  | "ESCALATE"
  | "BLOCK";

export type RiskLevel = "low" | "moderate" | "elevated" | "high" | "critical";

export interface PolicyMatch {
  policyId: string;
  title: string;
  severity: "info" | "low" | "medium" | "high" | "critical";
  rationale: string;
}

export interface AuditEvent {
  ts: string;
  actor: "user" | "orchestrator" | "worker" | "guardian" | "system";
  event: string;
  detail?: string;
}

export interface GuardianOutput {
  decision: GuardianDecision;
  riskScore: number; // 0-100
  riskLevel: RiskLevel;
  confidence: number; // 0-1
  reasonCodes: string[];
  explanation: string;
  allowedActions: string[];
  blockedActions: string[];
  humanReviewRequired: boolean;
  matchedPolicies: PolicyMatch[];
  auditTrail: AuditEvent[];
}

export interface OrchestratorStep {
  step: number;
  agentId: WorkerAgentId | "orchestrator";
  agentName: string;
  intent: string;
}

export interface OrchestratorPlan {
  planId: string;
  goal: string;
  proposedActions: string[];
  steps: OrchestratorStep[];
  note: string;
}

export interface Scenario {
  id: string;
  title: string;
  advertiser: string;
  vertical: string;
  market: string;
  requestedAction: string;
  shortLabel: string;
  expectedDecision: GuardianDecision;
  summary: string;
  workerFindings: WorkerFinding[];
  orchestratorPlan: OrchestratorPlan;
  interception: {
    proposed: string;
    intercepted: string;
    outcome: string;
  };
}

export type AIProvider =
  | "azure_openai"
  | "openai"
  | "anthropic"
  | "mistral"
  | "openrouter";

export interface BYOKConfig {
  mode: "demo" | "byok";
  provider: AIProvider;
  apiKey: string;
  modelName: string;
  tasks: {
    workerFindings: boolean;
    guardianExplanation: boolean;
    riskSummary: boolean;
  };
}
