import type { Scenario, GuardianOutput } from "@/lib/types";

const decisionMeta: Record<string, { color: string; label: string }> = {
  ALLOW: { color: "#6FB089", label: "Allow" },
  ALLOW_WITH_CONDITIONS: { color: "#F59E2E", label: "Allow with conditions" },
  RESTRICT: { color: "#9B89B8", label: "Restrict" },
  ESCALATE: { color: "#D97448", label: "Escalate to human" },
  BLOCK: { color: "#B83A3A", label: "Block" },
};

export default function InterceptionMoment({
  scenario,
  guardian,
}: {
  scenario: Scenario;
  guardian: GuardianOutput;
}) {
  const d = decisionMeta[guardian.decision];
  return (
    <section className="glass-strong p-6 relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          background: `radial-gradient(800px 220px at 50% 50%, ${d.color}22, transparent 60%)`,
        }}
      />
      <div className="relative">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
          <div>
            <div className="text-xs uppercase tracking-widest text-[var(--ink-2)]">
              Policy Interception
            </div>
            <div className="text-base font-semibold">
              Orchestrator proposed → Guardian intercepted → Final outcome
            </div>
          </div>
          <div
            className="text-[10px] uppercase tracking-widest px-2 py-1 rounded"
            style={{ color: d.color, background: `${d.color}15`, border: `1px solid ${d.color}55` }}
          >
            Final: {d.label}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Card
            step="1 · Orchestrator proposed"
            sub="Task Completion Layer"
            color="#C9A36B"
            body={scenario.interception.proposed}
          />
          <Card
            step="2 · Guardian intercepted"
            sub="Trust & Safety Control Layer"
            color="#F59E2E"
            body={scenario.interception.intercepted}
            extra={
              <div className="mt-2 flex flex-wrap gap-1">
                {guardian.reasonCodes.slice(0, 4).map((r) => (
                  <span
                    key={r}
                    className="text-[10px] px-1.5 py-0.5 rounded border"
                    style={{ borderColor: "rgba(245, 158, 46, 0.4)", color: "#F4EFE7" }}
                  >
                    {r}
                  </span>
                ))}
              </div>
            }
            glow
          />
          <Card
            step="3 · Final controlled outcome"
            sub={`Risk ${guardian.riskScore}/100 · ${guardian.riskLevel}`}
            color={d.color}
            body={scenario.interception.outcome}
            extra={
              guardian.humanReviewRequired ? (
                <div className="mt-2 text-[10px] uppercase tracking-widest" style={{ color: d.color }}>
                  ⚑ Human review required
                </div>
              ) : null
            }
          />
        </div>

        <div className="mt-4 text-[11px] text-[var(--ink-2)] text-center">
          The orchestrator never executes a proposed action directly — it is always intercepted by the Guardian overlay first.
        </div>
      </div>
    </section>
  );
}

function Card({
  step,
  sub,
  color,
  body,
  extra,
  glow,
}: {
  step: string;
  sub: string;
  color: string;
  body: string;
  extra?: React.ReactNode;
  glow?: boolean;
}) {
  return (
    <div
      className="p-4 rounded-xl border"
      style={{
        borderColor: `${color}66`,
        background: `linear-gradient(180deg, ${color}12, transparent)`,
        boxShadow: glow ? `0 0 24px ${color}33` : undefined,
      }}
    >
      <div className="text-[10px] uppercase tracking-widest" style={{ color }}>
        {step}
      </div>
      <div className="text-[10px] text-[var(--ink-2)] mt-0.5">{sub}</div>
      <div className="mt-3 text-sm text-[var(--ink-0)]/95 leading-relaxed">{body}</div>
      {extra}
    </div>
  );
}
