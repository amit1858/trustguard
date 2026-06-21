import type { Scenario, AuditEvent, OrchestratorPlan } from "./types";

export interface OrchestratorRun {
  plan: OrchestratorPlan;
  invokedAgents: string[];
  audit: AuditEvent[];
}

function ts(offsetMs: number) {
  return new Date(Date.now() + offsetMs).toISOString();
}

export function runOrchestrator(scenario: Scenario): OrchestratorRun {
  const audit: AuditEvent[] = [];
  audit.push({ ts: ts(0), actor: "user", event: "User request received", detail: `${scenario.advertiser} → ${scenario.requestedAction}` });
  audit.push({ ts: ts(50), actor: "orchestrator", event: "Orchestrator created plan", detail: scenario.orchestratorPlan.goal });

  const invokedAgents: string[] = [];
  scenario.orchestratorPlan.steps.forEach((s, i) => {
    if (s.agentId === "orchestrator") return;
    audit.push({ ts: ts(120 + i * 60), actor: "worker", event: `${s.agentName} invoked`, detail: s.intent });
    invokedAgents.push(s.agentName);
  });

  scenario.workerFindings.forEach((f, i) => {
    audit.push({
      ts: ts(600 + i * 50),
      actor: "worker",
      event: `${f.agentName} → ${f.status.toUpperCase()}`,
      detail: f.summary,
    });
  });

  audit.push({ ts: ts(950), actor: "orchestrator", event: "Worker agents completed checks", detail: `${scenario.workerFindings.length} agents reported` });
  audit.push({ ts: ts(1000), actor: "orchestrator", event: "Findings aggregated; handing off to Guardian Agent" });

  return { plan: scenario.orchestratorPlan, invokedAgents, audit };
}
