"use client";

import { useState, useMemo } from "react";
import {
  AGENT_REGISTRY,
  getAgentById,
  getEventsInitiatedByAgent,
  getGuardianInterventionsForAgent,
  getBlockedActionsForAgent,
  type RegistryAgent,
  type TrustTier,
  type AgentStatus,
} from "@/lib/agentRegistry";
import { GOVERNANCE_RULES, type RuleSeverity } from "@/lib/governanceRules";
import { getRuntimeEvents } from "@/lib/runtimeEvents";
import CopyLinkButton from "@/components/CopyLinkButton";

const TRUST_TIER_COLORS: Record<TrustTier, string> = {
  Low: "#D97448",
  Medium: "#C9A36B",
  High: "#6FB089",
  System: "#C7B8DC",
};

const STATUS_COLORS: Record<AgentStatus, string> = {
  Active: "#6FB089",
  Limited: "#C9A36B",
  Disabled: "#B83A3A",
};

const SEVERITY_COLORS: Record<RuleSeverity, string> = {
  Advisory: "#C9A36B",
  Enforced: "#B83A3A",
};

const TYPE_COLORS: Record<string, string> = {
  Orchestrator: "#C7B8DC",
  Worker: "#8FA1B3",
  Optimization: "#D97448",
  "Review Copilot": "#6FB089",
  Guardian: "#F59E2E",
};

function Pill({ label, color }: { label: string; color: string }) {
  return (
    <span
      className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full"
      style={{
        color,
        background: color + "18",
        border: `1px solid ${color}55`,
      }}
    >
      {label}
    </span>
  );
}

