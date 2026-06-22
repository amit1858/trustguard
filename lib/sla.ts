export type SlaState = "on_track" | "due_soon" | "at_risk" | "breached";

// Fixed demo now anchor — ensures all 4 SLA states are always visible in demo
export const DEMO_NOW = "2026-06-21T16:00:00Z";

// Deterministic slaDueAt values — indexed by (caseIndex % 4)
// Designed so each slot maps to a unique slaState against DEMO_NOW
export const SLA_DUE_AT_POOL = [
  "2026-06-21T12:00:00Z", // breached  (demoNow - 4h)
  "2026-06-21T16:30:00Z", // at_risk   (demoNow + 30min)
  "2026-06-21T17:30:00Z", // due_soon  (demoNow + 90min)
  "2026-06-21T22:00:00Z", // on_track  (demoNow + 6h)
];

export function computeSlaState(slaDueAt: string): SlaState {
  const now = new Date(DEMO_NOW).getTime();
  const due = new Date(slaDueAt).getTime();
  const minsLeft = (due - now) / 60_000;
  if (minsLeft < 0) return "breached";
  if (minsLeft < 60) return "at_risk";
  if (minsLeft < 180) return "due_soon";
  return "on_track";
}

export const SLA_STATE_COLORS: Record<SlaState, string> = {
  on_track: "#6FB089",
  due_soon: "#F59E2E",
  at_risk: "#D97448",
  breached: "#B83A3A",
};

export const SLA_STATE_LABELS: Record<SlaState, string> = {
  on_track: "On track",
  due_soon: "Due soon",
  at_risk: "At risk",
  breached: "Breached",
};
