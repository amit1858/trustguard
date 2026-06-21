export default function ExecutiveSummaryCard() {
  const rows: Array<{ label: string; body: string }> = [
    {
      label: "What it is",
      body:
        "A Guardian Agent control plane that intercepts risky actions from agentic ads workflows before execution.",
    },
    {
      label: "What it is not",
      body:
        "It does not replace existing Ads Trust & Safety systems or human reviewers — it sits in front of them and routes only what needs attention.",
    },
    {
      label: "Where it sits",
      body:
        "Between agentic workflow orchestration and the execution APIs that launch campaigns, change targeting, increase budgets, approve advertisers, or auto-resolve appeals.",
    },
    {
      label: "Source of truth",
      body:
        "Final Guardian decisions are governed by the deterministic policy kernel. BYOK AI only assists with explanation and summarization — it cannot change decisions, allowed actions, or blocked actions.",
    },
    {
      label: "Prototype boundary",
      body:
        "This prototype uses mock events, mock connectors, simulated review workflows, and localStorage persistence. No external ads systems are connected.",
    },
  ];

  return (
    <section
      className="glass-strong"
      style={{
        padding: 22,
        borderRadius: 14,
        border: "1px solid rgba(245, 158, 46, 0.28)",
        boxShadow:
          "0 16px 40px rgba(0,0,0,0.35), 0 0 0 1px rgba(245, 158, 46, 0.10) inset",
      }}
    >
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <div
            className="text-[10px] uppercase tracking-widest"
            style={{ color: "#F59E2E" }}
          >
            Executive summary
          </div>
          <h2 className="text-xl font-semibold mt-0.5 text-[var(--ink-0)]">
            TrustGuard in one minute
          </h2>
          <p className="text-xs text-[var(--ink-2)] mt-1 max-w-2xl">
            For a senior Ads Trust &amp; Safety product leader. Three takeaways:
            <span className="text-[var(--ink-1)]"> runtime interception</span>,{" "}
            <span className="text-[var(--ink-1)]">deterministic policy kernel</span>, and{" "}
            <span className="text-[var(--ink-1)]">human review with audit</span>.
          </p>
        </div>
        <span
          className="pill text-[10px]"
          style={{
            borderColor: "rgba(245, 158, 46, 0.5)",
            background: "rgba(245, 158, 46, 0.12)",
            color: "#F4EFE7",
            whiteSpace: "nowrap",
          }}
        >
          Phase 2D · Executive demo ready
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {rows.map((r) => (
          <div
            key={r.label}
            className="surface-elevated"
            style={{
              padding: 14,
              borderRadius: 10,
              border: "1px solid var(--border)",
            }}
          >
            <div className="text-[10px] uppercase tracking-widest text-[var(--ink-2)] mb-1">
              {r.label}
            </div>
            <div className="text-sm text-[var(--ink-0)]/95 leading-relaxed">
              {r.body}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
