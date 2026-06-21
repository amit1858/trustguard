"use client";

import { useMemo, useState } from "react";
import {
  DEFAULT_SIM,
  SimInputs,
  diffSim,
  simulate,
} from "@/lib/simulation";
import { DECISION_COLORS } from "@/lib/cases";

const VERTICALS = [
  "Financial Services",
  "Healthcare",
  "Health",
  "Supplements",
  "Employment",
  "Housing",
  "Credit",
  "Lead Generation",
  "Fitness",
  "Retail",
];
const MARKETS = ["India", "UAE", "United States", "EU", "United Kingdom", "Singapore"];

const REQUESTED_ACTIONS = [
  "Launch campaign",
  "Increase budget",
  "Expand targeting",
  "Approve appeal",
  "Approve advertiser",
];

export default function SimulationLabView() {
  const [inputs, setInputs] = useState<SimInputs>(DEFAULT_SIM);

  const base = useMemo(() => simulate(DEFAULT_SIM), []);
  const next = useMemo(() => simulate(inputs), [inputs]);
  const diff = useMemo(() => diffSim(base, next), [base, next]);

  function set<K extends keyof SimInputs>(k: K, v: SimInputs[K]) {
    setInputs((prev) => ({ ...prev, [k]: v }));
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Simulation Lab</h1>
        <p className="text-sm text-[var(--ink-2)]">
          Build a synthetic advertiser request and watch the deterministic policy kernel produce
          a Guardian decision in real time. Compare against the default baseline to see how
          changes drive policy and risk.
        </p>
      </header>

      <section className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-6">
        {/* Form */}
        <div className="glass rounded-xl p-5 flex flex-col gap-4">
          <div className="text-sm font-semibold">Simulation inputs</div>
          <Row>
            <Field label="Advertiser">
              <input
                value={inputs.advertiserName}
                onChange={(e) => set("advertiserName", e.target.value)}
                className="input"
              />
            </Field>
            <Field label="Requested action">
              <Select value={inputs.requestedAction} onChange={(v) => set("requestedAction", v)} options={REQUESTED_ACTIONS} />
            </Field>
          </Row>
          <Row>
            <Field label="Vertical">
              <Select value={inputs.vertical} onChange={(v) => set("vertical", v)} options={VERTICALS} />
            </Field>
            <Field label="Market">
              <Select value={inputs.market} onChange={(v) => set("market", v)} options={MARKETS} />
            </Field>
          </Row>
          <Row>
            <Field label={`Monthly budget · $${inputs.monthlyBudget.toLocaleString()}`}>
              <input
                type="range"
                min={1000}
                max={500000}
                step={1000}
                value={inputs.monthlyBudget}
                onChange={(e) => set("monthlyBudget", Number(e.target.value))}
                className="w-full"
              />
            </Field>
            <Field label={`Budget multiplier · ${inputs.budgetMultiplier}x`}>
              <input
                type="range"
                min={1}
                max={6}
                step={0.5}
                value={inputs.budgetMultiplier}
                onChange={(e) => set("budgetMultiplier", Number(e.target.value))}
                className="w-full"
              />
            </Field>
          </Row>
          <Row>
            <Field label="Certification status">
              <Select value={inputs.certification} onChange={(v) => set("certification", v as SimInputs["certification"])} options={["certified", "missing", "not_required"]} />
            </Field>
            <Field label="Creative claim risk">
              <Select value={inputs.creativeClaimRisk} onChange={(v) => set("creativeClaimRisk", v as SimInputs["creativeClaimRisk"])} options={["none", "mild", "misleading"]} />
            </Field>
          </Row>
          <Row>
            <Field label="Landing page disclosure">
              <Select value={inputs.landingDisclosure} onChange={(v) => set("landingDisclosure", v as SimInputs["landingDisclosure"])} options={["strong", "adequate", "weak"]} />
            </Field>
            <Field label="Linked account risk">
              <Select value={inputs.linkedAccountRisk} onChange={(v) => set("linkedAccountRisk", v as SimInputs["linkedAccountRisk"])} options={["low", "medium", "high"]} />
            </Field>
          </Row>
          <Row>
            <Field label="Payment instrument changed">
              <Select value={inputs.paymentChanged} onChange={(v) => set("paymentChanged", v as SimInputs["paymentChanged"])} options={["no", "yes"]} />
            </Field>
            <Field label="Abnormal traffic pattern">
              <Select value={inputs.abnormalTraffic} onChange={(v) => set("abnormalTraffic", v as SimInputs["abnormalTraffic"])} options={["no", "yes"]} />
            </Field>
          </Row>
          <Row>
            <Field label="Sensitive targeting risk">
              <Select value={inputs.sensitiveTargeting} onChange={(v) => set("sensitiveTargeting", v as SimInputs["sensitiveTargeting"])} options={["no", "yes"]} />
            </Field>
            <Field label={`Account age · ${inputs.accountAgeMonths} months`}>
              <input
                type="range"
                min={0}
                max={60}
                value={inputs.accountAgeMonths}
                onChange={(e) => set("accountAgeMonths", Number(e.target.value))}
                className="w-full"
              />
            </Field>
          </Row>
          <Row>
            <Field label={`Prior violations · ${inputs.priorViolations}`}>
              <input
                type="range"
                min={0}
                max={10}
                value={inputs.priorViolations}
                onChange={(e) => set("priorViolations", Number(e.target.value))}
                className="w-full"
              />
            </Field>
            <Field label=" ">
              <button onClick={() => setInputs(DEFAULT_SIM)} className="pill text-xs w-full">
                ↺ Reset to baseline
              </button>
            </Field>
          </Row>
        </div>

        {/* Result */}
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <DecisionCard
              label="Baseline Guardian decision"
              decision={base.guardian.decision}
              risk={base.guardian.riskScore}
            />
            <DecisionCard
              label="Simulated decision"
              decision={next.guardian.decision}
              risk={next.guardian.riskScore}
              highlight
            />
          </div>

          <div
            className="glass-strong rounded-xl p-4"
            style={{ borderColor: "rgba(201, 163, 107, 0.45)" }}
          >
            <div className="text-[10px] uppercase tracking-wider text-[var(--ink-2)]">
              Risk delta
            </div>
            <div
              className="text-2xl font-semibold mt-1"
              style={{
                color: diff.riskDelta > 0 ? "#B83A3A" : diff.riskDelta < 0 ? "#6FB089" : "#94a3b8",
              }}
            >
              {diff.riskDelta > 0 ? "+" : ""}
              {diff.riskDelta}
            </div>
            <div className="text-xs text-[var(--ink-2)] mt-1">
              base {base.guardian.riskScore} → sim {next.guardian.riskScore}
            </div>
          </div>

          <Diff
            label="Triggered policies (new in sim)"
            items={diff.triggeredPolicies}
            accent="#B83A3A"
            empty="No new policies."
          />
          <Diff
            label="Resolved policies (no longer firing)"
            items={diff.resolvedPolicies}
            accent="#6FB089"
            empty="No policies resolved."
          />
          <Diff
            label="New reason codes"
            items={diff.newReasonCodes}
            accent="#D97448"
            empty="No new reason codes."
          />
          <Diff
            label="Removed reason codes"
            items={diff.removedReasonCodes}
            accent="#6FB089"
            empty="No reason codes removed."
          />

          <div className="glass rounded-xl p-4">
            <div className="text-[10px] uppercase tracking-wider text-[var(--ink-2)] mb-2">
              Simulated allowed actions
            </div>
            <ul className="text-xs flex flex-col gap-1">
              {next.guardian.allowedActions.map((a) => (
                <li key={a}>✓ {a}</li>
              ))}
              {next.guardian.allowedActions.length === 0 && <li>—</li>}
            </ul>
            <div className="text-[10px] uppercase tracking-wider text-[var(--ink-2)] mt-3 mb-2">
              Simulated blocked actions
            </div>
            <ul className="text-xs flex flex-col gap-1">
              {next.guardian.blockedActions.map((a) => (
                <li key={a}>✕ {a}</li>
              ))}
              {next.guardian.blockedActions.length === 0 && <li>—</li>}
            </ul>
            <div className="text-[10px] mt-3 text-[var(--ink-2)]">
              Human review required:{" "}
              <span className="font-semibold text-[var(--ink-1)]">
                {next.guardian.humanReviewRequired ? "Yes" : "No"}
              </span>
            </div>
          </div>

          <div className="glass rounded-xl p-4 text-xs">
            <div className="text-[10px] uppercase tracking-wider text-[var(--ink-2)] mb-1">
              Why the decision changed
            </div>
            <p className="text-[var(--ink-1)]">{next.guardian.explanation}</p>
          </div>
        </div>
      </section>
    </div>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{children}</div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] uppercase tracking-wider text-[var(--ink-2)]">{label}</span>
      {children}
    </label>
  );
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="input"
    >
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

