"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import {
  CaseRecord,
  CaseStatus,
  FinalEnforcementAction,
  ReviewOutcome,
  ReviewerOutcome,
  seedCasesFromScenarios,
} from "./cases";
import { LedgerEvent, createEvent } from "./decisionLedger";

const LS_CASES = "trustguard.cases.v1";
const LS_LEDGER = "trustguard.ledger.v1";
const LS_OUTCOMES = "trustguard.outcomes.v1";

interface StoreState {
  cases: CaseRecord[];
  ledger: LedgerEvent[];
  outcomes: ReviewOutcome[];
}

let state: StoreState = { cases: [], ledger: [], outcomes: [] };
let hydrated = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function persist() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LS_CASES, JSON.stringify(state.cases));
    window.localStorage.setItem(LS_LEDGER, JSON.stringify(state.ledger));
    window.localStorage.setItem(LS_OUTCOMES, JSON.stringify(state.outcomes));
  } catch {
    /* quota or disabled — non-fatal */
  }
}

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const rawCases = window.localStorage.getItem(LS_CASES);
    const rawLedger = window.localStorage.getItem(LS_LEDGER);
    const rawOutcomes = window.localStorage.getItem(LS_OUTCOMES);
    const cases: CaseRecord[] = rawCases ? JSON.parse(rawCases) : seedCasesFromScenarios();
    const ledger: LedgerEvent[] = rawLedger ? JSON.parse(rawLedger) : [];
    const outcomes: ReviewOutcome[] = rawOutcomes ? JSON.parse(rawOutcomes) : [];
    state = { cases, ledger, outcomes };
    if (!rawCases) persist();
  } catch {
    state = { cases: seedCasesFromScenarios(), ledger: [], outcomes: [] };
    persist();
  }
  emit();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

const serverSnapshot: StoreState = { cases: [], ledger: [], outcomes: [] };
function getSnapshot() {
  return state;
}
function getServerSnapshot() {
  return serverSnapshot;
}

function updateCase(caseId: string, patch: Partial<CaseRecord>) {
  state = {
    ...state,
    cases: state.cases.map((c) =>
      c.caseId === caseId ? { ...c, ...patch, updatedAt: new Date().toISOString() } : c,
    ),
  };
}

function appendEvent(ev: LedgerEvent) {
  state = { ...state, ledger: [ev, ...state.ledger] };
}

function appendOutcome(o: ReviewOutcome) {
  state = { ...state, outcomes: [o, ...state.outcomes] };
}

export function resetStoreToSeed() {
  state = { cases: seedCasesFromScenarios(), ledger: [], outcomes: [] };
  persist();
  emit();
}

function uid(prefix = "out"): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

const OUTCOME_TO_STATUS: Record<ReviewerOutcome, CaseStatus> = {
  "Upheld Guardian Decision": "Closed",
  "Approved with Conditions": "Approved with Conditions",
  "Reversed after Evidence": "Approved with Conditions",
  "Escalated to Policy": "Escalated to Policy",
  "Closed as Duplicate": "Closed",
  "No Action Needed": "Closed",
};

const OUTCOME_TO_ENFORCEMENT: Record<ReviewerOutcome, FinalEnforcementAction> = {
  "Upheld Guardian Decision": "Campaign remains blocked",
  "Approved with Conditions": "Campaign can launch with conditions",
  "Reversed after Evidence": "Campaign can launch with conditions",
  "Escalated to Policy": "Sent to policy specialist",
  "Closed as Duplicate": "Case closed",
  "No Action Needed": "Case closed",
};

export interface CaseActions {
  assignToMe: (caseId: string, who?: string) => void;
  requestAdvertiserEvidence: (caseId: string) => void;
  approveWithConditions: (caseId: string) => void;
  sendToPolicySpecialist: (caseId: string) => void;
  blockCampaign: (caseId: string) => void;
  closeCase: (caseId: string) => void;
  addNote: (caseId: string, note: string, who?: string) => void;
  setStatus: (caseId: string, status: CaseStatus, label?: string, who?: string) => void;
  recordOutcome: (
    caseId: string,
    reviewerOutcome: ReviewerOutcome,
    opts?: { conditions?: string[]; rationale?: string; who?: string },
  ) => void;
}

