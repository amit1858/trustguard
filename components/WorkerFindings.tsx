import type { WorkerFinding } from "@/lib/types";

const statusMeta = {
  pass: { dot: "dot-pass", label: "Pass", color: "#6FB089" },
  warning: { dot: "dot-warn", label: "Warning", color: "#F59E2E" },
  fail: { dot: "dot-fail", label: "Fail", color: "#B83A3A" },
} as const;

export default function WorkerFindings({ findings }: { findings: WorkerFinding[] }) {
  return (
    <section className="glass p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-xs uppercase tracking-widest text-[var(--ink-2)]">
            Worker Agents
          </div>
          <div className="text-base font-semibold">Findings</div>
        </div>
        <span className="pill" style={{ borderColor: "rgba(155, 137, 184, 0.45)", color: "#C7B8DC" }}>
          {findings.length} agents
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {findings.map((f) => {
          const m = statusMeta[f.status];
          return (
            <div
              key={f.agentId}
              className="p-4 rounded-xl border"
              style={{
                borderColor: `${m.color}40`,
                background: `linear-gradient(180deg, ${m.color}0c, rgba(13, 12, 10, 0.5))`,
              }}
            >
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">{f.agentName}</div>
                <div className="flex items-center gap-2 text-xs" style={{ color: m.color }}>
                  <span className={`status-dot ${m.dot}`} />
                  {m.label}
                </div>
              </div>
              <div className="text-sm text-[var(--ink-1)] mt-1.5">{f.summary}</div>

              {f.evidence.length > 0 && (
                <div className="mt-3 space-y-1">
                  {f.evidence.map((e) => (
                    <div key={e.label} className="text-xs flex gap-2">
                      <span className="text-[var(--ink-2)] w-24 shrink-0">{e.label}</span>
                      <span className="text-[var(--ink-1)]">{e.detail}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between mt-3 pt-3 border-t border-[var(--border)]">
                <div className="text-[11px] text-[var(--ink-2)]">
                  Confidence{" "}
                  <span className="text-[var(--ink-1)]">
                    {(f.confidence * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="text-[11px]" style={{ color: m.color }}>
                  → {f.recommendedAction}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
