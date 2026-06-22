"use client";

import { useMemo } from "react";
import { computeInsights } from "@/lib/insights";
import { computePolicyPressure } from "@/lib/executiveMetrics";

/**
 * OperationalInsightCards — Phase 3D
 *
 * Three narrative insight cards derived deterministically from scenarios, events,
 * and policy pressure. Coexists alongside the existing InsightCards component.
 */
export default function OperationalInsightCards({
  onOpenPolicy,
  onOpenRuntimeEvents,
}: {
  onOpenPolicy?: (id: string) => void;
  onOpenRuntimeEvents?: () => void;
}) {
  const ins = useMemo(() => computeInsights(), []);
  const pressure = useMemo(() => computePolicyPressure(), []);

  const topBlockPolicy = pressure.topByBlock[0] ?? pressure.topByFiring[0];
  const highestRisk = ins.highestRisk;

  // Shadow-mode pilot scenario is always BrightFast Loans (misleading_finance BLOCK)
  // — the highest-risk, multi-signal BLOCK case in the dataset.
  const shadowScenarioId = "misleading_finance";
  const shadowCaseId = "TG-MISL-Ind"; // deterministic from caseIdFor(misleading_finance)

  return (
    <section className="flex flex-col gap-3">
      <div className="text-xs uppercase tracking-widest text-[var(--ink-2)] px-0.5">
        Phase 3D · Operational Insights
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Card 1: Most risky workflow */}
        <InsightCard
          accent="#B83A3A"
          label="Most Risky Workflow"
          narrative={
            highestRisk
              ? `The ${highestRisk.advertiser} campaign in Financial Services (India) triggered the most critical policy signals in the dataset — misleading guaranteed-approval claims, missing RBI NBFC registration, and a domain registered just 9 days prior. Guardian issued a hard BLOCK with risk score ${highestRisk.risk}/100.`
              : "No high-risk workflows detected in the current dataset."
          }
          linkLabel="Open scenario →"
          linkHref={`?scenario=${shadowScenarioId}`}
        />

        {/* Card 2: Top intervention driver */}
        <InsightCard
          accent="#C7B8DC"
          label="Top Intervention Driver"
          narrative={
            topBlockPolicy
              ? `"${topBlockPolicy.title}" (${topBlockPolicy.policyId}) is the leading driver of Guardian interventions, accounting for all BLOCK decisions in the dataset. Misleading financial claim language — particularly guaranteed-return and urgency triggers — creates the highest enforcement load and should be the first target for creative-side detection improvements.`
              : "Policy pressure data unavailable."
          }
          linkLabel="Open policy →"
          onClick={topBlockPolicy && onOpenPolicy ? () => onOpenPolicy(topBlockPolicy.policyId) : undefined}
          linkHref={topBlockPolicy ? `?view=policy-console&policy=${topBlockPolicy.policyId}` : undefined}
        />

        {/* Card 3: Best candidate for shadow-mode pilot */}
        <InsightCard
          accent="#F59E2E"
          label="Shadow-Mode Pilot Candidate"
          narrative="The BrightFast Loans misleading financial claim scenario is the ideal candidate for a shadow-mode pilot: it combines three independent critical signals (misleading claims, missing certification, weak disclosures), a new advertiser with thin KYC, and a domain-age anomaly. Running this flow in shadow mode would validate Guardian's BLOCK decision against a real event stream before full production enforcement."
          linkLabel="Open BLOCK scenario →"
          linkHref={`?case=${shadowCaseId}`}
          accentNote="Recommended pilot"
        />
      </div>

      <div
        className="rounded-lg border px-3 py-2 text-[10px] text-[var(--ink-2)] italic"
        style={{ borderColor: "rgba(201, 163, 107, 0.2)", background: "rgba(201, 163, 107, 0.04)" }}
      >
        Narratives are derived deterministically from seeded scenario evaluations. In production, these
        would pull from live event streams and real advertiser outcome data.{" "}
        {onOpenRuntimeEvents && (
          <button
            onClick={onOpenRuntimeEvents}
            className="underline text-[var(--ink-1)] ml-1 hover:text-[var(--ink-0)]"
          >
            View live event stream →
          </button>
        )}
      </div>
    </section>
  );
}

function InsightCard({
  accent,
  label,
  narrative,
  linkLabel,
  linkHref,
  onClick,
  accentNote,
}: {
  accent: string;
  label: string;
  narrative: string;
  linkLabel: string;
  linkHref?: string;
  onClick?: () => void;
  accentNote?: string;
}) {
  return (
    <div
      className="glass rounded-xl p-4 flex flex-col gap-2.5"
      style={{ borderColor: `${accent}35`, boxShadow: `0 0 26px -18px ${accent}` }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="text-[10px] uppercase tracking-wider text-[var(--ink-2)]">{label}</div>
        {accentNote && (
          <span
            className="pill text-[9px] shrink-0"
            style={{ borderColor: `${accent}50`, color: accent }}
          >
            {accentNote}
          </span>
        )}
      </div>

      <p className="text-[12px] leading-relaxed text-[var(--ink-1)]">{narrative}</p>

      {onClick ? (
        <button
          onClick={onClick}
          className="self-start text-[11px] font-medium"
          style={{ color: accent }}
        >
          {linkLabel}
        </button>
      ) : linkHref ? (
        <a href={linkHref} className="self-start text-[11px] font-medium" style={{ color: accent }}>
          {linkLabel}
        </a>
      ) : null}
    </div>
  );
}
