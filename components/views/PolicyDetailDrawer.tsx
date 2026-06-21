"use client";

import { useEffect, useMemo } from "react";
import { getPolicy } from "@/lib/policies";
import { SCENARIOS } from "@/lib/scenarios";
import { runOrchestrator } from "@/lib/orchestratorEngine";
import { evaluateGuardian } from "@/lib/guardianEngine";
import { useCaseStore } from "@/lib/caseStore";
import CopyLinkButton from "@/components/CopyLinkButton";

const SEVERITY_COLORS: Record<string, string> = {
  info: "#94a3b8",
  low: "#6FB089",
  medium: "#F59E2E",
  high: "#D97448",
  critical: "#B83A3A",
};

const ENFORCEMENT_COLORS: Record<string, string> = {
  Monitor: "#94a3b8",
  Warn: "#F59E2E",
  Escalate: "#D97448",
  Restrict: "#9B89B8",
  Block: "#B83A3A",
};

const STATUS_COLORS: Record<string, string> = {
  Active: "#6FB089",
  Draft: "#F59E2E",
  Retired: "#94a3b8",
};

export default function PolicyDetailDrawer({
  policyId,
  onClose,
}: {
  policyId: string | null;
  onClose: () => void;
}) {
  const { cases } = useCaseStore();
  const policy = useMemo(() => (policyId ? getPolicy(policyId) : undefined), [policyId]);

  // Matched scenarios + sample explanations
  const matched = useMemo(() => {
    if (!policy) return [];
    return SCENARIOS.filter((s) => {
      const g = evaluateGuardian(s, runOrchestrator(s));
      return g.matchedPolicies.some((p) => p.policyId === policy.id);
    }).map((s) => {
      const g = evaluateGuardian(s, runOrchestrator(s));
      return { scenario: s, guardian: g };
    });
  }, [policy]);

  const matchedCases = useMemo(() => {
    if (!policy) return [];
    return cases.filter((c) => c.matchedPolicies.some((p) => p.policyId === policy.id));
  }, [policy, cases]);

  useEffect(() => {
    if (!policyId) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [policyId, onClose]);

  if (!policyId || !policy) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <aside
        className="h-full w-full max-w-[900px] overflow-y-auto border-l border-white/10"
        style={{ background: "linear-gradient(180deg, rgba(8,10,24,0.98), rgba(5,7,18,0.98))" }}
      >
        <div
          className="sticky top-0 z-10 px-6 py-4 border-b border-white/5 backdrop-blur"
          style={{ background: "rgba(8,10,24,0.85)" }}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--ink-2)]">
                <span className="pill font-mono">{policy.id}</span>
                <span className="pill">{policy.category}</span>
                <span
                  className="pill"
                  style={{
                    borderColor: SEVERITY_COLORS[policy.severity] + "80",
                    color: SEVERITY_COLORS[policy.severity],
                  }}
                >
                  {policy.severity}
                </span>
                <span
                  className="pill"
                  style={{
                    borderColor: ENFORCEMENT_COLORS[policy.enforcement] + "80",
                    color: ENFORCEMENT_COLORS[policy.enforcement],
                  }}
                >
                  {policy.enforcement}
                </span>
                <span
                  className="pill"
                  style={{
                    borderColor: STATUS_COLORS[policy.status] + "80",
                    color: STATUS_COLORS[policy.status],
                  }}
                >
                  {policy.status} · {policy.version}
                </span>
              </div>
              <h2 className="mt-2 text-xl font-semibold">{policy.title}</h2>
              <p className="text-xs text-[var(--ink-2)] mt-1">
                Owner: {policy.owner} · Last updated {policy.lastUpdated}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <CopyLinkButton state={{ view: "policy-console", policy: policy.id }} label="Copy link" />
              <button onClick={onClose} className="pill" title="Close (Esc)">
                ✕
              </button>
            </div>
          </div>

          <div className="mt-3 flex gap-2 flex-wrap">
            <button className="pill text-xs" style={{ borderColor: "rgba(255,255,255,0.15)" }} title="Simulated">
              ✎ Propose edit (simulated)
            </button>
            <button className="pill text-xs" style={{ borderColor: "rgba(255,255,255,0.15)" }} title="Simulated">
              📤 Promote draft (simulated)
            </button>
            <button className="pill text-xs" style={{ borderColor: "rgba(255,255,255,0.15)" }} title="Simulated">
              ⏸ Retire (simulated)
            </button>
          </div>
        </div>

        <div className="px-6 py-6 flex flex-col gap-5">
          <div
            className="glass rounded-xl p-3 text-xs flex items-start gap-2"
            style={{ borderColor: "rgba(167,139,250,0.4)" }}
          >
            <span style={{ color: "#C7B8DC" }}>⚑</span>
            <span className="text-[var(--ink-2)]">
              Policy changes are simulated in this prototype. Guardian decisions continue to be
              generated by the deterministic policy kernel.
            </span>
          </div>

          <Section label="Summary">
            <p className="text-sm">{policy.description}</p>
            <p className="text-xs text-[var(--ink-2)] mt-2">
              <span className="font-semibold text-[var(--ink-1)]">Rationale:</span>{" "}
              {policy.rationale}
            </p>
          </Section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Section label="Reason codes produced">
              <div className="flex flex-wrap gap-1">
                {policy.reasonCodes.map((r) => (
                  <span
                    key={r}
                    className="text-[10px] font-mono px-2 py-0.5 rounded border border-white/10 text-[var(--ink-2)]"
                  >
                    {r}
                  </span>
                ))}
              </div>
            </Section>
            <Section label="Signal conditions (triggers)">
              <div className="flex flex-wrap gap-1">
                {policy.triggers.map((t) => (
                  <span
                    key={t}
                    className="text-[10px] font-mono px-2 py-0.5 rounded border border-white/10 text-[var(--ink-2)]"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </Section>
            <Section label="Markets impacted">
              <div className="flex flex-wrap gap-1">
                {policy.markets.map((m) => (
                  <span key={m} className="pill text-[10px]">{m}</span>
                ))}
              </div>
            </Section>
            <Section label="Verticals impacted">
              <div className="flex flex-wrap gap-1">
                {policy.verticals.map((v) => (
                  <span key={v} className="pill text-[10px]">{v}</span>
                ))}
              </div>
            </Section>
          </div>

          <Section label={`Matched scenarios (${matched.length})`}>
            {matched.length === 0 ? (
              <div className="text-xs text-[var(--ink-2)]">No scenarios match this policy.</div>
            ) : (
              <div className="flex flex-col gap-2">
                {matched.map(({ scenario, guardian }) => (
                  <div key={scenario.id} className="glass rounded-md p-3 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold">{scenario.advertiser}</span>
                      <span className="text-[var(--ink-2)]">
                        {scenario.vertical} · {scenario.market}
                      </span>
                      <span className="pill text-[10px]">{guardian.decision}</span>
                    </div>
                    <div className="mt-1 text-[var(--ink-2)]">{guardian.explanation}</div>
                  </div>
                ))}
              </div>
            )}
          </Section>

          <Section label={`Matched cases (${matchedCases.length})`}>
            {matchedCases.length === 0 ? (
              <div className="text-xs text-[var(--ink-2)]">No operator cases yet.</div>
            ) : (
              <ul className="flex flex-col gap-1 text-xs">
                {matchedCases.map((c) => (
                  <li key={c.caseId} className="glass rounded-md p-2 flex justify-between gap-2">
                    <span className="font-mono text-[var(--ink-2)]">{c.caseId}</span>
                    <span>{c.advertiserName}</span>
                    <span className="text-[var(--ink-2)]">{c.status}</span>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section label="Change history (version history)">
            <ol className="flex flex-col gap-2 text-xs">
              {policy.changeHistory.map((h) => (
                <li key={h.version} className="flex items-start gap-3">
                  <span className="font-mono text-[var(--ink-2)] w-16 shrink-0">{h.version}</span>
                  <span className="text-[var(--ink-2)] w-24 shrink-0">{h.date}</span>
                  <span>{h.note}</span>
                </li>
              ))}
            </ol>
          </Section>

          <Section label="Simulated policy impact">
            <p className="text-xs text-[var(--ink-2)]">
              If this policy were retired today, the {matched.length} scenario(s) above would no
              longer match its rule. Re-run the Simulation Lab to see how the deterministic kernel
              would reclassify each case.
            </p>
          </Section>
        </div>
      </aside>
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="glass rounded-xl p-4">
      <div className="text-[10px] uppercase tracking-wider text-[var(--ink-2)] mb-2">{label}</div>
      {children}
    </section>
  );
}
