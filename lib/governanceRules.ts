export type RuleSeverity = "Advisory" | "Enforced";

export interface GovernanceRule {
  id: string;
  title: string;
  description: string;
  affectedAgentIds: string[];
  severity: RuleSeverity;
}

export const GOVERNANCE_RULES: GovernanceRule[] = [
  {
    id: "GOV-001",
    title: "Budget auto-increase cap requires Guardian approval",
    description:
      "The Budget Optimization Agent cannot autonomously increase a campaign budget above 2× the current cap. Any proposed increase exceeding this threshold must be routed to Guardian for policy evaluation before execution. This prevents runaway spend from undetected fraud or optimization errors.",
    affectedAgentIds: ["budget-optimization"],
    severity: "Enforced",
  },
  {
    id: "GOV-002",
    title: "Restricted-vertical appeals cannot be auto-approved",
    description:
      "The Appeal Resolution Agent cannot automatically approve appeals for ads in restricted verticals (Financial Services, Health & Supplements, Pharmaceuticals, Employment). All such appeals must be escalated to Guardian evaluation and subsequently to human review.",
    affectedAgentIds: ["appeal-resolution"],
    severity: "Enforced",
  },
  {
    id: "GOV-003",
    title: "Rejected ads require Guardian evaluation before relaunch",
    description:
      "The Creative Optimization Agent cannot relaunch previously rejected advertisements without first routing the relaunch request through Guardian. Guardian re-evaluates the modified creative against current policy to ensure the violation has been remediated.",
    affectedAgentIds: ["creative-optimization"],
    severity: "Enforced",
  },
  {
    id: "GOV-004",
    title: "Human Reviewer Copilot operates in advisory capacity only",
    description:
      "The Human Reviewer Copilot may summarize evidence, highlight policy matches, and suggest reviewer actions, but it cannot change enforcement outcomes, approve blocked campaigns, or override Guardian decisions. All final enforcement actions must be taken by a verified human operator.",
    affectedAgentIds: ["human-reviewer-copilot"],
    severity: "Enforced",
  },
  {
    id: "GOV-005",
    title: "Orchestrator can propose actions but cannot override Guardian",
    description:
      "The Campaign Orchestrator Agent is authorized to create plans, invoke worker agents, and propose actions to Guardian. It is explicitly prohibited from executing any proposed action without a Guardian decision, and cannot override, bypass, or ignore a Guardian BLOCK, RESTRICT, or ESCALATE ruling.",
    affectedAgentIds: ["campaign-orchestrator"],
    severity: "Enforced",
  },
];
