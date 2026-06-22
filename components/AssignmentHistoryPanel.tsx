"use client";

import type { AssignmentHistoryEntry } from "@/lib/types";

const SOURCE_LABELS: Record<AssignmentHistoryEntry["source"], string> = {
  manual: "Manual",
  system: "System",
  queue_rule: "Queue Rule",
};

const SOURCE_COLORS: Record<AssignmentHistoryEntry["source"], string> = {
  manual: "#C9A36B",
  system: "#8FA1B3",
  queue_rule: "#9B89B8",
};

function fmtTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export default function AssignmentHistoryPanel({
  history,
  currentOwner,
}: {
  history: AssignmentHistoryEntry[];
  currentOwner: string;
}) {
  if (history.length === 0) {
    return (
      <section className="glass rounded-xl p-5">
        <div className="text-sm font-semibold mb-2">Reviewer Assignment History</div>
        <div className="text-xs text-[var(--ink-2)]">No assignment history yet. Use &ldquo;Assign to me&rdquo; to claim this case.</div>
      </section>
    );
  }

  // Reverse-chrono display; latest = current
  const ordered = [...history].reverse();

  return (
    <section className="glass rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-semibold">Reviewer Assignment History</div>
        <span className="text-[10px] uppercase tracking-wider text-[var(--ink-2)]">
          {history.length} assignment{history.length !== 1 ? "s" : ""}
        </span>
      </div>
      <ol className="relative border-l border-white/8 ml-3 pl-5 space-y-3">
        {ordered.map((entry, i) => {
          const isCurrent = i === 0;
          const color = SOURCE_COLORS[entry.source];
          return (
            <li key={entry.assignedAt + entry.ownerId} className="relative">
              <span
                className="absolute -left-[25px] top-1 w-3 h-3 rounded-full"
                style={{
                  background: isCurrent ? color : "transparent",
                  border: `2px solid ${color}`,
                  boxShadow: isCurrent ? `0 0 8px -2px ${color}` : "none",
                }}
              />
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <span
                    className="text-xs font-medium"
                    style={{ color: isCurrent ? "var(--ink-0)" : "var(--ink-1)" }}
                  >
                    {entry.ownerName}
                  </span>
                  {isCurrent && currentOwner !== "Unassigned" && (
                    <span
                      className="ml-2 text-[10px] px-1.5 py-0.5 rounded border"
                      style={{ borderColor: color + "60", color }}
                    >
                      Current
                    </span>
                  )}
                  <div className="text-[11px] text-[var(--ink-2)] mt-0.5">
                    <span
                      className="px-1 py-0.5 rounded border text-[10px] mr-1"
                      style={{ borderColor: color + "40", color: color }}
                    >
                      {SOURCE_LABELS[entry.source]}
                    </span>
                    {entry.ownerId !== "system" ? `ID: ${entry.ownerId}` : ""}
                  </div>
                </div>
                <div className="text-[10px] text-[var(--ink-2)] tabular-nums shrink-0">
                  {fmtTime(entry.assignedAt)}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
