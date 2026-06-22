"use client";

import { useMemo, useState } from "react";
import { useCaseStore } from "@/lib/caseStore";
import {
  CaseRecord,
  DECISION_COLORS,
  PRIORITY_COLORS,
  STATUS_COLORS,
  QUALITY_MARKER_COLORS,
  QUALITY_MARKER_LABELS,
} from "@/lib/cases";
import QueueHealthStrip from "@/components/QueueHealthStrip";
import { SLA_STATE_COLORS, SLA_STATE_LABELS, computeSlaState } from "@/lib/sla";
import CaseDetailDrawer from "./CaseDetailDrawer";

type Filter = "all" | "critical" | "escalate" | "block" | "restrict" | "waiting";
type Sort = "risk" | "sla" | "created";

const SLA_HOURS: Record<string, number> = { "2h": 2, "4h": 4, "24h": 24, "48h": 48 };

function matchesFilter(c: CaseRecord, f: Filter): boolean {
  switch (f) {
    case "all":
      return true;
    case "critical":
      return c.priority === "Critical";
    case "escalate":
      return c.guardianDecision === "ESCALATE";
    case "block":
      return c.guardianDecision === "BLOCK";
    case "restrict":
      return c.guardianDecision === "RESTRICT";
    case "waiting":
      return c.status === "Waiting for Advertiser";
  }
}

function sortCases(rows: CaseRecord[], s: Sort): CaseRecord[] {
  const copy = [...rows];
  if (s === "risk") copy.sort((a, b) => b.riskScore - a.riskScore);
  if (s === "sla") copy.sort((a, b) => (SLA_HOURS[a.sla] ?? 999) - (SLA_HOURS[b.sla] ?? 999));
  if (s === "created") copy.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return copy;
}

function isToday(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return d.toDateString() === now.toDateString();
}