const DEFAULT_OPERATOR = "Amit";

export function useCaseStore() {
  const snap = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    hydrate();
  }, []);

  const transition = useCallback(
    (caseId: string, newStatus: CaseStatus, action: string, label: string, who: string) => {
      const before = state.cases.find((c) => c.caseId === caseId);
      if (!before) return;
      const prev = before.status;
      updateCase(caseId, { status: newStatus, owner: who });
      appendEvent(
        createEvent(caseId, who, action, label, { previousStatus: prev, newStatus }),
      );
      persist();
      emit();
    },
    [],
  );

  const actions: CaseActions = {
    assignToMe: (caseId, who = DEFAULT_OPERATOR) => {
      const before = state.cases.find((c) => c.caseId === caseId);
      if (!before) return;
      const prev = before.status;
      const next: CaseStatus = prev === "New" ? "In Review" : prev;
      updateCase(caseId, { owner: who, status: next });
      appendEvent(
        createEvent(caseId, who, "assign", `Assigned to ${who}`, {
          previousStatus: prev,
          newStatus: next,
        }),
      );
      persist();
      emit();
    },
    requestAdvertiserEvidence: (caseId, who = DEFAULT_OPERATOR) =>
      transition(caseId, "Waiting for Advertiser", "request_evidence", "Requested advertiser evidence", who),
    approveWithConditions: (caseId, who = DEFAULT_OPERATOR) =>
      transition(caseId, "Approved with Conditions", "approve_conditions", "Approved with conditions", who),
    sendToPolicySpecialist: (caseId, who = DEFAULT_OPERATOR) =>
      transition(caseId, "Escalated to Policy", "escalate_policy", "Sent to policy specialist", who),
    blockCampaign: (caseId, who = DEFAULT_OPERATOR) =>
      transition(caseId, "Blocked", "block_campaign", "Blocked campaign", who),
    closeCase: (caseId, who = DEFAULT_OPERATOR) =>
      transition(caseId, "Closed", "close_case", "Closed case", who),
    setStatus: (caseId, status, label, who = DEFAULT_OPERATOR) =>
      transition(caseId, status, "set_status", label ?? `Status → ${status}`, who),
    addNote: (caseId, note, who = DEFAULT_OPERATOR) => {
      const before = state.cases.find((c) => c.caseId === caseId);
      if (!before) return;
      const trimmed = note.trim();
      if (!trimmed) return;
      updateCase(caseId, { notes: [...before.notes, `${who}: ${trimmed}`] });
      appendEvent(createEvent(caseId, who, "note_added", "Reviewer note added", { note: trimmed }));
      persist();
      emit();
    },
    recordOutcome: (caseId, reviewerOutcome, opts = {}) => {
      const who = opts.who ?? DEFAULT_OPERATOR;
      const before = state.cases.find((c) => c.caseId === caseId);
      if (!before) return;
      const prevStatus = before.status;
      const newStatus = OUTCOME_TO_STATUS[reviewerOutcome];
      const finalEnforcement = OUTCOME_TO_ENFORCEMENT[reviewerOutcome];
      const ev = createEvent(caseId, who, "review_outcome", `Outcome: ${reviewerOutcome}`, {
        previousStatus: prevStatus,
        newStatus,
        note: opts.rationale,
      });
      const outcome: ReviewOutcome = {
        outcomeId: uid("out"),
        caseId,
        guardianDecision: before.guardianDecision,
        reviewerOutcome,
        finalEnforcementAction: finalEnforcement,
        reviewer: who,
        timestamp: new Date().toISOString(),
        conditions: opts.conditions ?? [],
        rationale: opts.rationale ?? "",
        linkedLedgerEventId: ev.eventId,
      };
      updateCase(caseId, { status: newStatus, owner: who });
      appendEvent(ev);
      appendOutcome(outcome);
      persist();
      emit();
    },
  };

  return { ...snap, actions, reset: resetStoreToSeed };
}
