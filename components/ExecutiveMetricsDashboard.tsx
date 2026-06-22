"use client";

import { useMemo } from "react";
import { computeExecutiveMetrics } from "@/lib/executiveMetrics";

// Tile color mapping
const TILE_COLORS = {
  evaluated: "#8FA1B3",
  allowed: "#6FB089",
  awc: "#F59E2E",
  restricted: "#9B89B8",
  escalated: "#D97448",
  blocked: "#B83A3A",
  humanReview: "#C9A36B",
  avgRisk: "#C9A36B",
  topPolicy: "#C7B8DC",
  vertical: "#D97448",
  market: "#8FA1B3",
  coverage: "#6FB089",
  prevented: "#B83A3A",
  agreement: "#6FB089",
};

export default function ExecutiveMetricsDashboard() {
  const m = useMemo(() => computeExecutiveMetrics(), []);

  return (
    <section className="glass p-5">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div>
          <div className="text-xs uppercase tracking-widest text-[var(--ink-2)]">
            Phase 3D · Executive Metrics
          </div>
          <div className="text-base font-semibold">Leadership &amp; Operational Snapshot</div>
        </div>
        <span
          className="pill text-[10px]"
          style={{ borderColor: "rgba(201, 163, 107, 0.45)", color: "#F4EFE7" }}
        >
          deterministic · seed data
        </span>
      </div>

      {/* Row 1: Action counts (4 cols on md+) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-2.5">
        <Tile
          label="Actions Evaluated"
          value={m.actionsEvaluated}
          sub="total agentic evaluations"
          color={TILE_COLORS.evaluated}
        />
        <Tile
          label="Actions Allowed"
          value={m.actionsAllowed + m.actionsAllowedWithConditions}
          sub={`${m.actionsAllowed} clean · ${m.actionsAllowedWithConditions} conditional`}
          color={TILE_COLORS.allowed}
        />
        <Tile
          label="Actions Restricted"
          value={m.actionsRestricted}
          sub="guardrails applied"
          color={TILE_COLORS.restricted}
        />
        <Tile
          label="Actions Escalated"
          value={m.actionsEscalated}
          sub="routed to human specialist"
          color={TILE_COLORS.escalated}
        />
      </div>

      {/* Row 2: Risk / quality / coverage */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-2.5">
        <Tile
          label="Actions Blocked"
          value={m.actionsBlocked}
          sub="hard Guardian blocks"
          color={TILE_COLORS.blocked}
        />
        <Tile
          label="Human Review Rate"
          value={`${m.humanReviewRate}%`}
          sub="of evaluated actions"
          color={TILE_COLORS.humanReview}
        />
        <Tile
          label="Avg Risk Score"
          value={`${m.avgRiskScore}/100`}
          sub="across all scenarios"
          color={TILE_COLORS.avgRisk}
        />
        <Tile
          label="Actions Prevented"
          value={m.estimatedRiskyActionsPrevented}
          sub="est. risky actions stopped"
          color={TILE_COLORS.prevented}
        />
      </div>

      {/* Row 3: Policy + Vertical + Market + Coverage */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-2.5">
        <Tile
          label="Top Policy Triggered"
          value={m.topPolicyTriggered?.title ?? "—"}
          sub={
            m.topPolicyTriggered
              ? `${m.topPolicyTriggered.policyId} · ${m.topPolicyTriggered.hitCount} hits`
              : "No policy data"
          }
          color={TILE_COLORS.topPolicy}
          compact
        />
        <Tile
          label="Highest Risk Vertical"
          value={m.highestRiskVertical?.name ?? "—"}
          sub={m.highestRiskVertical ? `avg risk ${m.highestRiskVertical.avgRisk}/100` : ""}
          color={TILE_COLORS.vertical}
          compact
        />
        <Tile
          label="Highest Risk Market"
          value={m.highestRiskMarket?.name ?? "—"}
          sub={m.highestRiskMarket ? `avg risk ${m.highestRiskMarket.avgRisk}/100` : ""}
          color={TILE_COLORS.market}
          compact
        />
        <Tile
          label="Runtime Coverage"
          value={`${m.runtimeInterceptionCoverage}%`}
          sub="events evaluated by Guardian"
          color={TILE_COLORS.coverage}
        />
      </div>

      {/* Row 4: Reviewer Agreement Rate — full width accent strip */}
      <div
        className="rounded-xl border px-4 py-3 flex items-center justify-between gap-4 flex-wrap"
        style={{
          borderColor: `${TILE_COLORS.agreement}35`,
          background: `${TILE_COLORS.agreement}09`,
        }}
      >
        <div>
          <div className="text-[10px] uppercase tracking-widest text-[var(--ink-2)]">
            Reviewer Agreement Rate
          </div>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-2xl font-bold" style={{ color: TILE_COLORS.agreement }}>
              {m.reviewerAgreementRate}%
            </span>
            <span className="text-xs text-[var(--ink-2)]">of reviewed cases</span>
          </div>
        </div>
        <div
          className="text-[11px] text-[var(--ink-2)] max-w-sm"
          title="Percentage of cases where the human reviewer's outcome aligned with or upheld the Guardian decision. Disagreements (Reversed after Evidence) count against this rate."
        >
          <span className="font-medium text-[var(--ink-1)]">Definition: </span>
          cases where reviewer outcome upheld or confirmed the Guardian decision ÷ total reviewed
          cases. &quot;Reversed after Evidence&quot; counts as disagreement.{" "}
          <span className="opacity-60 italic">Hover for full definition.</span>
        </div>
        {/* Mini progress bar */}
        <div className="flex-1 min-w-[120px] max-w-[200px]">
          <div
            className="h-2 w-full rounded-full overflow-hidden border"
            style={{ borderColor: "var(--border)" }}
          >
            <div
              className="h-full rounded-full"
              style={{
                width: `${m.reviewerAgreementRate}%`,
                background: TILE_COLORS.agreement,
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function Tile({
  label,
  value,
  sub,
  color,
  compact = false,
}: {
  label: string;
  value: string | number;
  sub: string;
  color: string;
  compact?: boolean;
}) {
  return (
    <div
      className="p-3 rounded-xl border"
      style={{ borderColor: `${color}35`, background: `${color}09` }}
    >
      <div className="text-[10px] uppercase tracking-widest text-[var(--ink-2)] leading-tight">
        {label}
      </div>
      <div
        className={`font-bold mt-0.5 ${compact ? "text-sm leading-tight" : "text-xl"}`}
        style={{ color }}
      >
        {value}
      </div>
      <div className="text-[10px] text-[var(--ink-1)] mt-0.5 leading-tight">{sub}</div>
    </div>
  );
}
