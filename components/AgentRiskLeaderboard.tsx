"use client";

import { useMemo, useState } from "react";
import { computeAgentLeaderboard, type LeaderboardSortKey } from "@/lib/executiveMetrics";

const SORT_OPTIONS: { key: LeaderboardSortKey; label: string }[] = [
  { key: "interventions", label: "Interventions" },
  { key: "blocked", label: "Blocked" },
  { key: "escalationRate", label: "Escalation %" },
  { key: "avgRisk", label: "Avg Risk" },
];

const TRUST_TIER_COLORS: Record<string, string> = {
  Low: "#D97448",
  Medium: "#F59E2E",
  High: "#6FB089",
  System: "#C7B8DC",
};

export default function AgentRiskLeaderboard() {
  const [sort, setSort] = useState<LeaderboardSortKey>("interventions");
  const rows = useMemo(() => computeAgentLeaderboard(sort), [sort]);

  function metricValue(row: ReturnType<typeof computeAgentLeaderboard>[0]): string {
    if (sort === "interventions") return String(row.interventions);
    if (sort === "blocked") return String(row.blockedActions);
    if (sort === "escalationRate") return `${row.escalationRate}%`;
    if (sort === "avgRisk") return `${row.avgRiskScore}/100`;
    return "—";
  }

  function metricColor(row: ReturnType<typeof computeAgentLeaderboard>[0]): string {
    if (sort === "interventions") return row.interventions > 0 ? "#D97448" : "#6FB089";
    if (sort === "blocked") return row.blockedActions > 0 ? "#B83A3A" : "#6FB089";
    if (sort === "escalationRate") return row.escalationRate > 50 ? "#B83A3A" : row.escalationRate > 0 ? "#D97448" : "#6FB089";
    if (sort === "avgRisk") return row.avgRiskScore >= 65 ? "#B83A3A" : row.avgRiskScore >= 40 ? "#D97448" : "#6FB089";
    return "#8FA1B3";
  }

  return (
    <section className="glass p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <div className="text-xs uppercase tracking-widest text-[var(--ink-2)]">
            Phase 3D · Agent Risk Leaderboard
          </div>
          <div className="text-base font-semibold">Source Agents by Risk Profile</div>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {SORT_OPTIONS.map((o) => (
            <button
              key={o.key}
              onClick={() => setSort(o.key)}
              className="pill text-[10px]"
              style={
                sort === o.key
                  ? { borderColor: "#C9A36B", color: "#C9A36B", background: "rgba(201,163,107,0.12)" }
                  : { borderColor: "var(--border)", color: "var(--ink-2)" }
              }
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {/* Header row */}
      <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-4 items-center px-1 mb-0.5">
        <div className="text-[9px] uppercase tracking-widest text-[var(--ink-2)]">Agent</div>
        <div className="text-[9px] uppercase tracking-widest text-[var(--ink-2)] text-right">Trust</div>
        <div className="text-[9px] uppercase tracking-widest text-[var(--ink-2)] text-right">Events</div>
        <div className="text-[9px] uppercase tracking-widest text-[var(--ink-2)] text-right">
          {SORT_OPTIONS.find((o) => o.key === sort)?.label ?? "Value"}
        </div>
      </div>

      {/* Data rows */}
      <div className="flex flex-col gap-1.5">
        {rows.map((row) => (
          <a
            key={row.agentId}
            href={`?view=agent-governance&agent=${row.agentId}`}
            className="grid grid-cols-[1fr_auto_auto_auto] gap-x-4 items-center rounded-lg border px-3 py-2.5 transition-colors"
            style={{ borderColor: "var(--border)", background: "rgba(255,255,255,0.02)" }}
          >
            {/* Agent name + type */}
            <div className="min-w-0">
              <div className="text-xs font-medium text-[var(--ink-0)] truncate">{row.name}</div>
              <div className="text-[10px] text-[var(--ink-2)]">{row.type}</div>
            </div>

            {/* Trust tier pill */}
            <span
              className="pill text-[9px] shrink-0"
              style={{
                borderColor: `${TRUST_TIER_COLORS[row.trustTier] ?? "#8FA1B3"}50`,
                color: TRUST_TIER_COLORS[row.trustTier] ?? "#8FA1B3",
                background: `${TRUST_TIER_COLORS[row.trustTier] ?? "#8FA1B3"}12`,
              }}
            >
              {row.trustTier}
            </span>

            {/* Total events */}
            <div className="text-xs text-right text-[var(--ink-2)]">{row.totalEvents}</div>

            {/* Primary metric */}
            <div
              className="text-sm font-bold text-right"
              style={{ color: metricColor(row) }}
            >
              {metricValue(row)}
            </div>
          </a>
        ))}
        {rows.length === 0 && (
          <div className="text-xs text-[var(--ink-2)] italic">No agent event data available.</div>
        )}
      </div>

      <div className="text-[10px] text-[var(--ink-2)] italic">
        Click any row to open the Agent Detail drawer in Agent Governance.
      </div>
    </section>
  );
}
