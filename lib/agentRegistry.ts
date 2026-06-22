import { getRuntimeEvents } from "./runtimeEvents";

export type AgentType =
  | "Orchestrator"
  | "Worker"
  | "Optimization"
  | "Review Copilot"
  | "Guardian";

export type TrustTier = "Low" | "Medium" | "High" | "System";

export type AgentStatus = "Active" | "Limited" | "Disabled";

export interface RegistryAgent {
  agentId: string;
  name: string;
  type: AgentType;
  trustTier: TrustTier;
  allowedActions: string[];
  restrictedActions: string[];
  requiresGuardianFor: string[];
  owner: string;
  status: AgentStatus;
  lastActivity: string; // ISO deterministic
  description: string;
}

export const AGENT_REGISTRY: RegistryAgent[] = [
  {
    agentId: "campaign-orchestrator",
    name: "Campaign Orchestrator Agent",
    type: "Orchestrator",
    trustTier: "Medium",
    allowedActions: [
      "decompose_request",
      "invoke_worker_agents",
      "propose_campaign_launch",
      "propose_budget_change",
      "create_orchestrator_plan",
      "route_to_guardian",
    ],
    restrictedActions: [
      "override_guardian_decision",
      "execute_without_guardian",
      "approve_restricted_content",
    ],
    requiresGuardianFor: [
      "propose_campaign_launch",
      "propose_budget_change",
    ],
    owner: "Ads Orchestration Team",
    status: "Active",
    lastActivity: "2026-06-21T13:54:00Z",
    description:
      "Coordinates the multi-agent workflow for campaign launch and optimization. Decomposes advertiser requests into worker tasks, collects findings, and proposes actions — but cannot execute without Guardian approval.",
  },
  {
    agentId: "creative-optimization",
    name: "Creative Optimization Agent",
    type: "Worker",
    trustTier: "Low",
    allowedActions: [
      "scan_creative_policy",
      "flag_policy_violation",
      "suggest_copy_edit",
      "request_creative_review",
    ],
    restrictedActions: [
      "approve_rejected_creative",
      "relaunch_rejected_ad",
      "override_policy_flag",
    ],
    requiresGuardianFor: [
      "relaunch_rejected_ad",
      "approve_rejected_creative",
    ],
    owner: "Creative Policy Team",
    status: "Active",
    lastActivity: "2026-06-21T13:03:00Z",
    description:
      "Scans ad creatives for policy violations, misleading claims, and prohibited content. Can flag and suggest corrections but cannot approve or relaunch rejected ads without Guardian evaluation.",
  },
  {
    agentId: "budget-optimization",
    name: "Budget Optimization Agent",
    type: "Optimization",
    trustTier: "Low",
    allowedActions: [
      "propose_budget_increase",
      "analyze_spend_efficiency",
      "recommend_bid_adjustment",
      "report_budget_utilization",
    ],
    restrictedActions: [
      "execute_budget_increase_above_2x",
      "override_spend_cap",
      "modify_payment_instrument",
    ],
    requiresGuardianFor: [
      "propose_budget_increase",
      "execute_budget_increase_above_2x",
    ],
    owner: "Campaign Optimization Team",
    status: "Active",
    lastActivity: "2026-06-21T14:00:00Z",
    description:
      "Analyzes campaign performance and proposes budget adjustments to improve ROI. Any budget increase above 2× the current cap requires Guardian approval before execution.",
  },
  {
    agentId: "advertiser-onboarding",
    name: "Advertiser Onboarding Agent",
    type: "Worker",
    trustTier: "Medium",
    allowedActions: [
      "verify_advertiser_identity",
      "check_kyc_documents",
      "validate_business_license",
      "activate_advertiser_account",
      "request_additional_documents",
    ],
    restrictedActions: [
      "bypass_kyc_verification",
      "activate_unverified_advertiser",
      "override_compliance_block",
    ],
    requiresGuardianFor: [
      "activate_advertiser_account",
    ],
    owner: "Advertiser Trust Team",
    status: "Active",
    lastActivity: "2026-06-21T13:36:00Z",
    description:
      "Handles new advertiser onboarding, KYC verification, and account activation. Can request documents and verify identity, but account activation requires Guardian clearance.",
  },
  {
    agentId: "appeal-resolution",
    name: "Appeal Resolution Agent",
    type: "Worker",
    trustTier: "Medium",
    allowedActions: [
      "review_appeal_submission",
      "check_prior_policy_actions",
      "request_substantiation",
      "route_to_human_reviewer",
      "summarize_appeal_context",
    ],
    restrictedActions: [
      "auto_approve_restricted_vertical_appeal",
      "override_guardian_block",
      "approve_misleading_claim_appeal",
    ],
    requiresGuardianFor: [
      "auto_approve_restricted_vertical_appeal",
      "approve_appeal",
    ],
    owner: "Appeals & Policy Team",
    status: "Active",
    lastActivity: "2026-06-21T12:48:00Z",
    description:
      "Processes advertiser appeals against policy decisions. Can gather context and route to human reviewers, but cannot auto-approve appeals for restricted verticals without Guardian evaluation.",
  },
  {
    agentId: "policy-explanation",
    name: "Policy Explanation Agent",
    type: "Worker",
    trustTier: "High",
    allowedActions: [
      "explain_policy_rationale",
      "summarize_guardian_decision",
      "generate_policy_guidance",
      "draft_rejection_notice",
    ],
    restrictedActions: [
      "modify_policy_outcome",
      "override_enforcement_decision",
      "alter_guardian_rationale",
    ],
    requiresGuardianFor: [],
    owner: "Policy Operations Team",
    status: "Active",
    lastActivity: "2026-06-21T12:24:00Z",
    description:
      "Generates plain-language explanations of policy decisions for advertisers and reviewers. Has read-only access to Guardian outputs and cannot modify enforcement outcomes.",
  },
  {
    agentId: "human-reviewer-copilot",
    name: "Human Reviewer Copilot",
    type: "Review Copilot",
    trustTier: "High",
    allowedActions: [
      "summarize_evidence",
      "highlight_policy_matches",
      "suggest_reviewer_action",
      "draft_case_notes",
      "compare_similar_cases",
    ],
    restrictedActions: [
      "change_enforcement_outcome",
      "override_guardian_decision",
      "approve_blocked_campaign",
    ],
    requiresGuardianFor: [],
    owner: "Human Review Operations",
    status: "Active",
    lastActivity: "2026-06-21T13:18:00Z",
    description:
      "Assists human reviewers by surfacing evidence, summarizing case context, and suggesting review actions. Operates in an advisory capacity only — cannot change enforcement outcomes or override Guardian decisions.",
  },
  {
    agentId: "guardian-agent",
    name: "Guardian Agent",
    type: "Guardian",
    trustTier: "System",
    allowedActions: [
      "evaluate_policy",
      "issue_allow_decision",
      "issue_allow_with_conditions",
      "issue_restrict_decision",
      "issue_escalate_decision",
      "issue_block_decision",
      "produce_audit_trail",
    ],
    restrictedActions: [],
    requiresGuardianFor: [],
    owner: "Trust & Safety Platform",
    status: "Active",
    lastActivity: "2026-06-21T14:00:00Z",
    description:
      "The policy enforcement overlay. Evaluates every proposed agentic action against the deterministic policy kernel and issues a binding decision. Guardian decisions are immutable and cannot be overridden by any other agent — including the Orchestrator.",
  },
];

