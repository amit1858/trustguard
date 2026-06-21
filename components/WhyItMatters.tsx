export default function WhyItMatters() {
  const points = [
    { t: "Agents are taking real-world action", d: "Agentic ads systems can launch campaigns, change targeting, raise budgets, approve advertisers, and reply to appeals — autonomously." },
    { t: "Model judgment ≠ policy enforcement", d: "LLM-driven agents can hallucinate, be jailbroken, or be manipulated. Trust & safety needs a deterministic, auditable governor — not vibes." },
    { t: "Guardian is the runtime control layer", d: "TrustGuard sits above the orchestrator and worker agents, applying policy, risk, fairness, and compliance rules before any action ships." },
    { t: "Audit, escalation, and BYOK by design", d: "Every decision is logged with reason codes and matched policies. High-risk actions escalate to humans. AI assistance is optional and never overrides policy." },
  ];
  return (
    <section className="glass-strong p-6">
      <div className="text-xs uppercase tracking-widest text-[var(--ink-2)] mb-1">Why this matters</div>
      <div className="text-xl font-semibold mb-1 grad-text">A runtime trust-and-safety control layer for agentic ads</div>
      <div className="text-sm text-[var(--ink-1)] mb-5 max-w-3xl">
        Before agents launch campaigns, change targeting, increase budgets, approve advertisers, or respond to appeals — TrustGuard governs the action.
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {points.map((p) => (
          <div key={p.t} className="p-4 rounded-xl border border-[var(--border)]"
               style={{ background: "linear-gradient(180deg, rgba(201, 163, 107, 0.05), transparent)" }}>
            <div className="text-sm font-semibold text-[var(--ink-0)]/95">{p.t}</div>
            <div className="text-xs text-[var(--ink-1)] mt-1">{p.d}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
