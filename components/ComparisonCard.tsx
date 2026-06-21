export default function ComparisonCard() {
  return (
    <section className="glass p-5">
      <div className="text-xs uppercase tracking-widest text-[var(--ink-2)] mb-3">
        Two agents, two different questions
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          className="p-5 rounded-xl border relative overflow-hidden"
          style={{
            borderColor: "rgba(201, 163, 107, 0.45)",
            background: "linear-gradient(180deg, rgba(201, 163, 107, 0.10), rgba(13, 12, 10, 0.4))",
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="status-dot" style={{ background: "#C9A36B", boxShadow: "0 0 10px #C9A36B" }} />
            <div className="text-[11px] uppercase tracking-widest" style={{ color: "#C9A36B" }}>
              Orchestrator Agent
            </div>
          </div>
          <div className="text-[10px] uppercase tracking-wider text-[var(--ink-2)]">
            Task Completion Layer
          </div>
          <div className="text-xl font-semibold mt-2 leading-snug">
            “How do we complete the task?”
          </div>
          <div className="text-xs text-[var(--ink-1)] mt-3 leading-relaxed">
            Plans the work, invokes worker agents, proposes actions to ship the outcome the user asked for.
          </div>
        </div>

        <div
          className="p-5 rounded-xl border relative overflow-hidden"
          style={{
            borderColor: "rgba(245, 158, 46, 0.5)",
            background: "linear-gradient(180deg, rgba(245, 158, 46, 0.12), rgba(13, 12, 10, 0.4))",
            boxShadow: "0 0 30px rgba(245, 158, 46, 0.18)",
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="status-dot" style={{ background: "#F59E2E", boxShadow: "0 0 10px #F59E2E" }} />
            <div className="text-[11px] uppercase tracking-widest" style={{ color: "#F59E2E" }}>
              Guardian Agent
            </div>
          </div>
          <div className="text-[10px] uppercase tracking-wider text-[var(--ink-2)]">
            Trust &amp; Safety Control Layer
          </div>
          <div className="text-xl font-semibold mt-2 leading-snug">
            “Should this action be allowed?”
          </div>
          <div className="text-xs text-[var(--ink-1)] mt-3 leading-relaxed">
            Sits as an overlay above the orchestrator and workers. Applies policy, risk, fairness, and compliance rules before any action ships.
          </div>
        </div>
      </div>
    </section>
  );
}