export default function ReviewQueueView({
  initialCaseId,
  onClearInitial,
}: {
  initialCaseId?: string | null;
  onClearInitial?: () => void;
}) {
  const { cases, reset } = useCaseStore();
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>("risk");
  const [openCaseId, setOpenCaseId] = useState<string | null>(initialCaseId ?? null);

  const rows = useMemo(
    () => sortCases(cases.filter((c) => matchesFilter(c, filter)), sort),
    [cases, filter, sort],
  );

  const summary = useMemo(() => {
    const open = cases.filter((c) => c.status !== "Closed").length;
    const critical = cases.filter((c) => c.priority === "Critical" && c.status !== "Closed").length;
    const waiting = cases.filter((c) => c.status === "Waiting for Advertiser").length;
    const closedToday = cases.filter((c) => c.status === "Closed" && isToday(c.updatedAt)).length;
    // "SLA at risk" — Critical or High priority still open
    const slaAtRisk = cases.filter(
      (c) => (c.priority === "Critical" || c.priority === "High") && c.status !== "Closed" && c.status !== "Approved with Conditions",
    ).length;
    return { open, critical, waiting, closedToday, slaAtRisk };
  }, [cases]);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Review Queue</h1>
        <p className="text-sm text-[var(--ink-2)]">
          Operator cases created by Guardian when a decision was ESCALATE, BLOCK, or RESTRICT.
          Guardian decisions are immutable — operators add review outcomes.
        </p>
      </header>

      <p className="-mt-2 text-xs italic text-[var(--ink-2)]">
        Reviewers manage queue health, intervene before SLA breach, and preserve the original
        Guardian verdict.
      </p>

      <QueueHealthStrip />

      {/* Summary tiles */}
      <section className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Tile label="Open cases" value={summary.open} accent="#C9A36B" />
        <Tile label="Critical cases" value={summary.critical} accent="#B83A3A" />
        <Tile label="SLA at risk" value={summary.slaAtRisk} accent="#D97448" />
        <Tile label="Waiting for advertiser" value={summary.waiting} accent="#F59E2E" />
        <Tile label="Closed today" value={summary.closedToday} accent="#6FB089" />
      </section>

      {/* Filters + sort */}
      <section className="glass rounded-xl p-3 flex flex-wrap items-center gap-3 justify-between">
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["all", "All"],
              ["critical", "Critical"],
              ["escalate", "Escalate"],
              ["block", "Block"],
              ["restrict", "Restrict"],
              ["waiting", "Waiting for advertiser"],
            ] as [Filter, string][]
          ).map(([k, label]) => (
            <button
              key={k}
              onClick={() => setFilter(k)}
              className="pill text-xs"
              style={{
                borderColor: filter === k ? "rgba(201, 163, 107, 0.55)" : "rgba(255,255,255,0.12)",
                color: filter === k ? "#F4EFE7" : "var(--ink-2)",
                background: filter === k ? "rgba(201, 163, 107, 0.08)" : "transparent",
              }}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-[var(--ink-2)]">Sort by</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            className="bg-black/40 border border-white/10 rounded-md px-2 py-1"
          >
            <option value="risk">Risk score</option>
            <option value="sla">SLA</option>
            <option value="created">Created time</option>
          </select>
          <button
            onClick={() => {
              if (confirm("Reset all cases and ledger to demo seed?")) reset();
            }}
            className="pill text-xs"
            title="Reset demo data"
          >
            ↺ Reset
          </button>
        </div>
      </section>

      {/* Case list */}
      <section className="glass rounded-xl overflow-hidden">
        <div className="grid grid-cols-[110px_1.4fr_1fr_0.7fr_120px_70px_70px_120px_120px] gap-3 px-4 py-2 text-[10px] uppercase tracking-wider text-[var(--ink-2)] border-b border-white/5 bg-black/30">
          <div>Case</div>
          <div>Advertiser · Campaign</div>
          <div>Market · Vertical</div>
          <div>Decision</div>
          <div>Reason codes</div>
          <div>Risk</div>
          <div>SLA</div>
          <div>Status</div>
          <div>Owner</div>
        </div>
        {rows.length === 0 && (
          <div className="px-4 py-8 text-sm text-[var(--ink-2)] text-center">No cases match.</div>
        )}
        {rows.map((c) => (
          <button
            key={c.caseId}
            onClick={() => setOpenCaseId(c.caseId)}
            className="w-full text-left grid grid-cols-[110px_1.4fr_1fr_0.7fr_120px_70px_70px_120px_120px] gap-3 px-4 py-3 items-center border-b border-white/5 hover:bg-white/[0.03] transition"
          >
            <div className="text-xs font-mono text-[var(--ink-2)]">{c.caseId}</div>
            <div className="min-w-0">
              <div className="text-sm font-medium truncate">{c.advertiserName}</div>
              <div className="text-[11px] text-[var(--ink-2)] truncate">{c.campaignName}</div>
            </div>
            <div className="text-xs text-[var(--ink-2)] truncate">
              {c.market} · {c.vertical}
            </div>
            <div>
              <span
                className="pill text-[10px]"
                style={{
                  borderColor: DECISION_COLORS[c.guardianDecision] + "80",
                  color: DECISION_COLORS[c.guardianDecision],
                }}
              >
                {c.guardianDecision}
              </span>
            </div>
            <div className="flex flex-wrap gap-1">
              {c.reasonCodes.slice(0, 2).map((r) => (
                <span
                  key={r}
                  className="text-[9px] px-1.5 py-0.5 rounded border border-white/10 text-[var(--ink-2)]"
                >
                  {r}
                </span>
              ))}
              {c.reasonCodes.length > 2 && (
                <span className="text-[9px] text-[var(--ink-2)]">+{c.reasonCodes.length - 2}</span>
              )}
            </div>
            <div className="text-xs font-semibold">{c.riskScore}</div>
            <div className="flex flex-wrap gap-1 text-xs">
              <span
                className="pill text-[10px]"
                style={{ borderColor: PRIORITY_COLORS[c.priority] + "70", color: PRIORITY_COLORS[c.priority] }}
              >
                {c.sla}
              </span>
              {(() => {
                const slaState = c.slaState ?? (c.slaDueAt ? computeSlaState(c.slaDueAt) : "on_track");
                const slaColor = SLA_STATE_COLORS[slaState];
                return (
                  <span
                    className="pill text-[10px]"
                    style={{ borderColor: slaColor + "70", color: slaColor }}
                  >
                    {SLA_STATE_LABELS[slaState]}
                  </span>
                );
              })()}
            </div>
            <div>
              <span
                className="pill text-[10px]"
                style={{
                  borderColor: STATUS_COLORS[c.status] + "70",
                  color: STATUS_COLORS[c.status],
                }}
              >
                {c.status}
              </span>
              {c.qualityMarker && c.qualityMarker !== "not_reviewed" && (
                <span
                  className="pill text-[10px] mt-1 block"
                  style={{
                    borderColor: QUALITY_MARKER_COLORS[c.qualityMarker] + "70",
                    color: QUALITY_MARKER_COLORS[c.qualityMarker],
                  }}
                >
                  {QUALITY_MARKER_LABELS[c.qualityMarker]}
                </span>
              )}
            </div>
            <div className="text-xs text-[var(--ink-2)] truncate">{c.owner}</div>
          </button>
        ))}
      </section>

      <CaseDetailDrawer
        caseId={openCaseId}
        onClose={() => {
          setOpenCaseId(null);
          onClearInitial?.();
        }}
      />
    </div>
  );
}

function Tile({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div
      className="glass rounded-xl p-4"
      style={{ borderColor: accent + "30", boxShadow: `0 0 24px -16px ${accent}` }}
    >
      <div className="text-[10px] uppercase tracking-wider text-[var(--ink-2)]">{label}</div>
      <div className="text-2xl font-semibold mt-1" style={{ color: accent }}>
        {value}
      </div>
    </div>
  );
}
