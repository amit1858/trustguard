import type { GuardianDecision } from "./types";
import { getAgentById } from "./agentRegistry";

export type AuthorizationLevel =
  | "Allowed"
  | "Restricted"
  | "Not authorized";

export type FinalPermissionResult =
  | "Allowed to request"
  | "Requires Guardian approval"
  | "Requires human review"
  | "Not authorized";

export interface PermissionResult {
  agentId: string;
  agentName: string;
  requestedAction: string;
  authorizationLevel: AuthorizationLevel;
  requiresGuardianApproval: boolean;
  humanApprovalRequired: boolean;
  finalResult: FinalPermissionResult;
  rationale: string;
}

/**
 * Deterministic permission check.
 * Derives authorization from the agent registry's allowed/restricted/requiresGuardianFor lists.
 * The optional guardianDecision refines whether human review is needed.
 */
export function checkAgentPermission(
  agentId: string,
  requestedAction: string,
  guardianDecision?: GuardianDecision,
): PermissionResult {
  const agent = getAgentById(agentId);

  if (!agent) {
    return {
      agentId,
      agentName: "Unknown Agent",
      requestedAction,
      authorizationLevel: "Not authorized",
      requiresGuardianApproval: true,
      humanApprovalRequired: true,
      finalResult: "Not authorized",
      rationale:
        "Agent is not registered in the TrustGuard agent registry. All actions from unregistered agents are blocked.",
    };
  }

  const isAllowed = agent.allowedActions.some((a) =>
    a.toLowerCase() === requestedAction.toLowerCase() ||
    requestedAction.toLowerCase().includes(a.toLowerCase().replace(/_/g, " "))
  );
  const isRestricted = agent.restrictedActions.some((a) =>
    a.toLowerCase() === requestedAction.toLowerCase() ||
    requestedAction.toLowerCase().includes(a.toLowerCase().replace(/_/g, " "))
  );
  const requiresGuardian = agent.requiresGuardianFor.some((a) =>
    a.toLowerCase() === requestedAction.toLowerCase() ||
    requestedAction.toLowerCase().includes(a.toLowerCase().replace(/_/g, " "))
  );

  let authorizationLevel: AuthorizationLevel;
  if (isRestricted) {
    authorizationLevel = "Restricted";
  } else if (isAllowed) {
    authorizationLevel = "Allowed";
  } else {
    authorizationLevel = "Not authorized";
  }

  // Guardian approval: required if in requiresGuardianFor list, or if action is restricted
  const requiresGuardianApproval = requiresGuardian || isRestricted;

  // Human approval: derived from Guardian decision if available, otherwise from sensitivity
  let humanApprovalRequired = false;
  if (guardianDecision) {
    switch (guardianDecision) {
      case "ESCALATE":
        humanApprovalRequired = true;
        break;
      case "ALLOW_WITH_CONDITIONS":
        humanApprovalRequired = requiresGuardianApproval; // conditional
        break;
      case "RESTRICT":
        humanApprovalRequired = false; // restricted means blocked, not escalated
        break;
      case "BLOCK":
        humanApprovalRequired = false; // hard block, no human path
        break;
      case "ALLOW":
        humanApprovalRequired = false;
        break;
    }
  } else if (isRestricted) {
    humanApprovalRequired = false;
  } else if (requiresGuardian) {
    humanApprovalRequired = false; // Guardian decides, not necessarily human
  }

  // Determine final result
  let finalResult: FinalPermissionResult;
  if (authorizationLevel === "Not authorized") {
    finalResult = "Not authorized";
  } else if (authorizationLevel === "Restricted") {
    finalResult = guardianDecision === "ALLOW_WITH_CONDITIONS"
      ? "Requires human review"
      : "Not authorized";
  } else if (humanApprovalRequired) {
    finalResult = "Requires human review";
  } else if (requiresGuardianApproval) {
    finalResult = "Requires Guardian approval";
  } else {
    finalResult = "Allowed to request";
  }

  // Build rationale
  let rationale: string;
  if (authorizationLevel === "Not authorized") {
    rationale = `${agent.name} is not authorized to perform "${requestedAction}". This action is not in the agent's allowed-actions list and is not a recognized governance action for this agent type.`;
  } else if (authorizationLevel === "Restricted") {
    rationale = `"${requestedAction}" is in ${agent.name}'s restricted-actions list. Restricted actions may only proceed under extraordinary circumstances with Guardian and human approval.`;
  } else if (requiresGuardianApproval && humanApprovalRequired) {
    rationale = `${agent.name} may request "${requestedAction}", but this action requires both Guardian evaluation and human reviewer approval before execution.`;
  } else if (requiresGuardianApproval) {
    rationale = `${agent.name} may request "${requestedAction}", but Guardian must evaluate this action before it proceeds.`;
  } else {
    rationale = `${agent.name} is authorized to request "${requestedAction}" within its trust tier (${agent.trustTier}). No Guardian escalation required for this action.`;
  }

  return {
    agentId,
    agentName: agent.name,
    requestedAction,
    authorizationLevel,
    requiresGuardianApproval,
    humanApprovalRequired,
    finalResult,
    rationale,
  };
}
