"use client";

import { useMemo } from "react";
import { computeInsights } from "@/lib/insights";
import { getScenario } from "@/lib/scenarios";

export default function InsightCards({
  onOpenPolicy,
  onOpenScenario,
  onOpenRuntimeEvents,
}: {
  onOpenPolicy?: (id: string) => void;
  onOpenScenario?: (id: string) => void;
  onOpenRuntimeEvents?: () => void;
}) {
  const ins = useMemo(() => computeInsights(), []);
  return (
    <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
      <Card
        accent="#C7B8DC"
        label="Top policy pressure"
        primary={ins.topPolicy?.title ?? "—"}
        secondary={
          ins.topPolicy
            ? `${ins.topPolicy.policyId} · firing on ${ins.topPolicy.count} scenarios`
            : "No policies firing"
        }
        onClick={ins.topPolicy && onOpenPolicy ? () => onOpenPolicy(ins.topPolicy!.policyId) : undefined}
      />
      <Card
        accent="#D97448"
        label="Highest-risk workflow"
        primary={
          ins.highestRisk
            ? `${ins.highestRisk.advertiser} · risk ${ins.highestRisk.risk}`
            : "—"
        }
        secondary={
          ins.highestRisk
            ? `${getScenario(ins.highestRisk.scenarioId).title} · ${ins.highestRisk.decision}`
            : ""
        }
        onClick={
          ins.highestRisk && onOpenScenario
            ? () => onOpenScenario(ins.highestRisk!.scenarioId)
            : undefined
        }
      />
      <Card
        accent="#C9A36B"
        label="Human review load"
        primary={`${ins.humanReviewLoad.percent}%`}
        secondary={`${ins.humanReviewLoad.needsReview} of ${ins.humanReviewLoad.total} scenarios need human review`}
      />
      <Card
        accent="#F59E2E"
        label="Runtime interception coverage"
        primary={`${ins.interceptionCoverage.percent}%`}
        secondary={`${ins.interceptionCoverage.evaluated} of ${ins.interceptionCoverage.total} agentic events evaluated by Guardian`}
        onClick={onOpenRuntimeEvents}
      />
    </section>
  );
}

function Card({
  label,
  primary,
  secondary,
  accent,
  onClick,
}: {
  label: string;
  primary: string;
  secondary: string;
  accent: string;
  onClick?: () => void;
}) {
  const body = (
    <>
      <div className="text-[10px] uppercase tracking-wider text-[var(--ink-2)]">{label}</div>
      <div className="text-base font-semibold mt-1" style={{ color: accent }}>
        {primary}
      </div>
      <div className="text-xs text-[var(--ink-2)] mt-1">{secondary}</div>
    </>
  );
  const style: React.CSSProperties = {
    borderColor: accent + "40",
    boxShadow: `0 0 26px -18px ${accent}`,
  };
  if (onClick)
    return (
      <button onClick={onClick} className="glass rounded-xl p-4 text-left w-full" style={style}>
        {body}
      </button>
    );
  return (
    <div className="glass rounded-xl p-4" style={style}>
      {body}
    </div>
  );
}
