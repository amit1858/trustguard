"use client";

import { useEffect, useMemo, useState } from "react";
import { POLICY_RULES } from "@/lib/policies";
import { SCENARIOS } from "@/lib/scenarios";
import { runOrchestrator } from "@/lib/orchestratorEngine";
import { evaluateGuardian } from "@/lib/guardianEngine";
import { useCaseStore } from "@/lib/caseStore";
import PolicyDetailDrawer from "./PolicyDetailDrawer";

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

export default function PolicyConsoleView() {
  const { cases } = useCaseStore();
  const [severity, setSeverity] = useState<string>("all");
  const [enforcement, setEnforcement] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [q, setQ] = useState("");
  const [openPolicyId, setOpenPolicyId] = useState<string | null>(null);

  // Deep link: open a policy detail drawer if ?policy=... is in the URL.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const u = new URLSearchParams(window.location.search);
    const pid = u.get("policy");
    if (pid && POLICY_RULES.some((p) => p.id === pid)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot deep-link hydration on mount
      setOpenPolicyId(pid);
    }
  }, []);


  // Pre-compute scenario+case hit counts
  const hitCounts = useMemo(() => {
    const scenarioHits: Record<string, number> = {};
    POLICY_RULES.forEach((p) => (scenarioHits[p.id] = 0));
    SCENARIOS.forEach((s) => {
      const g = evaluateGuardian(s, runOrchestrator(s));
      g.matchedPolicies.forEach((p) => {
        scenarioHits[p.policyId] = (scenarioHits[p.policyId] ?? 0) + 1;
      });
    });
    const caseHits: Record<string, number> = {};
    POLICY_RULES.forEach((p) => (caseHits[p.id] = 0));
    cases.forEach((c) =>
      c.matchedPolicies.forEach(
        (p) => (caseHits[p.policyId] = (caseHits[p.policyId] ?? 0) + 1),
      ),
    );
    return { scenarioHits, caseHits };
  }, [cases]);

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return POLICY_RULES.filter((p) => {
      if (severity !== "all" && p.severity !== severity) return false;
      if (enforcement !== "all" && p.enforcement !== enforcement) return false;
      if (status !== "all" && p.status !== status) return false;
      if (needle) {
        const hay = [p.id, p.title, p.category, ...p.reasonCodes, ...p.triggers]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
  }, [severity, enforcement, status, q]);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Policy Console</h1>
        <p className="text-sm text-[var(--ink-2)]">
          Governance surface for every rule that drives Guardian decisions. Rules are matched by
          the deterministic kernel — BYOK AI never overrides them.
        </p>
      </header>

      {/* Filter bar */}
      <section className="glass rounded-xl p-3 flex flex-wrap gap-3 items-center">
        <FilterSelect label="Severity" value={severity} setValue={setSeverity} options={["all", "info", "low", "medium", "high", "critical"]} />
        <FilterSelect label="Enforcement" value={enforcement} setValue={setEnforcement} options={["all", "Monitor", "Warn", "Escalate", "Restrict", "Block"]} />
        <FilterSelect label="Status" value={status} setValue={setStatus} options={["all", "Active", "Draft", "Retired"]} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search policy name, code, or trigger…"
          className="flex-1 min-w-[220px] bg-black/40 border border-white/10 rounded-md px-3 py-1.5 text-sm"
        />
        {(severity !== "all" || enforcement !== "all" || status !== "all" || q) && (
          <button
            onClick={() => {
              setSeverity("all");
              setEnforcement("all");
              setStatus("all");
              setQ("");
            }}
            className="pill text-xs"
          >
            Clear
          </button>
        )}
      </section>

      <section className="glass rounded-xl overflow-x-auto">
        <div className="min-w-[1100px]">
          <div className="grid grid-cols-[110px_1.4fr_110px_90px_100px_110px_100px_70px_70px] gap-3 px-4 py-2 text-[10px] uppercase tracking-wider text-[var(--ink-2)] border-b border-white/5 bg-black/30">
            <div>Policy ID</div>
            <div>Title · Category</div>
            <div>Severity</div>
            <div>Enforce</div>
            <div>Status · Ver</div>
            <div>Owner</div>
            <div>Markets</div>
            <div>Scns</div>
            <div>Cases</div>
          </div>
          {rows.length === 0 && (
            <div className="px-4 py-8 text-sm text-[var(--ink-2)] text-center">
              No policies match the filters.
            </div>
          )}
          {rows.map((p) => (
            <button
              key={p.id}
              onClick={() => setOpenPolicyId(p.id)}
              className="w-full text-left grid grid-cols-[110px_1.4fr_110px_90px_100px_110px_100px_70px_70px] gap-3 px-4 py-3 items-center border-b border-white/5 hover:bg-white/[0.03]"
            >
              <div className="font-mono text-xs text-[var(--ink-2)]">{p.id}</div>
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{p.title}</div>
                <div className="text-[11px] text-[var(--ink-2)] truncate">{p.category}</div>
              </div>
              <div>
                <span
                  className="pill text-[10px]"
                  style={{
                    borderColor: SEVERITY_COLORS[p.severity] + "80",
                    color: SEVERITY_COLORS[p.severity],
                  }}
                >
                  {p.severity}
                </span>
              </div>
              <div>
                <span
                  className="pill text-[10px]"
                  style={{
                    borderColor: ENFORCEMENT_COLORS[p.enforcement] + "80",
                    color: ENFORCEMENT_COLORS[p.enforcement],
                  }}
                >
                  {p.enforcement}
                </span>
              </div>
              <div className="text-xs">
                <span
                  className="pill text-[10px]"
                  style={{
                    borderColor: STATUS_COLORS[p.status] + "70",
                    color: STATUS_COLORS[p.status],
                  }}
                >
                  {p.status}
                </span>
                <div className="text-[10px] text-[var(--ink-2)] mt-1 font-mono">{p.version}</div>
              </div>
              <div className="text-xs text-[var(--ink-2)] truncate">{p.owner}</div>
              <div className="text-[11px] text-[var(--ink-2)] truncate">{p.markets.slice(0, 2).join(", ")}{p.markets.length > 2 ? ` +${p.markets.length - 2}` : ""}</div>
              <div className="text-xs font-semibold">{hitCounts.scenarioHits[p.id] ?? 0}</div>
              <div className="text-xs font-semibold">{hitCounts.caseHits[p.id] ?? 0}</div>
            </button>
          ))}
        </div>
      </section>

      <div className="glass rounded-xl p-4 text-xs text-[var(--ink-2)]">
        Rules live in <code className="text-[var(--ink-1)]">lib/policies.ts</code> and are matched
        by <code className="text-[var(--ink-1)]">lib/guardianEngine.ts</code>. Click any row to
        open the policy detail drawer with reason codes, signal triggers, matched
        scenarios/cases, version history, and a simulated impact panel. Edit controls are marked
        <em> simulated</em> — Guardian behavior is still driven by the deterministic kernel.
      </div>

      <PolicyDetailDrawer policyId={openPolicyId} onClose={() => setOpenPolicyId(null)} />
    </div>
  );
}

function FilterSelect({
  label,
  value,
  setValue,
  options,
}: {
  label: string;
  value: string;
  setValue: (v: string) => void;
  options: string[];
}) {
  return (
    <label className="flex items-center gap-2 text-xs text-[var(--ink-2)]">
      <span>{label}</span>
      <select
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="bg-black/40 border border-white/10 rounded-md px-2 py-1 text-[var(--ink-1)]"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o === "all" ? "All" : o}
          </option>
        ))}
      </select>
    </label>
  );
}
