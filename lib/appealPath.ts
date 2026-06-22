import type { GuardianDecision } from "./types";
import type { ReviewOutcome, ReviewerOutcome, FinalEnforcementAction } from "./cases";

export interface AppealPath {
  originalDecision: GuardianDecision;
  humanReviewOutcome: string;
  finalEnforcementAction: string;
  appealEligibility: string;
  nextPossibleAction: string;
  immutableNote: string;
}

// Eligibility text keyed by [decision][vertical] with "default" fallback
const ELIGIBILITY: Record<string, Record<string, string>> = {
  BLOCK: {
    "Financial Services":
      "Advertiser may resubmit after correcting all flagged claims, uploading required regulatory certifications (e.g., RBI NBFC / SCA), and upgrading landing-page disclosures.",
    "Health / Supplements":
      "Advertiser may resubmit after providing peer-reviewed substantiation and adding required FDA/FTC disclaimers above the fold.",
    default:
      "Advertiser may resubmit after correcting policy violations identified in the Guardian decision. All reason codes must be addressed before re-evaluation.",
  },
  ESCALATE: {
    default:
      "Case is under active human policy review. Advertiser may submit additional context via the appeal channel while specialist review is in progress.",
  },
  RESTRICT: {
    Employment:
      "Targeting change is restricted. Advertiser may resubmit with a fair-audience-compliant targeting set that meets EEOC requirements.",
    default:
      "Campaign can continue with current approved targeting. Proposed targeting changes require policy specialist approval before activation.",
  },
  ALLOW_WITH_CONDITIONS: {
    default:
      "Campaign can launch once all specified conditions are verified by a reviewer. No further appeal needed.",
  },
  ALLOW: {
    default: "Campaign approved. No appeal process applies.",
  },
};

function getEligibility(decision: GuardianDecision, vertical: string): string {
  const map = ELIGIBILITY[decision] ?? {};
  return map[vertical] ?? map["default"] ?? "Contact Trust & Safety for case-specific guidance.";
}

// Next action text keyed by [decision][vertical] with "default" fallback
const NEXT_ACTION: Record<string, Record<string, string>> = {
  BLOCK: {
    "Financial Services":
      "Operator: Collect certifications and corrected disclosures, then queue for re-evaluation.",
    default:
      "Operator: Review flagged reason codes, request corrected creative + landing page from advertiser, then close or re-evaluate.",
  },
  ESCALATE: {
    default:
      "Operator: Assign to policy specialist for substantive review within SLA. Log specialist ruling as a review outcome.",
  },
  RESTRICT: {
    default:
      "Operator: Apply Guardian-mandated targeting guardrails and obtain advertiser written acknowledgement.",
  },
  ALLOW_WITH_CONDITIONS: {
    default:
      "Operator: Verify all conditions are met, then mark case Approved with Conditions and notify advertiser.",
  },
  ALLOW: {
    default: "No operator action required. Monitor per standard policy cadence.",
  },
};

function getNextActionPending(decision: GuardianDecision, vertical: string): string {
  const map = NEXT_ACTION[decision] ?? {};
  return map[vertical] ?? map["default"] ?? "Follow up per standard policy process.";
}

function getNextActionAfterOutcome(outcome: ReviewerOutcome): string {
  switch (outcome) {
    case "Upheld Guardian Decision":
      return "Notify advertiser with reason codes and correction checklist.";
    case "Approved with Conditions":
      return "Send conditions checklist to advertiser. Verify compliance before launch.";
    case "Reversed after Evidence":
      return "Update campaign status to approved. Notify advertiser of reinstatement.";
    case "Escalated to Policy":
      return "Await policy specialist ruling within 48h SLA. Log specialist decision as follow-up outcome.";
    case "Closed as Duplicate":
      return "Link to parent case. Archive this case record.";
    case "No Action Needed":
      return "Archive case. No advertiser notification required.";
    default:
      return "Follow up with advertiser per standard process.";
  }
}

function deriveDefaultEnforcement(decision: GuardianDecision): FinalEnforcementAction {
  switch (decision) {
    case "BLOCK":
      return "Campaign remains blocked";
    case "ESCALATE":
      return "Sent to policy specialist";
    case "RESTRICT":
      return "Campaign restricted";
    case "ALLOW_WITH_CONDITIONS":
      return "Campaign can launch with conditions";
    default:
      return "Advertiser evidence requested";
  }
}

/**
 * Derive the appeal & review path for a case.
 * - guardianDecision: the immutable Guardian verdict
 * - vertical: scenario vertical (used for policy-specific guidance)
 * - caseOutcomes: reviewer outcomes for this case (latest = index 0)
 */
export function computeAppealPath(
  guardianDecision: GuardianDecision,
  vertical: string,
  caseOutcomes: ReviewOutcome[],
): AppealPath {
  const latest = caseOutcomes.length > 0 ? caseOutcomes[0] : null;

  const humanReviewOutcome = latest?.reviewerOutcome ?? "Pending human review";
  const finalEnforcementAction = latest?.finalEnforcementAction ?? deriveDefaultEnforcement(guardianDecision);
  const appealEligibility = getEligibility(guardianDecision, vertical);
  const nextPossibleAction = latest
    ? getNextActionAfterOutcome(latest.reviewerOutcome)
    : getNextActionPending(guardianDecision, vertical);

  return {
    originalDecision: guardianDecision,
    humanReviewOutcome,
    finalEnforcementAction,
    appealEligibility,
    nextPossibleAction,
    immutableNote:
      "The Guardian decision above is immutable — it was recorded deterministically at case creation time. Human review outcomes are a separate layer and do not rewrite the original Guardian evaluation.",
  };
}
