"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getRuntimeEvents,
  getRuntimeEventDetail,
  RUNTIME_STATUS_COLORS,
  type RuntimeEvent,
  type RuntimeEventStatus,
} from "@/lib/runtimeEvents";
import { DECISION_COLORS } from "@/lib/cases";
import { ProductionWarningBanner } from "@/components/EnvironmentSelector";
import CopyLinkButton from "@/components/CopyLinkButton";

const STATUS_FILTERS: ("All" | RuntimeEventStatus)[] = [
  "All",
  "New",
  "Evaluated",
  "Intercepted",
  "Allowed",
  "Blocked",
  "Escalated",
];

export default function RuntimeEventsView({
  onOpenCase,
  initialEventId,
  onClearInitialEvent,
}: {
  onOpenCase?: (caseId: string) => void;
  initialEventId?: string | null;
  onClearInitialEvent?: () => void;
}) {
  const events = useMemo(() => getRuntimeEvents(), []);
  const [filter, setFilter] = useState<(typeof STATUS_FILTERS)[number]>("All");
  const [selected, setSelected] = useState<RuntimeEvent | null>(null);

  // Deep-link: auto-open drawer when a matching event id is supplied.
  useEffect(() => {
    if (!initialEventId) return;
    const match = events.find((e) => e.eventId === initialEventId);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- consume one-shot init prop
    if (match) setSelected(match);
    onClearInitialEvent?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialEventId, events]);


  const filtered = useMemo(
    () =>
      filter === "All" ? events : events.filter((e) => e.currentStatus === filter),
    [events, filter],
  );

  return (
    <div className="flex flex-col gap-4">
      <ProductionWarningBanner />

      <section className="glass rounded-xl p-5">
        <div className="flex items-baseline justify-between mb-1 flex-wrap gap-3">
          <div>
            <div className="section-title">Runtime Events</div>
            <div className="section-heading mt-1">
              Incoming agentic ads events evaluated by Guardian
            </div>
          </div>
          <div className="text-[11px] text-[var(--ink-2)] max-w-md">
            TrustGuard evaluates proposed agent actions before execution. Each event
            below was offered to Guardian and can only proceed if the decision allows it.
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 mt-4">
          {STATUS_FILTERS.map((s) => {
            const active = s === filter;
            const color = s === "All" ? "#F59E2E" : RUNTIME_STATUS_COLORS[s as RuntimeEventStatus];
            return (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className="text-[11px] px-3 py-1 rounded-full transition"
                style={{
                  color: active ? "#F4EFE7" : color,
                  background: active ? color + "26" : "transparent",
                  border: `1px solid ${active ? color : color + "55"}`,
                }}
              >
                {s}
              </button>
            );
          })}
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] uppercase tracking-wider text-[var(--ink-2)] text-left">
                <th className="py-2 pr-3 font-medium">Event</th>
                <th className="py-2 pr-3 font-medium">Source agent</th>
                <th className="py-2 pr-3 font-medium">Advertiser</th>
                <th className="py-2 pr-3 font-medium">Action</th>
                <th className="py-2 pr-3 font-medium">Market</th>
                <th className="py-2 pr-3 font-medium">Risk</th>
                <th className="py-2 pr-3 font-medium">Status</th>
                <th className="py-2 pr-3 font-medium">Case</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => {
                const sc = RUNTIME_STATUS_COLORS[e.currentStatus];
                return (
                  <tr
                    key={e.eventId}
                    onClick={() => setSelected(e)}
                    className="border-t cursor-pointer hover:bg-white/[0.02]"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <td className="py-2.5 pr-3">
                      <div className="text-[13px] font-medium">{e.eventId}</div>
                      <div className="text-[10px] text-[var(--ink-2)]">
                        {new Date(e.timestamp).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="py-2.5 pr-3 text-[12px] text-[var(--ink-1)]">
                      <div>{e.sourceAgent}</div>
                      <div className="text-[10px] text-[var(--ink-2)]">{e.sourceSystem}</div>
                    </td>
                    <td className="py-2.5 pr-3 text-[12px]">
                      <div>{e.advertiser}</div>
                      <div className="text-[10px] text-[var(--ink-2)]">{e.vertical}</div>
                    </td>
                    <td className="py-2.5 pr-3 text-[12px] text-[var(--ink-1)] max-w-[260px]">
                      {e.requestedAction}
                    </td>
                    <td className="py-2.5 pr-3 text-[12px] text-[var(--ink-1)]">
                      {e.market}
                    </td>
                    <td className="py-2.5 pr-3 text-[11px] uppercase tracking-wider text-[var(--ink-1)]">
                      {e.riskPreview}
                    </td>
                    <td className="py-2.5 pr-3">
                      <span
                        className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full"
                        style={{
                          color: sc,
                          background: sc + "18",
                          border: `1px solid ${sc}55`,
                        }}
                      >
                        {e.currentStatus}
                      </span>
                    </td>
                    <td className="py-2.5 pr-3 text-[11px]">
                      {e.linkedCaseId ? (
                        <button
                          onClick={(ev) => {
                            ev.stopPropagation();
                            onOpenCase?.(e.linkedCaseId!);
                          }}
                          className="text-[var(--accent)] hover:underline"
                        >
                          {e.linkedCaseId}
                        </button>
                      ) : (
                        <span className="text-[var(--ink-2)]">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-xs text-[var(--ink-2)]">
                    No events match this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <InterceptionApiPanel />

      {selected && (
        <EventDetailDrawer
          event={selected}
          onClose={() => setSelected(null)}
          onOpenCase={onOpenCase}
        />
      )}
    </div>
  );
}

function InterceptionApiPanel() {
  const sampleRequest = {
    eventId: "EVT-1006",
    sourceAgent: {
      name: "Budget Optimization Agent v2.1",
      system: "ads-orchestrator/optimization",
    },
    requestedAction: "Increase budget by 4x and expand targeting",
    advertiserContext: {
      name: "QuickWin Media",
      vertical: "Lead Generation",
      market: "United States",
    },
    campaignContext: {
      campaign: "quickwin-media-q3-2026",
      monthlyBudget: 80000,
      certified: true,
    },
    workerFindings: [
      {
        agent: "Fraud & Risk Screening Agent",
        status: "Fail",
        confidence: 0.92,
        summary: "Linked-account risk and abnormal traffic pattern.",
      },
    ],
    proposedExecution: {
      target: "ads-orchestrator/optimization",
      actions: ["Apply 4x budget increase", "Expand targeting to lookalike+3"],
    },
  };
  const sampleResponse = {
    eventId: "EVT-1006",
    guardianDecision: "ESCALATE",
    riskScore: 72,
    reasonCodes: ["LINKED_ACCOUNT_RISK", "ABNORMAL_TRAFFIC", "PAYMENT_CHANGE"],
    matchedPolicies: [
      { policyId: "POL-RSK-014", title: "Suspicious budget expansion", severity: "high" },
    ],
    allowedActions: ["Hold budget at current cap", "Open review case"],
    blockedActions: ["Apply 4x budget increase", "Expand targeting"],
    humanReviewRequired: true,
    auditEventId: "AUDIT-EVT-1006",
  };

  return (
    <section className="glass rounded-xl p-5">
      <div className="flex items-baseline justify-between mb-1 flex-wrap gap-2">
        <div>
          <div className="section-title">Guardian Interception API</div>
          <div className="section-heading mt-1">Contract: request and response</div>
        </div>
        <span className="pill pill-accent">contract preview</span>
      </div>
      <div className="text-xs text-[var(--ink-1)] mt-1 mb-4 max-w-3xl">
        This prototype uses mock events, but the contract below shows how TrustGuard could
        be placed between agentic workflow orchestration and execution APIs. Every proposed
        action would route through Guardian and only proceed when the decision allows it.
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <JsonBlock title="POST /guardian/evaluate · request" payload={sampleRequest} accent="#8FA1B3" />
        <JsonBlock title="200 OK · response" payload={sampleResponse} accent="#F59E2E" />
      </div>
    </section>
  );
}

function JsonBlock({
  title,
  payload,
  accent,
}: {
  title: string;
  payload: object;
  accent: string;
}) {
  return (
    <div
      className="rounded-lg border overflow-hidden"
      style={{ borderColor: accent + "55", background: "var(--bg-2)" }}
    >
      <div
        className="px-3 py-2 text-[10px] uppercase tracking-wider"
        style={{ color: accent, background: accent + "10", borderBottom: `1px solid ${accent}33` }}
      >
        {title}
      </div>
      <pre className="text-[11px] leading-relaxed p-3 overflow-x-auto text-[var(--ink-1)]">
{JSON.stringify(payload, null, 2)}
      </pre>
    </div>
  );
}

function EventDetailDrawer({
  event,
  onClose,
  onOpenCase,
}: {
  event: RuntimeEvent;
  onClose: () => void;
  onOpenCase?: (caseId: string) => void;
}) {
  const detail = getRuntimeEventDetail(event);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0"
        onClick={onClose}
        style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(2px)" }}
      />
      <aside
        className="relative h-full w-full max-w-[760px] overflow-y-auto"
        style={{
          background: "linear-gradient(180deg, #1D1A16 0%, #151310 100%)",
          borderLeft: "1px solid var(--border-warm)",
        }}
      >
        <div className="sticky top-0 z-10 px-6 py-4 flex items-center justify-between"
             style={{ background: "rgba(13,12,10,0.95)", borderBottom: "1px solid var(--border)" }}>
          <div>
            <div className="section-title">Runtime event</div>
            <div className="section-heading mt-1">{event.eventId} · {event.requestedAction}</div>
          </div>
          <div className="flex items-center gap-2">
            <CopyLinkButton state={{ view: "runtime-events", event: event.eventId }} label="Copy link" />
            <button onClick={onClose} className="btn btn-ghost">Close ✕</button>
          </div>        </div>

        <div className="px-6 py-5 flex flex-col gap-5">
          <div
            className="rounded-lg p-3 text-xs"
            style={{
              background: "rgba(245, 158, 46, 0.08)",
              border: "1px solid rgba(245, 158, 46, 0.32)",
              color: "#F4EFE7",
            }}
          >
            TrustGuard evaluates proposed agent actions before execution. The event can
            proceed only if the Guardian decision allows it.
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Meta label="Source agent" value={event.sourceAgent} />
            <Meta label="Source system" value={event.sourceSystem} />
            <Meta label="Advertiser" value={event.advertiser} />
            <Meta label="Campaign" value={event.campaign} />
            <Meta label="Market" value={event.market} />
            <Meta label="Vertical" value={event.vertical} />
            <Meta label="Timestamp" value={new Date(event.timestamp).toLocaleString()} />
            <Meta
              label="Status"
              value={event.currentStatus}
              valueColor={RUNTIME_STATUS_COLORS[event.currentStatus]}
            />
          </div>

          <Section title="Proposed action">
            <div className="text-sm text-[var(--ink-0)]">{event.requestedAction}</div>
          </Section>

          {!detail && (
            <div
              className="rounded-lg p-4 text-xs"
              style={{
                background: "var(--bg-2)",
                border: "1px dashed var(--border)",
                color: "var(--ink-1)",
              }}
            >
              This event is still in the queue (status: <strong>{event.currentStatus}</strong>).
              Guardian has not produced a decision yet. The orchestrator plan and worker findings
              will appear here once the kernel runs.
            </div>
          )}

          {detail && (
            <>
              <Section title="Orchestrator plan summary">
                <div className="text-[12px] text-[var(--ink-1)] mb-2">
                  <span className="text-[var(--ink-2)]">Goal:</span> {detail.orchestrator.plan.goal}
                </div>
                <ol className="space-y-1.5">
                  {detail.orchestrator.plan.steps.map((s) => (
                    <li key={s.step} className="flex gap-3 text-[12px]">
                      <span className="text-[var(--ink-2)] w-5 shrink-0">{s.step}.</span>
                      <span className="font-medium text-[var(--ink-0)]/90 w-56 shrink-0">
                        {s.agentName}
                      </span>
                      <span className="text-[var(--ink-1)]">{s.intent}</span>
                    </li>
                  ))}
                </ol>
              </Section>

              <Section title="Worker-agent findings">
                <ul className="space-y-1.5">
                  {detail.scenario.workerFindings.map((f) => (
                    <li key={f.agentId} className="text-[12px] flex gap-3">
                      <span className="font-medium w-56 shrink-0">{f.agentName}</span>
                      <span
                        className="text-[10px] uppercase tracking-wider w-16 shrink-0"
                        style={{
                          color:
                            f.status === "pass"
                              ? "#6FB089"
                              : f.status === "warning"
                                ? "#F59E2E"
                                : "#B83A3A",
                        }}
                      >
                        {f.status}
                      </span>
                      <span className="text-[var(--ink-1)]">{f.summary}</span>
                    </li>
                  ))}
                </ul>
              </Section>

              <Section title="Guardian evaluation">
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <span
                    className="text-[11px] uppercase tracking-wider px-2 py-0.5 rounded-full"
                    style={{
                      color: DECISION_COLORS[detail.guardian.decision],
                      background: DECISION_COLORS[detail.guardian.decision] + "18",
                      border: `1px solid ${DECISION_COLORS[detail.guardian.decision]}55`,
                    }}
                  >
                    {detail.guardian.decision.replace("_", " ")}
                  </span>
                  <span className="text-[11px] text-[var(--ink-1)]">
                    Risk {detail.guardian.riskScore}/100 ·{" "}
                    {detail.guardian.riskLevel.toUpperCase()}
                  </span>
                  {detail.guardian.humanReviewRequired && (
                    <span className="pill">⚑ Human review</span>
                  )}
                </div>
                <p className="text-[12px] text-[var(--ink-1)] leading-relaxed">
                  {detail.guardian.explanation}
                </p>
              </Section>

              <Section title="Policy interception">
                <div className="text-[12px] text-[var(--ink-1)]">
                  Guardian intercepted the proposed action and produced{" "}
                  <strong style={{ color: "#F4EFE7" }}>
                    {detail.guardian.allowedActions.length}
                  </strong>{" "}
                  allowed action(s) and{" "}
                  <strong style={{ color: "#F4EFE7" }}>
                    {detail.guardian.blockedActions.length}
                  </strong>{" "}
                  blocked action(s).
                </div>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <ListBox title="Allowed" items={detail.guardian.allowedActions} color="#6FB089" />
                  <ListBox title="Blocked" items={detail.guardian.blockedActions} color="#B83A3A" />
                </div>
              </Section>

              {event.linkedCaseId && (
                <Section title="Linked review case">
                  <button
                    onClick={() => onOpenCase?.(event.linkedCaseId!)}
                    className="btn btn-primary"
                  >
                    Open {event.linkedCaseId} →
                  </button>
                </Section>
              )}

              <Section title="Sample API payloads">
                <div className="grid grid-cols-1 gap-3">
                  <JsonBlock
                    title="POST /guardian/evaluate · request"
                    payload={detail.apiRequest}
                    accent="#8FA1B3"
                  />
                  <JsonBlock
                    title="200 OK · response"
                    payload={detail.apiResponse}
                    accent="#F59E2E"
                  />
                </div>
              </Section>
            </>
          )}
        </div>
      </aside>
    </div>
  );
}

function Meta({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <div
      className="rounded-lg p-3 border"
      style={{ borderColor: "var(--border)", background: "var(--bg-2)" }}
    >
      <div className="text-[10px] uppercase tracking-wider text-[var(--ink-2)]">{label}</div>
      <div
        className="text-[13px] font-medium mt-1"
        style={{ color: valueColor ?? "var(--ink-0)" }}
      >
        {value}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="section-title mb-2">{title}</div>
      <div
        className="rounded-lg p-4"
        style={{ background: "var(--bg-2)", border: "1px solid var(--border)" }}
      >
        {children}
      </div>
    </section>
  );
}

function ListBox({ title, items, color }: { title: string; items: string[]; color: string }) {
  return (
    <div className="rounded-lg p-3" style={{ background: "rgba(13,12,10,0.5)", border: `1px solid ${color}40` }}>
      <div className="text-[10px] uppercase tracking-wider mb-1.5" style={{ color }}>
        {title}
      </div>
      <ul className="space-y-1">
        {items.length === 0 && (
          <li className="text-[11px] text-[var(--ink-2)]">—</li>
        )}
        {items.map((a) => (
          <li key={a} className="text-[11.5px] text-[var(--ink-1)] leading-snug">
            • {a}
          </li>
        ))}
      </ul>
    </div>
  );
}
