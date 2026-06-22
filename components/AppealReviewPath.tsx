"use client";

import { DECISION_COLORS } from "@/lib/cases";
import { computeAppealPath } from "@/lib/appealPath";
import type { GuardianDecision } from "@/lib/types";
import type { ReviewOutcome } from "@/lib/cases";

function Tile({
  label,
  value,
  sublabel,
  accent,
  dim,
}: {
  label: string;
  value: string;
  sublabel?: string;
  accent: string;
  dim?: boolean;
}) {
  return (
    <div
      className="glass rounded-xl p-3"
      style={{
        borderColor: dim ? "rgba(255,255,255,0.08)" : accent + "60",
        boxShadow: dim ? "none" : `0 0 24px -16px ${accent}`,
        opacity: dim ? 0.65 : 1,
      }}
    >
      <div className="text-[10px] uppercase tracking-wider text-[var(--ink-2)]">{label}</div>
      <div
        className="text-xs font-semibold mt-1 leading-snug"
        style={{ color: dim ? "var(--ink-1)" : accent }}
      >
        {value}
      </div>
      {sublabel && (
        <div className="text-[10px] text-[var(--ink-2)] mt-1">{sublabel}</div>
      )}
    </div>
  );
}

export default function AppealReviewPath({
  guardianDecision,
  vertical,
  caseOutcomes,
}: {
  guardianDecision: GuardianDecision;
  vertical: string;
  caseOutcomes: ReviewOutcome[];
}) {
  const path = computeAppealPath(guardianDecision, vertical, caseOutcomes);
  const hasOutcome = caseOutcomes.length > 0;

  return (
    <section className="glass rounded-xl p-5">
      <div className="flex items-center justify-between mb-1">
        <div className="text-sm font-semibold">Appeal &amp; Review Path</div>
        <span className="text-[10px] uppercase tracking-wider text-[var(--ink-2)]">
          Deterministic · read-only
        </span>
      </div>

      {/* Immutability reminder */}
      <div
        className="mb-4 mt-2 rounded-lg p-2 text-[11px] flex items-start gap-2"
        style={{ background: "rgba(167,139,250,0.06)", borderLeft: "2px solid rgba(167,139,250,0.4)" }}
      >
        <span style={{ color: "#C7B8DC" }}>⚑</span>
        <span className="text-[var(--ink-2)]">{path.immutableNote}</span>
      </div>

      {/* Decision stack */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <Tile
          label="Original Guardian decision"
          sublabel="Immutable · recorded at case creation"
          value={path.originalDecision}
          accent={DECISION_COLORS[path.originalDecision]}
        />
        <Tile
          label="Human review outcome"
          sublabel={hasOutcome ? `by ${caseOutcomes[0].reviewer}` : "pending"}
          value={path.humanReviewOutcome}
          accent="#C7B8DC"
          dim={!hasOutcome}
        />
        <Tile
          label="Final enforcement action"
          sublabel={hasOutcome ? new Date(caseOutcomes[0].timestamp).toLocaleString() : "derived from Guardian decision"}
          value={path.finalEnforcementAction}
          accent="#C9A36B"
          dim={!hasOutcome}
        />
      </div>

      {/* Appeal eligibility + next action */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div
          className="rounded-lg p-3 border"
          style={{ borderColor: "rgba(217,116,72,0.3)", background: "rgba(217,116,72,0.05)" }}
        >
          <div className="text-[10px] uppercase tracking-wider text-[var(--ink-2)] mb-1">
            Appeal eligibility
          </div>
          <div className="text-xs text-[var(--ink-1)] leading-relaxed">
            {path.appealEligibility}
          </div>
        </div>
        <div
          className="rounded-lg p-3 border"
          style={{ borderColor: "rgba(201,163,107,0.3)", background: "rgba(201,163,107,0.05)" }}
        >
          <div className="text-[10px] uppercase tracking-wider text-[var(--ink-2)] mb-1">
            Next possible action
          </div>
          <div className="text-xs text-[var(--ink-1)] leading-relaxed">
            {path.nextPossibleAction}
          </div>
        </div>
      </div>
    </section>
  );
}
