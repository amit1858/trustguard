"use client";

import { useMemo, useState } from "react";
import { computePolicyPressure, type PolicyPressureRow } from "@/lib/executiveMetrics";

type Tab = "firing" | "reviewLoad" | "block" | "escalate" | "zero";

const TAB_LABELS: { key: Tab; label: string }[] = [
  { key: "firing", label: "Most Firing" },
  { key: "reviewLoad", label: "Review Load" },
  { key: "block", label: "Block" },
  { key: "escalate", label: "Escalate" },
  { key: "zero", label: "Zero Hits" },
];

export default function PolicyPressurePanel({
  onOpenPolicy,
}: {
  onOpenPolicy?: (id: string) => void;
}) {
  const [tab, setTab] = useState<Tab>("firing");
  const pressure = useMemo(() => computePolicyPressure(), []);

  const rows: PolicyPressureRow[] | { policyId: string; title: string; status: string }[] =
    tab === "firing"
      ? pressure.topByFiring
      : tab === "reviewLoad"
        ? pressure.topByReviewLoad
        : tab === "block"
          ? pressure.topByBlock
          : tab === "escalate"
            ? pressure.topByEscalate
            : pressure.zerohits;

  function valueFor(row: PolicyPressureRow): number {
    if (tab === "firing") return row.hitCount;
    if (tab === "reviewLoad") return row.reviewLoadCount;
    if (tab === "block") return row.blockCount;
    if (tab === "escalate") return row.escalateCount;
    return 0;
  }

  function valueLabelFor(): string {
    if (tab === "firing") return "hits";
    if (tab === "reviewLoad") return "review cases";
    if (tab === "block") return "blocks";
    if (tab === "escalate") return "escalations";
    return "";
  }

  const accent = tab === "block" ? "#B83A3A" : tab === "escalate" ? "#D97448" : tab === "reviewLoad" ? "#F59E2E" : tab === "zero" ? "#7F776B" : "#C7B8DC";

  return (
    <section className="glass p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <div className="text-xs uppercase tracking-widest text-[var(--ink-2)]">
            Phase 3D · Policy Pressure
          </div>
          <div className="text-base font-semibold">Policy Firing Analysis</div>
        </div>
        <span
          className="pill text-[10px]"
          style={{ borderColor: "rgba(201, 163, 107, 0.45)", color: "#F4EFE7" }}
        >
          deterministic
        </span>
      </div>

      {/* Tab strip */}
      <div className="flex flex-wrap gap-1.5">
        {TAB_LABELS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className="pill text-[10px]"
            style={
              tab === key
                ? { borderColor: accent, color: accent, background: `${accent}18` }
                : { borderColor: "var(--border)", color: "var(--ink-2)" }
            }
          >
            {label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="flex flex-col gap-1.5">
        {tab === "zero" ? (
          pressure.zerohits.length === 0 ? (
            <div className="text-xs text-[var(--ink-2)] italic">
              All active policies have fired at least once.
            </div>
          ) : (
            pressure.zerohits.map((r) => (
              <ZeroRow key={r.policyId} policyId={r.policyId} title={r.title} status={r.status} onOpen={onOpenPolicy} />
            ))
          )
        ) : (
          (rows as PolicyPressureRow[]).map((r) => (
            <PressureRow
              key={r.policyId}
              row={r}
              value={valueFor(r)}
              valueLabel={valueLabelFor()}
              accent={accent}
              onOpen={onOpenPolicy}
            />
          ))
        )}
        {tab !== "zero" && (rows as PolicyPressureRow[]).length === 0 && (
          <div className="text-xs text-[var(--ink-2)] italic">No data for this category.</div>
        )}
      </div>
    </section>
  );
}

function PressureRow({
  row,
  value,
  valueLabel,
  accent,
  onOpen,
}: {
  row: PolicyPressureRow;
  value: number;
  valueLabel: string;
  accent: string;
  onOpen?: (id: string) => void;
}) {
  const content = (
    <div
      className="rounded-lg border px-3 py-2 flex items-center justify-between gap-3 w-full text-left"
      style={{ borderColor: `${accent}30`, background: `${accent}07` }}
    >
      <div className="min-w-0 flex-1">
        <div className="text-xs font-medium text-[var(--ink-0)] truncate">{row.title}</div>
        <div className="text-[10px] text-[var(--ink-2)]">{row.policyId}</div>
      </div>
      <div className="shrink-0 text-right">
        <div className="text-sm font-bold" style={{ color: accent }}>
          {value}
        </div>
        <div className="text-[10px] text-[var(--ink-2)]">{valueLabel}</div>
      </div>
    </div>
  );

  if (onOpen) {
    return (
      <button onClick={() => onOpen(row.policyId)} className="w-full">
        {content}
      </button>
    );
  }

  return (
    <a
      href={`?view=policy-console&policy=${row.policyId}`}
      className="block w-full"
    >
      {content}
    </a>
  );
}

function ZeroRow({
  policyId,
  title,
  status,
  onOpen,
}: {
  policyId: string;
  title: string;
  status: string;
  onOpen?: (id: string) => void;
}) {
  const accent = "#7F776B";
  const content = (
    <div
      className="rounded-lg border px-3 py-2 flex items-center justify-between gap-3 w-full text-left"
      style={{ borderColor: `${accent}30`, background: `${accent}07` }}
    >
      <div className="min-w-0 flex-1">
        <div className="text-xs font-medium text-[var(--ink-0)] truncate">{title}</div>
        <div className="text-[10px] text-[var(--ink-2)]">{policyId}</div>
      </div>
      <span
        className="pill text-[10px] shrink-0"
        style={{ borderColor: `${accent}40`, color: accent }}
      >
        {status} · 0 hits
      </span>
    </div>
  );

  if (onOpen) {
    return (
      <button onClick={() => onOpen(policyId)} className="w-full">
        {content}
      </button>
    );
  }

  return (
    <a href={`?view=policy-console&policy=${policyId}`} className="block w-full">
      {content}
    </a>
  );
}