function DecisionCard({
  label,
  decision,
  risk,
  highlight,
}: {
  label: string;
  decision: string;
  risk: number;
  highlight?: boolean;
}) {
  const color = DECISION_COLORS[decision as keyof typeof DECISION_COLORS] || "#94a3b8";
  return (
    <div
      className="glass rounded-xl p-4"
      style={{
        borderColor: highlight ? color + "80" : "rgba(255,255,255,0.08)",
        boxShadow: highlight ? `0 0 24px -10px ${color}` : "none",
      }}
    >
      <div className="text-[10px] uppercase tracking-wider text-[var(--ink-2)]">{label}</div>
      <div className="text-xl font-semibold mt-1" style={{ color }}>
        {decision}
      </div>
      <div className="text-xs text-[var(--ink-2)] mt-1">
        risk <span className="font-semibold text-[var(--ink-1)]">{risk}</span>
      </div>
    </div>
  );
}

function Diff({
  label,
  items,
  accent,
  empty,
}: {
  label: string;
  items: string[];
  accent: string;
  empty: string;
}) {
  return (
    <div className="glass rounded-xl p-3">
      <div className="text-[10px] uppercase tracking-wider text-[var(--ink-2)] mb-2">{label}</div>
      {items.length === 0 ? (
        <div className="text-xs text-[var(--ink-2)]">{empty}</div>
      ) : (
        <div className="flex flex-wrap gap-1">
          {items.map((it) => (
            <span
              key={it}
              className="pill text-[10px] font-mono"
              style={{ borderColor: accent + "80", color: accent }}
            >
              {it}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
