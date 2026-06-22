"use client";

import { useMemo } from "react";
import { useCaseStore } from "@/lib/caseStore";
import { getRuntimeEvents } from "@/lib/runtimeEvents";
import { computeSlaState } from "@/lib/sla";

interface QueueHealthTile {
  label: string;
  value: string | number;
  accent: string;
  sublabel?: string;
}

export default function QueueHealthStrip() {
  const { cases } = useCaseStore();
  const events = useMemo(() => getRuntimeEvents(), []);

  const tiles: QueueHealthTile[] = useMemo(() => {
    const activeEvents = events.filter((e) => e.currentStatus !== "Blocked").length;
    const evaluatedToday = events.filter((e) => e.currentStatus !== "New").length;
    const awaitingReview = cases.filter(
      (c) => c.status !== "Closed" && c.status !== "Approved with Conditions",
    ).length;
    const slaAtRisk = cases.filter((c) => {
      if (!c.slaDueAt) return false;
      const state = computeSlaState(c.slaDueAt);
      return state === "at_risk" || state === "due_soon" || state === "breached";
    }).length;
    const blocked = events.filter((e) => e.currentStatus === "Blocked").length;

    return [
      { label: "Active events", value: activeEvents, accent: "#8FA1B3" },
      { label: "Evaluated today", value: evaluatedToday, accent: "#C9A36B" },
      { label: "Awaiting review", value: awaitingReview, accent: "#F59E2E" },
      { label: "SLA at risk", value: slaAtRisk, accent: "#D97448" },
      { label: "High-risk blocked", value: blocked, accent: "#B83A3A" },
      {
        label: "Avg decision latency",
        value: "238 ms",
        accent: "#6FB089",
        sublabel: "mock · demo",
      },
    ];
  }, [cases, events]);

  return (
    <div className="grid grid-cols-3 gap-2 md:grid-cols-6">
      {tiles.map((t) => (
        <div
          key={t.label}
          className="rounded-lg border px-3 py-2.5"
          style={{
            background: `${t.accent}08`,
            borderColor: `${t.accent}30`,
          }}
        >
          <div className="text-[9px] uppercase tracking-widest leading-tight text-[var(--ink-2)]">
            {t.label}
          </div>
          <div className="mt-0.5 text-lg font-semibold" style={{ color: t.accent }}>
            {t.value}
          </div>
          {t.sublabel && <div className="text-[9px] text-[var(--ink-2)]">{t.sublabel}</div>}
        </div>
      ))}
    </div>
  );
}
