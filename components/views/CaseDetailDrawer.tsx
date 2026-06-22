"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CaseRecord,
  DECISION_COLORS,
  PRIORITY_COLORS,
  STATUS_COLORS,
  QUALITY_MARKER_COLORS,
  QUALITY_MARKER_LABELS,
  ReviewerOutcome,
  getScenarioForCase,
} from "@/lib/cases";
import { useCaseStore } from "@/lib/caseStore";
import OrchestratorPanel from "@/components/OrchestratorPanel";
import GuardianPanel from "@/components/GuardianPanel";
import InterceptionMoment from "@/components/InterceptionMoment";
import WorkerFindings from "@/components/WorkerFindings";
import ActionsColumns from "@/components/ActionsColumns";
import AuditTrail from "@/components/AuditTrail";
import EvidencePack from "@/components/EvidencePack";
import InvestigationTimeline from "@/components/InvestigationTimeline";
import AssignmentHistoryPanel from "@/components/AssignmentHistoryPanel";
import EvidenceRequestsPanel from "@/components/EvidenceRequestsPanel";
import AppealReviewPath from "@/components/AppealReviewPath";
import { buildEvidencePack } from "@/lib/evidence";
import CopyLinkButton from "@/components/CopyLinkButton";
import { computeSlaState, SLA_STATE_COLORS, SLA_STATE_LABELS } from "@/lib/sla";
import { getRuntimeEvents } from "@/lib/runtimeEvents";
import AgentPermissionCheck from "@/components/AgentPermissionCheck";
import type { QualityMarker } from "@/lib/types";

