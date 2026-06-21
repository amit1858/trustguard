import { getControlPlaneMetrics } from "@/lib/controlPlane";

const decisionColors: Record<string, string> = {
  ALLOW: "#6FB089",
  ALLOW_WITH_CONDITIONS: "#F59E2E",
  RESTRICT: "#9B89B8",
  ESCALATE: "#D97448",
  BLOCK: "#B83A3A",
};

export default function ControlPlaneMetrics() {
  const m = getControlPlaneMetrics();
  const interceptPct = Math.round((m.intercepted / m.totalActions) * 100);

  return (
    <section className="glass p-5">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div>
          <div className="text-xs uppercase tracking-widest text-[var(--ink-2)]">
            Control plane · session metrics
          </div>
          <div className="text-base font-semibold">Aggregate across all scenarios</div>
        </div>
        <span className="pill" style={{ borderColor: "rgba(201, 163, 107, 0.45)", color: "#F4EFE7" }}>
          live · {m.totalActions} agent actions
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Metric label="Actions intercepted" value={`${m.intercepted}/${m.totalActions}`} sub={`${interceptPct}% of agent actions`} color="#F59E2E" />
        <Metric label="Human reviews" value={`${m.humanReviews}`} sub="routed to specialists" color="#D97448" />
        <Metric label="Policies fired" value={`${m.policiesFired}`} sub="across all scenarios" color="#9B89B8" />
        <Metric label="Avg risk" value={`${m.avgRisk}`} sub="/ 100" color="#C9A36B" />
        <Metric label="Auto-allowed" value={`${m.byDecision.ALLOW}`} sub="zero policy hits" color="#6FB089" />
      </div>

      {/* Decision distribution bar */}
      <div className="mt-4">
        <div className="text-[11px] uppercase tracking-widest text-[var(--ink-2)] mb-1.5">
          Decision distribution
        </div>
        <div
          className="flex h-3 w-full rounded-full overflow-hidden border"
          style={{ borderColor: "var(--border)" }}
        >
          {(Object.keys(m.byDecision) as Array<keyof typeof m.byDecision>).map((k) => {
            const count = m.byDecision[k];
            if (count === 0) return null;
            const pct = (count / m.totalActions) * 100;
            return (
              <div
                key={k}
                title={`${k}: ${count}`}
                style={{ width: `${pct}%`, background: decisionColors[k], boxShadow: `0 0 12px ${decisionColors[k]}55` }}
              />
            );
          })}
        </div>
        <div className="flex flex-wrap gap-3 mt-2">
          {(Object.keys(m.byDecision) as Array<keyof typeof m.byDecision>).map((k) => (
            <div key={k} className="flex items-center gap-1.5 text-[11px] text-[var(--ink-1)]">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ background: decisionColors[k] }} />
              <span className="text-[var(--ink-2)]">{k.replace("_", " ")}</span>
              <span className="text-[var(--ink-0)]">{m.byDecision[k]}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Metric({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div className="p-3 rounded-xl border" style={{ borderColor: `${color}40`, background: `${color}0a` }}>
      <div className="text-[10px] uppercase tracking-widest text-[var(--ink-2)]">{label}</div>
      <div className="text-2xl font-bold mt-0.5" style={{ color }}>{value}</div>
      <div className="text-[10px] text-[var(--ink-1)] mt-0.5">{sub}</div>
    </div>
  );
}
