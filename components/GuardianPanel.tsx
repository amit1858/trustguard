"use client";

import type { GuardianOutput, Scenario } from "@/lib/types";

const decisionMeta: Record<string, { color: string; label: string }> = {
  ALLOW: { color: "#6FB089", label: "Allow" },
  ALLOW_WITH_CONDITIONS: { color: "#F59E2E", label: "Allow with conditions" },
  RESTRICT: { color: "#9B89B8", label: "Restrict" },
  ESCALATE: { color: "#D97448", label: "Escalate to human" },
  BLOCK: { color: "#B83A3A", label: "Block" },
};

const riskMeta: Record<string, string> = {
  low: "#6FB089",
  moderate: "#C9A36B",
  elevated: "#F59E2E",
  high: "#D97448",
  critical: "#B83A3A",
};

function exportPayload(scenario: Scenario, guardian: GuardianOutput) {
  return {
    scenarioId: scenario.id,
    advertiser: scenario.advertiser,
    vertical: scenario.vertical,
    market: scenario.market,
    requestedAction: scenario.requestedAction,
    decision: guardian.decision,
    riskScore: guardian.riskScore,
    riskLevel: guardian.riskLevel,
    confidence: guardian.confidence,
    reasonCodes: guardian.reasonCodes,
    humanReviewRequired: guardian.humanReviewRequired,
    allowedActions: guardian.allowedActions,
    blockedActions: guardian.blockedActions,
    matchedPolicies: guardian.matchedPolicies,
    explanation: guardian.explanation,
    auditTrail: guardian.auditTrail,
    exportedAt: new Date().toISOString(),
  };
}

function handleExport(scenario: Scenario, guardian: GuardianOutput) {
  const json = JSON.stringify(exportPayload(scenario, guardian), null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `trustguard-${scenario.id}-${guardian.decision.toLowerCase()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function GuardianPanel({
  scenario,
  guardian,
  aiAssisted,
}: {
  scenario: Scenario;
  guardian: GuardianOutput;
  aiAssisted: boolean;
}) {
  const d = decisionMeta[guardian.decision];
  const riskColor = riskMeta[guardian.riskLevel];
  return (
    <section
      className="glass-strong p-6 relative overflow-hidden"
      style={{
        border: "1.5px solid rgba(245, 158, 46, 0.40)",
        boxShadow:
          "0 0 0 1px rgba(245, 158, 46, 0.20), 0 0 36px rgba(245, 158, 46, 0.18), 0 0 80px rgba(245, 158, 46, 0.06) inset",
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          background: `radial-gradient(600px 200px at 50% -10%, ${d.color}40, transparent 60%)`,
        }}
      />
      <div className="relative">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="text-xs uppercase tracking-widest" style={{ color: "#F59E2E" }}>
              🛡 Guardian Agent · Trust &amp; Safety Control Layer
            </div>
            <div className="text-[10px] uppercase tracking-widest text-[var(--ink-2)] mt-0.5">
              Overlay · supervises orchestrator &amp; workers
            </div>
            <div className="text-base font-semibold mt-2">
              {scenario.advertiser} <span className="text-[var(--ink-2)]">·</span>{" "}
              <span className="text-[var(--ink-1)] font-normal">
                {scenario.vertical} / {scenario.market}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {guardian.humanReviewRequired && (
              <span className="pill" style={{ borderColor: "rgba(155, 137, 184, 0.55)", color: "#C7B8DC" }}>
                ⚑ Human review required
              </span>
            )}
            <span className="pill" style={{ borderColor: aiAssisted ? "rgba(245, 158, 46, 0.55)" : "rgba(255,255,255,0.15)", color: aiAssisted ? "#F59E2E" : "var(--ink-2)" }}>
              {aiAssisted ? "BYOK explanation" : "Deterministic explanation"}
            </span>
            <button
              onClick={() => handleExport(scenario, guardian)}
              className="pill"
              style={{ borderColor: "rgba(245, 158, 46, 0.45)", color: "#F4EFE7", cursor: "pointer" }}
              title="Download Guardian decision as JSON (audit payload)"
            >
              ⬇ Export JSON
            </button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div
            className="md:col-span-2 p-5 rounded-xl border"
            style={{
              borderColor: `${d.color}80`,
              background: `linear-gradient(135deg, ${d.color}22, transparent)`,
              boxShadow: `0 0 24px ${d.color}33`,
            }}
          >
            <div className="text-xs uppercase tracking-widest" style={{ color: d.color }}>
              Decision
            </div>
            <div className="text-3xl font-bold mt-1" style={{ color: d.color }}>
              {d.label}
            </div>
            <div className="text-xs text-[var(--ink-1)] mt-2">
              Final decision is produced by the deterministic policy kernel.
            </div>
          </div>

          <Metric label="Risk Score" value={`${guardian.riskScore}`} sub="/ 100" color={riskColor} />
          <Metric
            label="Risk Level"
            value={guardian.riskLevel.toUpperCase()}
            sub={`Confidence ${(guardian.confidence * 100).toFixed(0)}%`}
            color={riskColor}
          />
        </div>

        <div className="mt-5">
          <div className="text-xs uppercase tracking-widest text-[var(--ink-2)] mb-1">
            Explanation
          </div>
          <p className="text-sm text-[var(--ink-0)]/90 leading-relaxed">
            {guardian.explanation}
          </p>
        </div>

        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-xs uppercase tracking-widest text-[var(--ink-2)] mb-2">
              Reason codes
            </div>
            <div className="flex flex-wrap gap-1.5">
              {guardian.reasonCodes.map((r) => (
                <span key={r} className="pill" style={{ borderColor: `${d.color}55`, color: d.color }}>
                  {r}
                </span>
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-widest text-[var(--ink-2)] mb-2">
              Matched policies
            </div>
            <ul className="space-y-1.5">
              {guardian.matchedPolicies.length === 0 && (
                <li className="text-xs text-[var(--ink-2)]">— No policies triggered —</li>
              )}
              {guardian.matchedPolicies.map((p) => (
                <li key={p.policyId} className="text-xs flex gap-2">
                  <span className="text-[var(--ink-2)] w-24 shrink-0">{p.policyId}</span>
                  <span className="text-[var(--ink-1)]">{p.title}</span>
                  <span
                    className="ml-auto text-[10px] uppercase"
                    style={{ color: severityColor(p.severity) }}
                  >
                    {p.severity}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

function Metric({ label, value, sub, color }: { label: string; value: string; sub?: string; color: string }) {
  return (
    <div className="p-4 rounded-xl border" style={{ borderColor: `${color}55`, background: `${color}0c` }}>
      <div className="text-xs uppercase tracking-widest text-[var(--ink-2)]">{label}</div>
      <div className="text-2xl font-bold mt-1" style={{ color }}>{value}</div>
      {sub && <div className="text-[11px] text-[var(--ink-1)] mt-1">{sub}</div>}
    </div>
  );
}

function severityColor(sev: string) {
  return ({ info: "#8FA1B3", low: "#6FB089", medium: "#F59E2E", high: "#D97448", critical: "#B83A3A" } as Record<string, string>)[sev] || "#8FA1B3";
}