function fmtTime(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function exportAuditPack(c: CaseRecord, ledger: ReturnType<typeof useCaseStore>["ledger"]) {
  const { guardian } = getScenarioForCase(c);
  const payload = {
    case: c,
    guardian: {
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
    },
    ledger: ledger.filter((e) => e.caseId === c.caseId),
    exportedAt: new Date().toISOString(),
    note:
      "Guardian decision is immutable. Operator actions are review outcomes, not rewrites of the Guardian evaluation.",
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `trustguard-audit-pack-${c.caseId}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function CaseDetailDrawer({
  caseId,
  onClose,
}: {
  caseId: string | null;
  onClose: () => void;
}) {
  const { cases, ledger, outcomes, actions } = useCaseStore();
  const [note, setNote] = useState("");
  const [outcomeRationale, setOutcomeRationale] = useState("");
  const [showQaDropdown, setShowQaDropdown] = useState(false);

  useEffect(() => {
    if (!caseId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [caseId, onClose]);

  const latestOutcome = useMemo(() => {
    if (!caseId) return null;
    return outcomes.find((o) => o.caseId === caseId) ?? null;
  }, [outcomes, caseId]);

  // Phase 3C: find matching runtime event to get agent identity
  // Must be before early returns to satisfy Rules of Hooks.
  const matchingEvent = useMemo(() => {
    if (!caseId) return null;
    const c = cases.find((x) => x.caseId === caseId);
    if (!c) return null;
    const events = getRuntimeEvents();
    return events.find((e) => e.linkedScenarioId === c.scenarioId) ?? null;
  }, [caseId, cases]);

  if (!caseId) return null;
  const c = cases.find((x) => x.caseId === caseId);
  if (!c) return null;

  const { scenario, orchestrator, guardian } = getScenarioForCase(c);
  const caseEvents = ledger.filter((e) => e.caseId === c.caseId);
  const caseOutcomes = outcomes.filter((o) => o.caseId === c.caseId);
  const evidencePack = buildEvidencePack(scenario, guardian);
  const slaState = c.slaState ?? (c.slaDueAt ? computeSlaState(c.slaDueAt) : "on_track");
  const slaStateColor = SLA_STATE_COLORS[slaState];

  function recordOutcome(outcome: ReviewerOutcome) {
    if (!c) return;
    actions.recordOutcome(c.caseId, outcome, { rationale: outcomeRationale.trim() || undefined });
    setOutcomeRationale("");
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      <div
        className="flex-1 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close drawer"
      />
      <aside
        className="h-full w-full max-w-[1100px] overflow-y-auto border-l border-white/10"
        style={{
          background:
            "linear-gradient(180deg, rgba(8,10,24,0.98) 0%, rgba(5,7,18,0.98) 100%)",
        }}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 px-6 py-4 border-b border-white/5 backdrop-blur"
          style={{ background: "rgba(8,10,24,0.85)" }}>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs text-[var(--ink-2)] flex-wrap">
                <span className="pill" style={{ borderColor: "rgba(255,255,255,0.1)" }}>{c.caseId}</span>
                <span
                  className="pill"
                  style={{
                    borderColor: PRIORITY_COLORS[c.priority] + "80",
                    color: PRIORITY_COLORS[c.priority],
                  }}
                >
                  {c.priority} · SLA {c.sla}
                </span>
                <span
                  className="pill"
                  style={{
                    borderColor: slaStateColor + "80",
                    color: slaStateColor,
                  }}
                >
                  {SLA_STATE_LABELS[slaState]}
                </span>
                <span
                  className="pill"
                  style={{
                    borderColor: STATUS_COLORS[c.status] + "80",
                    color: STATUS_COLORS[c.status],
                  }}
                >
                  {c.status}
                </span>
                <span
                  className="pill"
                  style={{
                    borderColor: DECISION_COLORS[c.guardianDecision] + "80",
                    color: DECISION_COLORS[c.guardianDecision],
                  }}
                >
                  Guardian: {c.guardianDecision}
                </span>
                {/* Quality marker pill */}
                <button
                  className="pill"
                  title="Click to change quality marker"
                  onClick={() => setShowQaDropdown((v) => !v)}
                  style={{
                    borderColor: QUALITY_MARKER_COLORS[c.qualityMarker ?? "not_reviewed"] + "80",
                    color: QUALITY_MARKER_COLORS[c.qualityMarker ?? "not_reviewed"],
                    cursor: "pointer",
                  }}
                >
                  QM: {QUALITY_MARKER_LABELS[c.qualityMarker ?? "not_reviewed"]}
                </button>
                <span className="pill" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
                  Owner: {c.owner}
                </span>
              </div>
              <h2 className="mt-2 text-xl font-semibold">
                {c.advertiserName} · {c.campaignName}
              </h2>
              <p className="text-sm text-[var(--ink-2)]">
                {c.vertical} · {c.market} · {c.requestedAction}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <CopyLinkButton state={{ view: "review-queue", case: c.caseId }} label="Copy link" />
              <button onClick={onClose} className="pill" title="Close (Esc)">✕</button>
            </div>
          </div>

          {/* Operator action bar */}
          <div className="mt-4 flex flex-wrap gap-2">
            <ActionButton onClick={() => actions.assignToMe(c.caseId)} accent="#C9A36B">Assign to me</ActionButton>
            <ActionButton onClick={() => actions.requestAdvertiserEvidence(c.caseId)} accent="#F59E2E">Request advertiser evidence</ActionButton>
            <ActionButton onClick={() => actions.approveWithConditions(c.caseId)} accent="#6FB089">Approve with conditions</ActionButton>
            <ActionButton onClick={() => actions.sendToPolicySpecialist(c.caseId)} accent="#D97448">Send to policy specialist</ActionButton>
            <ActionButton onClick={() => actions.blockCampaign(c.caseId)} accent="#B83A3A">Block campaign</ActionButton>
            <ActionButton onClick={() => actions.closeCase(c.caseId)} accent="#94a3b8">Close case</ActionButton>
            <ActionButton onClick={() => exportAuditPack(c, ledger)} accent="#C7B8DC">⬇ Export audit pack</ActionButton>
          </div>
        </div>

        <div className="px-6 py-6 flex flex-col gap-6">
          {/* Immutability notice */}
          <div
            className="glass rounded-xl p-3 text-xs flex items-start gap-2"
            style={{ borderColor: "rgba(167,139,250,0.4)" }}
          >
            <span style={{ color: "#C7B8DC" }}>⚑</span>
            <span className="text-[var(--ink-2)]">
              Guardian decision is immutable. Human review can add an outcome, but cannot
              rewrite the original Guardian evaluation.
            </span>
          </div>

          {/* Next best action + quality marker dropdown */}
          <div className="glass-strong rounded-xl p-4">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex-1 min-w-0">
                <div className="text-[10px] uppercase tracking-wider text-[var(--ink-2)]">Next best action</div>
                <div className="text-sm mt-1">{c.nextBestAction}</div>
              </div>
              <div className="shrink-0">
                {showQaDropdown ? (
                  <div className="flex flex-col gap-1">
                    <div className="text-[10px] uppercase tracking-wider text-[var(--ink-2)] mb-1">
                      Set quality marker
                    </div>
                    {(["not_reviewed", "needs_qa", "qa_passed", "policy_calibration_needed"] as QualityMarker[]).map((m) => (
                      <button
                        key={m}
                        onClick={() => {
                          actions.setQualityMarker(c.caseId, m);
                          setShowQaDropdown(false);
                        }}
                        className="pill text-[10px] text-left"
                        style={{
                          borderColor: QUALITY_MARKER_COLORS[m] + "60",
                          color: QUALITY_MARKER_COLORS[m],
                          background: c.qualityMarker === m ? QUALITY_MARKER_COLORS[m] + "15" : "transparent",
                        }}
                      >
                        {m === c.qualityMarker ? "✓ " : ""}{QUALITY_MARKER_LABELS[m]}
                      </button>
                    ))}
                    <button
                      onClick={() => setShowQaDropdown(false)}
                      className="pill text-[10px] mt-1"
                      style={{ borderColor: "rgba(255,255,255,0.1)", color: "var(--ink-2)" }}
                    >
                      Cancel
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          {/* Assignment History */}
          <AssignmentHistoryPanel
            history={c.assignmentHistory ?? []}
            currentOwner={c.owner}
          />

          {/* Investigation Timeline */}
          <InvestigationTimeline
            c={c}
            guardian={guardian}
            caseEvents={caseEvents}
            outcomes={caseOutcomes}
          />

          {/* Interception strip */}
          <InterceptionMoment scenario={scenario} guardian={guardian} />

          {/* Phase 3C: Agent Permission Check */}
          {matchingEvent?.sourceAgentId && (
            <section className="glass rounded-xl p-5">
              <div className="text-sm font-semibold mb-3">Agent permission check</div>
              <AgentPermissionCheck
                agentId={matchingEvent.sourceAgentId}
                requestedAction={matchingEvent.requestedPermission ?? c.requestedAction}
                guardianDecision={c.guardianDecision}
                sourceSystem={matchingEvent.sourceSystem}
                actionSensitivity={matchingEvent.actionSensitivity}
                guardianRequired={matchingEvent.guardianRequired}
              />
            </section>
          )}

          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <OrchestratorPanel scenario={scenario} orchestrator={orchestrator} />
            </div>
            <div className="lg:col-span-2 flex flex-col gap-6">
              <GuardianPanel scenario={scenario} guardian={guardian} aiAssisted={false} />
              <DecisionOutcomeStack
                guardianDecision={c.guardianDecision}
                outcome={latestOutcome}
              />
              <ActionsColumns guardian={guardian} />
            </div>
          </section>

          <WorkerFindings findings={scenario.workerFindings} />

          <EvidencePack sections={evidencePack} />

          {/* Evidence Requests Panel */}
          <EvidenceRequestsPanel
            caseId={c.caseId}
            evidenceRequests={c.evidenceRequests ?? []}
            actions={actions}
          />

          {/* Appeal & Review Path */}
          <AppealReviewPath
            guardianDecision={c.guardianDecision}
            vertical={c.vertical}
            caseOutcomes={caseOutcomes}
          />

          {/* Outcome panel */}
          <section className="glass rounded-xl p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-semibold">Human review outcome</div>
              <span className="text-[10px] uppercase tracking-wider text-[var(--ink-2)]">
                Separate from Guardian decision · ledger-tracked
              </span>
            </div>
            <p className="text-xs text-[var(--ink-2)] mb-3">
              Choose how this case should resolve. Outcomes are persisted as a separate layer —
              they do <span className="font-semibold text-[var(--ink-1)]">not</span> modify the
              Guardian&apos;s original decision.
            </p>
            <textarea
              value={outcomeRationale}
              onChange={(e) => setOutcomeRationale(e.target.value)}
              placeholder="Optional rationale for this outcome…"
              className="w-full rounded-md bg-black/40 border border-white/10 p-2 text-sm min-h-[60px] mb-3"
            />
            <div className="flex flex-wrap gap-2">
              <OutcomeButton onClick={() => recordOutcome("Upheld Guardian Decision")} accent="#B83A3A">
                Uphold Guardian decision
              </OutcomeButton>
              <OutcomeButton onClick={() => recordOutcome("Approved with Conditions")} accent="#6FB089">
                Approve with conditions
              </OutcomeButton>
              <OutcomeButton onClick={() => recordOutcome("Reversed after Evidence")} accent="#C9A36B">
                Reverse after evidence
              </OutcomeButton>
              <OutcomeButton onClick={() => recordOutcome("Escalated to Policy")} accent="#D97448">
                Escalate to policy
              </OutcomeButton>
              <OutcomeButton onClick={() => recordOutcome("Closed as Duplicate")} accent="#94a3b8">
                Close as duplicate
              </OutcomeButton>
              <OutcomeButton onClick={() => recordOutcome("No Action Needed")} accent="#94a3b8">
                Mark no action needed
              </OutcomeButton>
            </div>
          </section>

          {/* Reviewer notes */}
          <section className="glass rounded-xl p-5">
            <div className="text-sm font-semibold mb-2">Reviewer notes</div>
            <div className="flex flex-col gap-2 mb-3">
              {c.notes.length === 0 && (
                <div className="text-xs text-[var(--ink-2)]">No notes yet.</div>
              )}
              {c.notes.map((n, i) => (
                <div key={i} className="text-xs glass rounded-md p-2">
                  {n}
                </div>
              ))}
            </div>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a reviewer note (will be added to the audit ledger)…"
              className="w-full rounded-md bg-black/40 border border-white/10 p-2 text-sm min-h-[70px]"
            />
            <div className="mt-2 flex justify-end">
              <button
                className="pill"
                style={{ borderColor: "rgba(201, 163, 107, 0.5)", color: "#F4EFE7" }}
                onClick={() => {
                  if (!note.trim()) return;
                  actions.addNote(c.caseId, note);
                  setNote("");
                }}
              >
                Save note
              </button>
            </div>
          </section>

          {/* Audit timeline — operator events first, then Guardian engine audit trail */}
          <section className="glass rounded-xl p-5">
            <div className="text-sm font-semibold mb-3">Case audit timeline</div>
            {caseEvents.length === 0 ? (
              <div className="text-xs text-[var(--ink-2)] mb-3">
                No operator actions recorded yet for this case.
              </div>
            ) : (
              <ol className="flex flex-col gap-2 mb-4">
                {caseEvents.map((ev) => (
                  <li key={ev.eventId} className="text-xs flex items-start gap-3">
                    <span className="text-[var(--ink-2)] w-40 shrink-0">{fmtTime(ev.timestamp)}</span>
                    <span className="font-medium">{ev.label}</span>
                    <span className="text-[var(--ink-2)]">
                      {ev.actor}
                      {ev.previousStatus && ev.newStatus && ev.previousStatus !== ev.newStatus
                        ? ` · ${ev.previousStatus} → ${ev.newStatus}`
                        : ""}
                      {ev.note ? ` · "${ev.note}"` : ""}
                    </span>
                  </li>
                ))}
              </ol>
            )}
            <div className="text-[10px] uppercase tracking-wider text-[var(--ink-2)] mb-2">
              Guardian engine trail (immutable)
            </div>
            <AuditTrail events={guardian.auditTrail} />
          </section>
        </div>
      </aside>
    </div>
  );
}

function ActionButton({
  onClick,
  accent,
  children,
}: {
  onClick: () => void;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="pill text-xs"
      style={{ borderColor: accent + "70", color: accent }}
    >
      {children}
    </button>
  );
}

function OutcomeButton({
  onClick,
  accent,
  children,
}: {
  onClick: () => void;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="text-xs px-3 py-2 rounded-md font-medium transition"
      style={{
        background: accent + "15",
        border: `1px solid ${accent}60`,
        color: accent,
      }}
    >
      {children}
    </button>
  );
}

function DecisionOutcomeStack({
  guardianDecision,
  outcome,
}: {
  guardianDecision: import("@/lib/types").GuardianDecision;
  outcome: import("@/lib/cases").ReviewOutcome | null;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      <StackTile
        label="Guardian decision"
        sublabel="Immutable · deterministic kernel"
        value={guardianDecision}
        accent={DECISION_COLORS[guardianDecision]}
      />
      <StackTile
        label="Human review outcome"
        sublabel={outcome ? `by ${outcome.reviewer}` : "pending"}
        value={outcome?.reviewerOutcome ?? "—"}
        accent="#C7B8DC"
        dim={!outcome}
      />
      <StackTile
        label="Final enforcement action"
        sublabel={outcome ? new Date(outcome.timestamp).toLocaleString() : ""}
        value={outcome?.finalEnforcementAction ?? "—"}
        accent="#C9A36B"
        dim={!outcome}
      />
    </div>
  );
}

function StackTile({
  label,
  sublabel,
  value,
  accent,
  dim,
}: {
  label: string;
  sublabel?: string;
  value: string;
  accent: string;
  dim?: boolean;
}) {
  return (
    <div
      className="glass rounded-xl p-3"
      style={{
        borderColor: dim ? "rgba(255,255,255,0.08)" : accent + "60",
        boxShadow: dim ? "none" : `0 0 24px -16px ${accent}`,
        opacity: dim ? 0.65 : 1,
      }}
    >
      <div className="text-[10px] uppercase tracking-wider text-[var(--ink-2)]">{label}</div>
      <div className="text-sm font-semibold mt-1" style={{ color: dim ? "var(--ink-1)" : accent }}>
        {value}
      </div>
      {sublabel && <div className="text-[10px] text-[var(--ink-2)] mt-1">{sublabel}</div>}
    </div>
  );
}
