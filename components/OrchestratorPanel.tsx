import type { Scenario } from "@/lib/types";
import type { OrchestratorRun } from "@/lib/orchestratorEngine";

export default function OrchestratorPanel({
  scenario,
  orchestrator,
}: {
  scenario: Scenario;
  orchestrator: OrchestratorRun;
}) {
  return (
    <section className="glass p-5">
      <div className="flex items-center justify-between mb-2">
        <div>
          <div className="text-xs uppercase tracking-widest text-[var(--ink-2)]">
            Orchestrator Agent
          </div>
          <div className="text-base font-semibold">Plan &amp; invocation</div>
          <div className="text-[10px] uppercase tracking-widest mt-0.5" style={{ color: "#8FA1B3" }}>
            Task Completion Layer
          </div>
        </div>
        <span className="pill" style={{ borderColor: "rgba(143, 161, 179, 0.45)", color: "#8FA1B3" }}>
          coordinator
        </span>
      </div>

      <div className="text-xs text-[var(--ink-1)] mb-3">
        <span className="text-[var(--ink-2)]">Goal:</span> {orchestrator.plan.goal}
      </div>

      <div className="text-xs text-[var(--ink-2)] mb-1">Proposed actions</div>
      <ul className="text-sm mb-3 space-y-1">
        {orchestrator.plan.proposedActions.map((a) => (
          <li key={a} className="flex gap-2">
            <span style={{ color: "#8FA1B3" }}>›</span>
            <span>{a}</span>
          </li>
        ))}
      </ul>

      <div className="divider my-3" />

      <div className="text-xs text-[var(--ink-2)] mb-2">Worker invocation sequence</div>
      <ol className="space-y-1.5">
        {orchestrator.plan.steps.map((s) => (
          <li key={s.step} className="flex gap-3 text-sm">
            <span className="text-[var(--ink-2)] w-5 shrink-0">{s.step}.</span>
            <span className="font-medium text-[var(--ink-0)]/90 w-56 shrink-0">
              {s.agentName}
            </span>
            <span className="text-[var(--ink-1)] text-xs">{s.intent}</span>
          </li>
        ))}
      </ol>

      <div className="mt-4 text-xs p-3 rounded-lg border"
           style={{ borderColor: "rgba(245, 158, 46, 0.32)", background: "rgba(245, 158, 46, 0.06)" }}>
        ⓘ The orchestrator can propose actions, but cannot override the Guardian Agent.
      </div>

      <div className="text-[10px] text-[var(--ink-2)] mt-3">
        Request: <span className="text-[var(--ink-1)]">{scenario.requestedAction}</span>
      </div>
    </section>
  );
}
