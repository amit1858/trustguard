import type { AuditEvent } from "@/lib/types";

const actorColor: Record<string, string> = {
  user: "#C9A36B",
  orchestrator: "#C9A36B",
  worker: "#9B89B8",
  guardian: "#F59E2E",
  system: "#aab0c8",
};

export default function AuditTrail({ events }: { events: AuditEvent[] }) {
  return (
    <section className="glass p-5">
      <div className="text-xs uppercase tracking-widest text-[var(--ink-2)] mb-1">
        Audit trail
      </div>
      <div className="text-base font-semibold mb-3">User request → Guardian decision</div>
      <ol className="relative border-l border-[var(--border)] ml-3 pl-5 space-y-3">
        {events.map((e, i) => {
          const color = actorColor[e.actor] || "#aab0c8";
          return (
            <li key={i} className="relative">
              <span
                className="absolute -left-[27px] top-1.5 w-3 h-3 rounded-full"
                style={{ background: color, boxShadow: `0 0 10px ${color}` }}
              />
              <div className="flex items-baseline justify-between gap-3 flex-wrap">
                <div className="text-sm">
                  <span className="uppercase text-[10px] tracking-widest mr-2"
                        style={{ color }}>{e.actor}</span>
                  <span className="text-[var(--ink-0)]/90">{e.event}</span>
                  {e.detail && (
                    <span className="text-[var(--ink-1)] text-xs ml-1">— {e.detail}</span>
                  )}
                </div>
                <div className="text-[10px] text-[var(--ink-2)] tabular-nums">
                  {new Date(e.ts).toLocaleTimeString()}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
