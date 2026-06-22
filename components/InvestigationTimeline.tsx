"use client";

import { useMemo } from "react";
import type { CaseRecord, ReviewOutcome } from "@/lib/cases";
import { DECISION_COLORS } from "@/lib/cases";
import type { LedgerEvent } from "@/lib/decisionLedger";
import type { GuardianOutput } from "@/lib/types";

interface TimelineStep {
  key: string;
  dot: string; // color
  icon: string;
  label: string;
  sublabel?: string;
  timestamp?: string;
  status: "done" | "pending";
}

function fmtShort(iso: string | undefined): string | undefined {
  if (!iso) return undefined;
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function buildSteps(
  c: CaseRecord,
  guardian: GuardianOutput,
  caseEvents: LedgerEvent[],
  outcomes: ReviewOutcome[],
): TimelineStep[] {
  const assignEntry =
    (c.assignmentHistory ?? []).length > 0
      ? c.assignmentHistory[c.assignmentHistory.length - 1]
      : null;
  const assignEvent = caseEvents.find((e) => e.action === "assign");

  const firstEvidenceReq = (c.evidenceRequests ?? []).length > 0 ? c.evidenceRequests[0] : null;
  const evidenceEvent = caseEvents.find((e) => e.action === "request_evidence");

  const advResponse = (c.evidenceRequests ?? []).find(
    (r) => r.status === "received" || r.status === "accepted",
  );

  const escalateEvent = caseEvents.find((e) => e.action === "escalate_policy");
  const isEscalationCase =
    c.guardianDecision === "ESCALATE" || c.status === "Escalated to Policy";

  const latestOutcome = outcomes.length > 0 ? outcomes[0] : null;
  const assignedDone = c.owner !== "Unassigned" || !!assignEntry || !!assignEvent;

  const steps: TimelineStep[] = [
    {
      key: "guardian",
      dot: DECISION_COLORS[c.guardianDecision],
      icon: "⚙",
      label: `Guardian decision: ${guardian.decision}`,
      sublabel: `Risk ${guardian.riskScore} · ${guardian.riskLevel} · ${guardian.reasonCodes.slice(0, 2).join(", ")}`,
      timestamp: c.createdAt,
      status: "done",
    },
    {
      key: "created",
      dot: "#C9A36B",
      icon: "📋",
      label: "Case created — human review queued",
      sublabel: `${c.priority} priority · SLA ${c.sla}`,
      timestamp: c.createdAt,
      status: "done",
    },
    {
      key: "assigned",
      dot: assignedDone ? "#8FA1B3" : "#7F776B",
      icon: "👤",
      label: assignedDone
        ? `Assigned to ${c.owner !== "Unassigned" ? c.owner : assignEntry?.ownerName ?? "reviewer"}`
        : "Assigned to reviewer",
      sublabel: assignEntry
        ? `via ${assignEntry.source.replace("_", " ")} · ${assignEntry.ownerName}`
        : assignEvent
        ? `via manual assignment`
        : "Awaiting assignment",
      timestamp: assignEntry?.assignedAt ?? assignEvent?.timestamp,
      status: assignedDone ? "done" : "pending",
    },
    {
      key: "evidence_req",
      dot: firstEvidenceReq || evidenceEvent ? "#F59E2E" : "#7F776B",
      icon: "📄",
      label:
        firstEvidenceReq || evidenceEvent
          ? `Evidence requested (${(c.evidenceRequests ?? []).length} item${(c.evidenceRequests ?? []).length !== 1 ? "s" : ""})`
          : "Evidence requested",
      sublabel: firstEvidenceReq
        ? firstEvidenceReq.category.replace(/_/g, " ")
        : evidenceEvent
        ? "From audit ledger"
        : "Awaiting evidence request",
      timestamp: firstEvidenceReq?.requestedAt ?? evidenceEvent?.timestamp,
      status: firstEvidenceReq || evidenceEvent ? "done" : "pending",
    },
    {
      key: "adv_response",
      dot: advResponse ? "#6FB089" : "#7F776B",
      icon: "📩",
      label: advResponse ? "Advertiser response received" : "Awaiting advertiser response",
      sublabel: advResponse
        ? `${advResponse.category.replace(/_/g, " ")} — ${advResponse.status}`
        : "No response received yet",
      timestamp: advResponse?.updatedAt,
      status: advResponse ? "done" : "pending",
    },
  ];

  if (isEscalationCase) {
    steps.push({
      key: "policy_escalation",
      dot: escalateEvent ? "#D97448" : "#7F776B",
      icon: "⚖",
      label: escalateEvent
        ? "Escalated to policy specialist"
        : "Policy specialist escalation",
      sublabel: escalateEvent
        ? `by ${escalateEvent.actor}`
        : "Pending escalation to policy team",
      timestamp: escalateEvent?.timestamp,
      status: escalateEvent ? "done" : "pending",
    });
  }

  steps.push(
    {
      key: "review_outcome",
      dot: latestOutcome ? "#6FB089" : "#7F776B",
      icon: "✓",
      label: latestOutcome
        ? `Review outcome: ${latestOutcome.reviewerOutcome}`
        : "Review outcome added",
      sublabel: latestOutcome
        ? `by ${latestOutcome.reviewer} · ${new Date(latestOutcome.timestamp).toLocaleString()}`
        : "Awaiting reviewer decision",
      timestamp: latestOutcome?.timestamp,
      status: latestOutcome ? "done" : "pending",
    },
    {
      key: "enforcement",
      dot: latestOutcome ? "#C9A36B" : "#7F776B",
      icon: "🔒",
      label: latestOutcome
        ? `Final enforcement: ${latestOutcome.finalEnforcementAction}`
        : "Final enforcement action",
      sublabel: latestOutcome ? undefined : "Determined after review outcome",
      timestamp: latestOutcome?.timestamp,
      status: latestOutcome ? "done" : "pending",
    },
    {
      key: "closed",
      dot: c.status === "Closed" ? "#7F776B" : "#7F776B",
      icon: "✔",
      label: c.status === "Closed" ? "Case closed" : "Case closed",
      sublabel: c.status === "Closed" ? "Resolved" : "Open",
      timestamp: c.status === "Closed" ? c.updatedAt : undefined,
      status: c.status === "Closed" ? "done" : "pending",
    },
  );

  return steps;
}

export default function InvestigationTimeline({
  c,
  guardian,
  caseEvents,
  outcomes,
}: {
  c: CaseRecord;
  guardian: GuardianOutput;
  caseEvents: LedgerEvent[];
  outcomes: ReviewOutcome[];
}) {
  const steps = useMemo(
    () => buildSteps(c, guardian, caseEvents, outcomes),
    [c, guardian, caseEvents, outcomes],
  );

  return (
    <section className="glass rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm font-semibold">Investigation Timeline</div>
        <span className="text-[10px] uppercase tracking-wider text-[var(--ink-2)]">
          High-level summary · {steps.filter((s) => s.status === "done").length}/{steps.length} steps complete
        </span>
      </div>
      <ol className="relative border-l border-white/8 ml-3 pl-5 space-y-4">
        {steps.map((step) => (
          <li key={step.key} className="relative">
            <span
              className="absolute -left-[25px] top-1 w-3 h-3 rounded-full flex items-center justify-center text-[7px]"
              style={{
                background: step.status === "done" ? step.dot : "transparent",
                border: `2px solid ${step.dot}`,
                boxShadow: step.status === "done" ? `0 0 8px -2px ${step.dot}` : "none",
              }}
            />
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="min-w-0">
                <div
                  className="text-xs font-medium"
                  style={{ color: step.status === "done" ? "var(--ink-0)" : "var(--ink-2)" }}
                >
                  {step.label}
                </div>
                {step.sublabel && (
                  <div className="text-[11px] text-[var(--ink-2)] mt-0.5">{step.sublabel}</div>
                )}
              </div>
              {step.timestamp ? (
                <div className="text-[10px] text-[var(--ink-2)] tabular-nums shrink-0">
                  {fmtShort(step.timestamp)}
                </div>
              ) : (
                <div
                  className="text-[10px] tabular-nums shrink-0"
                  style={{ color: step.dot, opacity: 0.7 }}
                >
                  — pending
                </div>
              )}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