export function getAgentById(agentId: string): RegistryAgent | undefined {
  return AGENT_REGISTRY.find((a) => a.agentId === agentId);
}

export function getAgentsByType(type: AgentType): RegistryAgent[] {
  return AGENT_REGISTRY.filter((a) => a.type === type);
}

/**
 * Returns the count of runtime events attributable to a given agent.
 * Deterministic — derived from seeded getRuntimeEvents().
 */
export function getEventsInitiatedByAgent(agentId: string): number {
  const events = getRuntimeEvents();
  return events.filter((e) => e.sourceAgentId === agentId).length;
}

/**
 * Returns the count of Guardian interventions (non-ALLOW decisions) for events
 * sourced from the given agent.
 */
export function getGuardianInterventionsForAgent(agentId: string): number {
  const events = getRuntimeEvents();
  return events.filter(
    (e) =>
      e.sourceAgentId === agentId &&
      (e.currentStatus === "Intercepted" ||
        e.currentStatus === "Blocked" ||
        e.currentStatus === "Escalated"),
  ).length;
}

/**
 * Returns the count of events where a specific action was blocked by Guardian
 * for events sourced from the given agent.
 */
export function getBlockedActionsForAgent(agentId: string): number {
  const events = getRuntimeEvents();
  return events.filter(
    (e) =>
      e.sourceAgentId === agentId &&
      (e.currentStatus === "Blocked" || e.currentStatus === "Intercepted"),
  ).length;
}
