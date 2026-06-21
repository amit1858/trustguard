import type { CaseStatus } from "./cases";

export interface LedgerEvent {
  eventId: string;
  caseId: string;
  timestamp: string;
  actor: string; // operator username
  action: string; // e.g. "assign", "request_evidence", "approve_with_conditions", "block", "close", "note_added"
  label: string; // human label, e.g. "Assigned to Amit"
  previousStatus?: CaseStatus;
  newStatus?: CaseStatus;
  note?: string;
}

function uid(): string {
  return `evt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function createEvent(
  caseId: string,
  actor: string,
  action: string,
  label: string,
  opts: { previousStatus?: CaseStatus; newStatus?: CaseStatus; note?: string } = {},
): LedgerEvent {
  return {
    eventId: uid(),
    caseId,
    timestamp: new Date().toISOString(),
    actor,
    action,
    label,
    ...opts,
  };
}
