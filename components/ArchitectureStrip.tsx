const workflow = [
  { label: "User Request", color: "#B8B0A3" },
  { label: "Orchestrator Agent", color: "#8FA1B3", sub: "Task Completion Layer" },
  { label: "Worker Agents", color: "#C9A36B", sub: "6 specialized checks" },
  { label: "Safe Action / Human Review", color: "#6FB089" },
];

export default function ArchitectureStrip() {
  return (
    <section className="glass p-5 relative overflow-hidden">
      <div className="text-xs uppercase tracking-widest text-[var(--ink-2)] mb-4">
        Agentic ads control flow
      </div>

      <div
        className="relative rounded-2xl p-5 md:p-6 mt-2"
        style={{
          border: "1.5px dashed rgba(245, 158, 46, 0.50)",
          background:
            "linear-gradient(180deg, rgba(245, 158, 46, 0.05), rgba(245, 158, 46, 0.01))",
          boxShadow:
            "inset 0 0 40px rgba(245, 158, 46, 0.06), 0 0 24px rgba(245, 158, 46, 0.10)",
        }}
      >
        <div
          className="absolute -top-3 left-5 px-3 py-1 rounded-full text-[11px] uppercase tracking-widest font-semibold flex items-center gap-2"
          style={{
            background: "linear-gradient(90deg, #F59E2E, #C9A36B)",
            color: "#0D0C0A",
            boxShadow: "0 0 14px rgba(245, 158, 46, 0.45)",
          }}
        >
          <span>🛡</span>
          <span>Guardian Agent · Trust &amp; Safety Control Layer</span>
        </div>
        <div
          className="absolute -top-3 right-5 px-3 py-1 rounded-full text-[10px] uppercase tracking-widest hidden md:block"
          style={{
            background: "rgba(13, 12, 10, 0.9)",
            border: "1px solid rgba(245, 158, 46, 0.45)",
            color: "#F4EFE7",
          }}
        >
          Overlay · intercepts all actions
        </div>

        <div className="mt-3 flex items-stretch gap-2 overflow-x-auto">
          {workflow.map((s, i) => (
            <div key={s.label} className="flex items-center gap-2 shrink-0">
              <div
                className="px-3 py-2.5 rounded-lg text-sm font-medium border min-w-[160px]"
                style={{
                  borderColor: `${s.color}55`,
                  background: `linear-gradient(180deg, ${s.color}14, transparent)`,
                  boxShadow: `0 0 14px ${s.color}18`,
                }}
              >
                <div>{s.label}</div>
                {s.sub && (
                  <div className="text-[10px] uppercase tracking-wider text-[var(--ink-2)] mt-0.5">
                    {s.sub}
                  </div>
                )}
              </div>
              {i < workflow.length - 1 && (
                <span className="text-[var(--ink-2)]">→</span>
              )}
            </div>
          ))}
        </div>

        <div className="mt-4 text-[11px] text-[var(--ink-1)]">
          The dashed amber frame is the Guardian overlay. Every action proposed inside the workflow — by the orchestrator or any worker — passes through Guardian policy evaluation before it can ship.
        </div>
      </div>
    </section>
  );
}
