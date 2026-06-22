"use client";

import { useMemo } from "react";
import { getDisagreementCases, computeExecutiveMetrics } from "@/lib/executiveMetrics";
import { seedCasesFromScenarios } from "@/lib/cases";

const DISCLAIMER =
  "Prototype simulation — calibration metrics are deterministic mocks for demo.";

// Deterministic mock calibration counts (derived from dataset characteristics):
// - 2 potential false positives: scenarios where the Guardian decision was conservative
//   but no critical signals were found (regulated_missing_cert ALLOW_WITH_CONDITIONS
//   with otherwise-clean advertiser, risky_ai_targeting RESTRICT where campaign
//   historically ran clean).
// - 1 potential false negative: clean_launch (ALLOW) advertiser had a 9-day-old domain
//   in the same vertical as a flagged advertiser — not caught because signals differed.
const MOCK_FALSE_POSITIVES = 2;
const MOCK_FALSE_NEGATIVES = 1;

export default function CalibrationPanel() {
  const disagreements = useMemo(() => getDisagreementCases(), []);
  const metrics = useMemo(() => computeExecutiveMetrics(), []);
  const cases = useMemo(() => seedCasesFromScenarios(), []);

  // Cases needing policy calibration = cases with quality marker "policy_calibration_needed"
  const calibrationNeeded = useMemo(
    () => cases.filter((c) => c.qualityMarker === "policy_calibration_needed"),
    [cases],
  );

  // Deep-link builder for case
  function caseLink(caseId: string) {
    return `?case=${caseId}`;
  }

  // Find case IDs for disagreement scenarios
  const disagreementCases = useMemo(() => {
    return disagreements.map((d) => {
      const match = cases.find((c) => c.scenarioId === d.scenarioId);
      return { ...d, caseId: match?.caseId, advertiser: match?.advertiserName };
    });
  }, [disagreements, cases]);

  return (
    <section className="glass p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="text-xs uppercase tracking-widest text-[var(--ink-2)]">
            Phase 3D · Calibration Panel
          </div>
          <div className="text-base font-semibold">Policy &amp; Reviewer Calibration</div>
        </div>
        <span
          className="pill text-[10px] shrink-0"
          style={{ borderColor: "rgba(201, 163, 107, 0.45)", color: "#F4EFE7" }}
        >
          prototype
        </span>
      </div>

      {/* Disclaimer */}
      <div
        className="rounded-lg border px-3 py-2 text-[11px] text-[var(--ink-2)] italic"
        style={{ borderColor: "rgba(201, 163, 107, 0.3)", background: "rgba(201, 163, 107, 0.06)" }}
      >
        ⚠️ {DISCLAIMER}
      </div>

      {/* Metric tiles */}
      <div className="grid grid-cols-2 gap-2.5">
        <CalTile
          label="Potential False Positives"
          value={MOCK_FALSE_POSITIVES}
          color="#D97448"
          detail="Conservative Guardian decisions where re-review found no real violation"
        />
        <CalTile
          label="Potential False Negatives"
          value={MOCK_FALSE_NEGATIVES}
          color="#B83A3A"
          detail="Actions allowed that retrospectively showed risk signals"
        />
        <CalTile
          label="Needs Policy Calibration"
          value={calibrationNeeded.length}
          color="#F59E2E"
          detail="Cases flagged with 'policy_calibration_needed' quality marker"
        />
        <CalTile
          label="Reviewer Disagreements"
          value={disagreementCases.length}
          color="#9B89B8"
          detail={`Reviewer agreement: ${metrics.reviewerAgreementRate}% — ${disagreementCases.length} case(s) reversed after evidence`}
        />
      </div>

      {/* Disagreement case deep-links */}
      {disagreementCases.length > 0 && (
        <div>
          <div className="text-[10px] uppercase tracking-widest text-[var(--ink-2)] mb-2">
            Reviewer Disagreement Cases
          </div>
          <div className="flex flex-col gap-1.5">
            {disagreementCases.slice(0, 3).map((d) => (
              <div
                key={d.scenarioId}
                className="rounded-lg border px-3 py-2 flex items-center justify-between gap-2"
                style={{ borderColor: "rgba(155, 137, 184, 0.3)", background: "rgba(155, 137, 184, 0.06)" }}
              >
                <div>
                  <div className="text-xs font-medium text-[var(--ink-0)]">
                    {d.advertiser ?? d.scenarioId}
                    {d.caseId && (
                      <span className="ml-2 text-[10px] text-[var(--ink-2)]">{d.caseId}</span>
                    )}
                  </div>
                  <div className="text-[10px] text-[var(--ink-2)]">
                    Guardian: <span className="text-[var(--ink-1)]">{d.guardianDecision}</span> ·
                    Reviewer: <span className="text-[var(--ink-1)]">{d.reviewerOutcome}</span>
                  </div>
                </div>
                {d.caseId && (
                  <a
                    href={caseLink(d.caseId)}
                    className="pill text-[10px] shrink-0"
                    style={{ borderColor: "rgba(155, 137, 184, 0.5)", color: "#C7B8DC" }}
                  >
                    Open case →
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Calibration-needed case deep-links */}
      {calibrationNeeded.length > 0 && (
        <div>
          <div className="text-[10px] uppercase tracking-widest text-[var(--ink-2)] mb-2">
            Policy Calibration Flagged
          </div>
          <div className="flex flex-col gap-1.5">
            {calibrationNeeded.map((c) => (
              <div
                key={c.caseId}
                className="rounded-lg border px-3 py-2 flex items-center justify-between gap-2"
                style={{ borderColor: "rgba(245, 158, 46, 0.3)", background: "rgba(245, 158, 46, 0.06)" }}
              >
                <div>
                  <div className="text-xs font-medium text-[var(--ink-0)]">
                    {c.advertiserName}
                    <span className="ml-2 text-[10px] text-[var(--ink-2)]">{c.caseId}</span>
                  </div>
                  <div className="text-[10px] text-[var(--ink-2)]">
                    Decision: <span className="text-[var(--ink-1)]">{c.guardianDecision}</span> ·
                    Quality: <span className="text-[var(--ink-1)]">Policy calibration needed</span>
                  </div>
                </div>
                <a
                  href={`?case=${c.caseId}`}
                  className="pill text-[10px] shrink-0"
                  style={{ borderColor: "rgba(245, 158, 46, 0.5)", color: "#F59E2E" }}
                >
                  Open case →
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function CalTile({
  label,
  value,
  color,
  detail,
}: {
  label: string;
  value: number;
  color: string;
  detail: string;
}) {
  return (
    <div
      className="rounded-xl border p-3"
      style={{ borderColor: `${color}35`, background: `${color}09` }}
      title={detail}
    >
      <div className="text-[10px] uppercase tracking-widest text-[var(--ink-2)] leading-tight">
        {label}
      </div>
      <div className="text-xl font-bold mt-0.5" style={{ color }}>
        {value}
      </div>
      <div className="text-[10px] text-[var(--ink-1)] mt-0.5 leading-tight">{detail}</div>
    </div>
  );
}