function ActionList({
  title,
  items,
  color,
}: {
  title: string;
  items: string[];
  color: string;
}) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider mb-1.5" style={{ color }}>
        {title}
      </div>
      {items.length === 0 ? (
        <span className="text-[11px] text-[var(--ink-2)]">None</span>
      ) : (
        <ul className="space-y-1">
          {items.map((a) => (
            <li
              key={a}
              className="text-[11.5px] leading-snug font-mono"
              style={{ color: "var(--ink-1)" }}
            >
              · {a}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function AgentDetailDrawer({
  agent,
  onClose,
}: {
  agent: RegistryAgent;
  onClose: () => void;
}) {
  const allEvents = useMemo(() => getRuntimeEvents(), []);
  const agentEvents = useMemo(
    () => allEvents.filter((e) => e.sourceAgentId === agent.agentId),
    [allEvents, agent.agentId],
  );

  const interventions = useMemo(
    () =>
      agentEvents.filter(
        (e) =>
          e.currentStatus === "Intercepted" ||
          e.currentStatus === "Blocked" ||
          e.currentStatus === "Escalated",
      ),
    [agentEvents],
  );

  const trustColor = TRUST_TIER_COLORS[agent.trustTier];
  const statusColor = STATUS_COLORS[agent.status];

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0"
        onClick={onClose}
        style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(2px)" }}
      />
      <aside
        className="relative h-full w-full max-w-[720px] overflow-y-auto"
        style={{
          background: "linear-gradient(180deg, #1D1A16 0%, #151310 100%)",
          borderLeft: "1px solid var(--border-warm)",
        }}
      >
        {/* Sticky header */}
        <div
          className="sticky top-0 z-10 px-6 py-4 flex items-center justify-between"
          style={{ background: "rgba(13,12,10,0.95)", borderBottom: "1px solid var(--border)" }}
        >
          <div>
            <div className="section-title">Agent detail</div>
            <div className="section-heading mt-1">{agent.name}</div>
          </div>
          <div className="flex items-center gap-2">
            <CopyLinkButton
              state={{ view: "agent-governance", agent: agent.agentId }}
              label="Copy link"
            />
            <button onClick={onClose} className="btn btn-ghost">
              Close ✕
            </button>
          </div>
        </div>

        <div className="px-6 py-5 flex flex-col gap-6">
          {/* Identity overview */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Agent ID", value: agent.agentId },
              { label: "Type", value: agent.type, color: TYPE_COLORS[agent.type] },
              { label: "Trust tier", value: agent.trustTier, color: trustColor },
              { label: "Status", value: agent.status, color: statusColor },
              { label: "Owner", value: agent.owner },
              {
                label: "Last activity",
                value: new Date(agent.lastActivity).toLocaleString(),
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-lg p-3 border"
                style={{ borderColor: "var(--border)", background: "var(--bg-2)" }}
              >
                <div className="text-[10px] uppercase tracking-wider text-[var(--ink-2)]">
                  {item.label}
                </div>
                <div
                  className="text-[13px] font-medium mt-1"
                  style={{ color: item.color ?? "var(--ink-0)" }}
                >
                  {item.value}
                </div>
              </div>
            ))}
          </div>

          {/* Description */}
          <div>
            <div className="section-title mb-2">Description</div>
            <div
              className="rounded-lg p-4 text-[13px] text-[var(--ink-1)] leading-relaxed"
              style={{ background: "var(--bg-2)", border: "1px solid var(--border)" }}
            >
              {agent.description}
            </div>
          </div>

          {/* Action lists */}
          <div>
            <div className="section-title mb-3">Action authorization</div>
            <div
              className="rounded-lg p-4 flex flex-col gap-5"
              style={{ background: "var(--bg-2)", border: "1px solid var(--border)" }}
            >
              <ActionList
                title="Allowed actions"
                items={agent.allowedActions}
                color="#6FB089"
              />
              <ActionList
                title="Restricted actions"
                items={agent.restrictedActions}
                color="#D97448"
              />
              <ActionList
                title="Requires Guardian approval for"
                items={agent.requiresGuardianFor}
                color="#C9A36B"
              />
            </div>
          </div>

          {/* Recent events */}
          <div>
            <div className="section-title mb-2">
              Recent events from this agent ({agentEvents.length})
            </div>
            {agentEvents.length === 0 ? (
              <div
                className="rounded-lg p-4 text-xs text-[var(--ink-2)]"
                style={{ background: "var(--bg-2)", border: "1px solid var(--border)" }}
              >
                No events attributed to this agent in the current feed.
              </div>
            ) : (
              <div
                className="rounded-lg overflow-hidden"
                style={{ border: "1px solid var(--border)" }}
              >
                {agentEvents.map((e, i) => (
                  <div
                    key={e.eventId}
                    className="px-4 py-3 flex items-start justify-between gap-3"
                    style={{
                      background: i % 2 === 0 ? "var(--bg-2)" : "transparent",
                      borderBottom:
                        i < agentEvents.length - 1 ? "1px solid var(--border)" : "none",
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[12px] font-medium">{e.eventId}</span>
                        <Pill
                          label={e.currentStatus}
                          color={
                            e.currentStatus === "Blocked"
                              ? "#B83A3A"
                              : e.currentStatus === "Escalated"
                                ? "#D97448"
                                : e.currentStatus === "Allowed"
                                  ? "#6FB089"
                                  : e.currentStatus === "Intercepted"
                                    ? "#9B89B8"
                                    : "#8FA1B3"
                          }
                        />
                      </div>
                      <div className="text-[11px] text-[var(--ink-2)] mt-0.5">
                        {e.requestedAction.slice(0, 70)}
                      </div>
                      <div className="text-[10px] text-[var(--ink-2)] mt-0.5">
                        {e.advertiser} · {e.vertical} · {e.market}
                      </div>
                    </div>
                    <CopyLinkButton
                      state={{ view: "runtime-events", event: e.eventId }}
                      label="⎘"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Guardian interventions */}
          <div>
            <div className="section-title mb-2">
              Guardian interventions ({interventions.length})
            </div>
            {interventions.length === 0 ? (
              <div
                className="rounded-lg p-4 text-xs text-[var(--ink-2)]"
                style={{ background: "var(--bg-2)", border: "1px solid var(--border)" }}
              >
                No Guardian interventions recorded for this agent.
              </div>
            ) : (
              <div
                className="rounded-lg overflow-hidden"
                style={{ border: "1px solid var(--border)" }}
              >
                {interventions.map((e, i) => (
                  <div
                    key={e.eventId}
                    className="px-4 py-3"
                    style={{
                      background: i % 2 === 0 ? "var(--bg-2)" : "transparent",
                      borderBottom:
                        i < interventions.length - 1 ? "1px solid var(--border)" : "none",
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] font-medium">{e.eventId}</span>
                      <Pill
                        label={e.currentStatus}
                        color={
                          e.currentStatus === "Blocked"
                            ? "#B83A3A"
                            : e.currentStatus === "Escalated"
                              ? "#D97448"
                              : "#9B89B8"
                        }
                      />
                    </div>
                    <div className="text-[11px] text-[var(--ink-2)] mt-0.5">
                      {e.requestedAction.slice(0, 80)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}

function GovernanceRuleCard({ rule }: { rule: (typeof GOVERNANCE_RULES)[0] }) {
  const affectedAgents = rule.affectedAgentIds
    .map((id) => getAgentById(id)?.name ?? id)
    .join(", ");

  const color = SEVERITY_COLORS[rule.severity];

  return (
    <div
      className="rounded-xl p-5 flex flex-col gap-3"
      style={{ background: "var(--bg-2)", border: `1px solid ${color}40` }}
    >
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-mono text-[var(--ink-2)]">{rule.id}</span>
          <Pill label={rule.severity} color={color} />
        </div>
      </div>
      <div className="text-[14px] font-semibold text-[var(--ink-0)]">{rule.title}</div>
      <p className="text-[12px] text-[var(--ink-1)] leading-relaxed">{rule.description}</p>
      <div className="text-[11px] text-[var(--ink-2)]">
        Affects:{" "}
        <span className="text-[var(--ink-1)] font-medium">{affectedAgents}</span>
      </div>
    </div>
  );
}

export default function AgentGovernanceView({
  initialAgentId,
  onClearInitialAgent,
}: {
  initialAgentId?: string | null;
  onClearInitialAgent?: () => void;
}) {
  const [selectedAgent, setSelectedAgent] = useState<RegistryAgent | null>(() => {
    if (initialAgentId) {
      const found = getAgentById(initialAgentId);
      onClearInitialAgent?.();
      return found ?? null;
    }
    return null;
  });

  const agentRows = useMemo(() => {
    return AGENT_REGISTRY.map((a) => ({
      ...a,
      eventsInitiated: getEventsInitiatedByAgent(a.agentId),
      guardianInterventions: getGuardianInterventionsForAgent(a.agentId),
      blockedActions: getBlockedActionsForAgent(a.agentId),
    }));
  }, []);

  return (
    <div className="flex flex-col gap-6">
      {/* Narrative header */}
      <section className="glass rounded-xl p-5">
        <div className="section-title mb-1">Why agent identity matters</div>
        <div className="section-heading mt-1 mb-3">Agent Governance</div>
        <p className="text-[13px] text-[var(--ink-1)] leading-relaxed max-w-4xl">
          In agentic ads workflows, different agents carry different risk profiles. A Budget
          Optimization Agent with unchecked authority can silently 4× a spend cap; an Appeal
          Resolution Agent that auto-approves restricted-vertical submissions bypasses critical
          compliance gates. TrustGuard maintains a <strong>registry of every agent</strong> that
          proposes actions, enforces per-agent authorization rules, and routes high-sensitivity
          requests through the Guardian before execution. This view exposes the full governance
          posture — who proposed what, how Guardian intervened, and which rules govern each agent.
        </p>
      </section>

      {/* Agents table */}
      <section className="glass rounded-xl p-5">
        <div className="flex items-baseline justify-between mb-4">
          <div>
            <div className="section-title">Agent Registry</div>
            <div className="section-heading mt-1">All registered agents in TrustGuard</div>
          </div>
          <span className="pill pill-accent">{AGENT_REGISTRY.length} agents</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] uppercase tracking-wider text-[var(--ink-2)] text-left">
                <th className="py-2 pr-3 font-medium">Name</th>
                <th className="py-2 pr-3 font-medium">Type</th>
                <th className="py-2 pr-3 font-medium">Trust tier</th>
                <th className="py-2 pr-3 font-medium">Status</th>
                <th className="py-2 pr-3 font-medium">Owner</th>
                <th className="py-2 pr-3 font-medium">Last activity</th>
                <th className="py-2 pr-3 font-medium text-right">Events</th>
                <th className="py-2 pr-3 font-medium text-right">Interventions</th>
                <th className="py-2 pr-3 font-medium text-right">Blocked</th>
              </tr>
            </thead>
            <tbody>
              {agentRows.map((a) => {
                const trustColor = TRUST_TIER_COLORS[a.trustTier];
                const statusColor = STATUS_COLORS[a.status];
                return (
                  <tr
                    key={a.agentId}
                    onClick={() => setSelectedAgent(a)}
                    className="border-t cursor-pointer hover:bg-white/[0.02]"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <td className="py-2.5 pr-3">
                      <div className="text-[13px] font-medium">{a.name}</div>
                      <div className="text-[10px] text-[var(--ink-2)] font-mono">{a.agentId}</div>
                    </td>
                    <td className="py-2.5 pr-3">
                      <Pill label={a.type} color={TYPE_COLORS[a.type] ?? "#8FA1B3"} />
                    </td>
                    <td className="py-2.5 pr-3">
                      <Pill label={a.trustTier} color={trustColor} />
                    </td>
                    <td className="py-2.5 pr-3">
                      <Pill label={a.status} color={statusColor} />
                    </td>
                    <td className="py-2.5 pr-3 text-[12px] text-[var(--ink-1)]">{a.owner}</td>
                    <td className="py-2.5 pr-3 text-[11px] text-[var(--ink-2)]">
                      {new Date(a.lastActivity).toLocaleDateString()}
                    </td>
                    <td className="py-2.5 pr-3 text-right text-[13px] font-medium">
                      {a.eventsInitiated}
                    </td>
                    <td className="py-2.5 pr-3 text-right">
                      <span
                        className="text-[13px] font-medium"
                        style={{ color: a.guardianInterventions > 0 ? "#D97448" : "var(--ink-2)" }}
                      >
                        {a.guardianInterventions}
                      </span>
                    </td>
                    <td className="py-2.5 pr-3 text-right">
                      <span
                        className="text-[13px] font-medium"
                        style={{ color: a.blockedActions > 0 ? "#B83A3A" : "var(--ink-2)" }}
                      >
                        {a.blockedActions}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Governance rules */}
      <section className="glass rounded-xl p-5">
        <div className="flex items-baseline justify-between mb-4">
          <div>
            <div className="section-title">Governance Rules</div>
            <div className="section-heading mt-1">
              Per-agent enforcement policies active in TrustGuard
            </div>
          </div>
          <span className="pill" style={{ borderColor: "#B83A3A40", color: "#B83A3A" }}>
            {GOVERNANCE_RULES.filter((r) => r.severity === "Enforced").length} enforced
          </span>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {GOVERNANCE_RULES.map((rule) => (
            <GovernanceRuleCard key={rule.id} rule={rule} />
          ))}
        </div>
      </section>

      {/* Agent detail drawer */}
      {selectedAgent && (
        <AgentDetailDrawer
          agent={selectedAgent}
          onClose={() => setSelectedAgent(null)}
        />
      )}
    </div>
  );
}
