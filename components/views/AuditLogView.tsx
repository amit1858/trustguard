"use client";

import { useMemo, useState } from "react";
import { useCaseStore } from "@/lib/caseStore";

function fmtTime(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export default function AuditLogView({ onOpenCase }: { onOpenCase: (caseId: string) => void }) {
  const { ledger, cases } = useCaseStore();
  const [filterCase, setFilterCase] = useState<string>("all");
  const [filterAction, setFilterAction] = useState<string>("all");

  const actions = useMemo(() => Array.from(new Set(ledger.map((e) => e.action))).sort(), [ledger]);

  const rows = useMemo(
    () =>
      ledger.filter(
        (e) =>
          (filterCase === "all" || e.caseId === filterCase) &&
          (filterAction === "all" || e.action === filterAction),
      ),
    [ledger, filterCase, filterAction],
  );

  function exportLedger() {
    const blob = new Blob([JSON.stringify(rows, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `trustguard-ledger-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Audit Log</h1>
        <p className="text-sm text-[var(--ink-2)]">
          Append-only decision ledger of operator actions across all cases.
        </p>
      </header>

      <section className="glass rounded-xl p-3 flex flex-wrap gap-3 items-center justify-between">
        <div className="flex items-center gap-2 text-xs">
          <span className="text-[var(--ink-2)]">Case</span>
          <select
            value={filterCase}
            onChange={(e) => setFilterCase(e.target.value)}
            className="bg-black/40 border border-white/10 rounded-md px-2 py-1"
          >
            <option value="all">All cases</option>
            {cases.map((c) => (
              <option key={c.caseId} value={c.caseId}>
                {c.caseId} · {c.advertiserName}
              </option>
            ))}
          </select>
          <span className="text-[var(--ink-2)] ml-3">Action</span>
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="bg-black/40 border border-white/10 rounded-md px-2 py-1"
          >
            <option value="all">All actions</option>
            {actions.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
        <button
          className="pill text-xs"
          onClick={exportLedger}
          style={{ borderColor: "rgba(167,139,250,0.5)", color: "#C7B8DC" }}
        >
          ⬇ Export ledger
        </button>
      </section>

      <section className="glass rounded-xl overflow-hidden">
        <div className="grid grid-cols-[170px_110px_1fr_140px_220px] gap-3 px-4 py-2 text-[10px] uppercase tracking-wider text-[var(--ink-2)] border-b border-white/5 bg-black/30">
          <div>Timestamp</div>
          <div>Case</div>
          <div>Event</div>
          <div>Actor</div>
          <div>Transition / Note</div>
        </div>
        {rows.length === 0 && (
          <div className="px-4 py-8 text-sm text-[var(--ink-2)] text-center">
            No operator events recorded yet. Open a case in the Review Queue and take an action.
          </div>
        )}
        {rows.map((ev) => (
          <button
            key={ev.eventId}
            onClick={() => onOpenCase(ev.caseId)}
            className="w-full text-left grid grid-cols-[170px_110px_1fr_140px_220px] gap-3 px-4 py-2 items-center border-b border-white/5 hover:bg-white/[0.03] text-xs"
          >
            <div className="text-[var(--ink-2)]">{fmtTime(ev.timestamp)}</div>
            <div className="font-mono text-[var(--ink-2)]">{ev.caseId}</div>
            <div className="font-medium">{ev.label}</div>
            <div className="text-[var(--ink-2)]">{ev.actor}</div>
            <div className="text-[var(--ink-2)] truncate">
              {ev.previousStatus && ev.newStatus
                ? `${ev.previousStatus} → ${ev.newStatus}`
                : ev.note
                ? `"${ev.note}"`
                : "—"}
            </div>
          </button>
        ))}
      </section>
    </div>
  );
}
