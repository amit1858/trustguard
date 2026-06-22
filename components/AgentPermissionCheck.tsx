"use client";

import { useMemo } from "react";
import { checkAgentPermission, type PermissionResult } from "@/lib/permissionCheck";
import { getAgentById } from "@/lib/agentRegistry";
import type { GuardianDecision } from "@/lib/types";

const TRUST_TIER_COLORS: Record<string, string> = {
  Low: "#D97448",
  Medium: "#C9A36B",
  High: "#6FB089",
  System: "#C7B8DC",
};

const SENSITIVITY_COLORS: Record<string, string> = {
  Low: "#6FB089",
  Medium: "#C9A36B",
  High: "#D97448",
  Critical: "#B83A3A",
};

const AUTH_COLORS: Record<string, string> = {
  Allowed: "#6FB089",
  Restricted: "#D97448",
  "Not authorized": "#B83A3A",
};

const FINAL_RESULT_COLORS: Record<string, string> = {
  "Allowed to request": "#6FB089",
  "Requires Guardian approval": "#C9A36B",
  "Requires human review": "#D97448",
  "Not authorized": "#B83A3A",
};

function Pill({
  label,
  color,
}: {
  label: string;
  color: string;
}) {
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

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-2 border-b last:border-0"
         style={{ borderColor: "var(--border)" }}>
      <span className="text-[11px] text-[var(--ink-2)] w-44 shrink-0 pt-0.5">{label}</span>
      <div className="flex-1 text-[12px] text-[var(--ink-0)] flex flex-wrap items-center gap-2">
        {children}
      </div>
    </div>
  );
}

export default function AgentPermissionCheck({
  agentId,
  requestedAction,
  guardianDecision,
  sourceSystem,
  actionSensitivity,
  guardianRequired,
}: {
  agentId?: string;
  requestedAction?: string;
  guardianDecision?: GuardianDecision;
  sourceSystem?: string;
  actionSensitivity?: string;
  guardianRequired?: boolean;
}) {
  const result: PermissionResult | null = useMemo(() => {
    if (!agentId || !requestedAction) return null;
    return checkAgentPermission(agentId, requestedAction, guardianDecision);
  }, [agentId, requestedAction, guardianDecision]);

  const agent = useMemo(
    () => (agentId ? getAgentById(agentId) : undefined),
    [agentId],
  );

  if (!agentId || !requestedAction) {
    return (
      <div className="text-xs text-[var(--ink-2)] italic">
        No agent identity available for this event.
      </div>
    );
  }

  const finalColor = result
    ? FINAL_RESULT_COLORS[result.finalResult] ?? "#C9A36B"
    : "#8FA1B3";

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{ border: "1px solid var(--border)", background: "var(--bg-2)" }}
    >
      {/* Header strip */}
      <div
        className="px-4 py-2 flex items-center justify-between"
        style={{
          background: finalColor + "10",
          borderBottom: `1px solid ${finalColor}30`,
        }}
      >
        <span className="text-[10px] uppercase tracking-widest" style={{ color: finalColor }}>
          Agent Permission Check
        </span>
        {result && (
          <Pill label={result.finalResult} color={finalColor} />
        )}
      </div>

      <div className="px-4 py-3 flex flex-col">
        {/* Source Agent */}
        <Row label="Source agent">
          <span className="font-medium">{agent?.name ?? agentId}</span>
          {agent && (
            <>
              <Pill label={agent.type} color="#8FA1B3" />
              <Pill
                label={`Trust: ${agent.trustTier}`}
                color={TRUST_TIER_COLORS[agent.trustTier] ?? "#C9A36B"}
              />
            </>
          )}
        </Row>

        {/* Source System */}
        {sourceSystem && (
          <Row label="Source system">
            <span className="font-mono text-[11px]">{sourceSystem}</span>
          </Row>
        )}

        {/* Requested Permission */}
        <Row label="Requested permission">
          <span className="font-mono text-[11px]">{requestedAction}</span>
        </Row>

        {/* Action Sensitivity */}
        {actionSensitivity && (
          <Row label="Action sensitivity">
            <Pill
              label={actionSensitivity}
              color={SENSITIVITY_COLORS[actionSensitivity] ?? "#C9A36B"}
            />
          </Row>
        )}

        {/* Authorization level */}
        {result && (
          <Row label="Agent authorization">
            <Pill
              label={result.authorizationLevel}
              color={AUTH_COLORS[result.authorizationLevel] ?? "#C9A36B"}
            />
          </Row>
        )}

        {/* Guardian Required */}
        <Row label="Guardian required">
          {guardianRequired !== undefined ? (
            <Pill
              label={guardianRequired ? "Yes" : "No"}
              color={guardianRequired ? "#D97448" : "#6FB089"}
            />
          ) : result ? (
            <Pill
              label={result.requiresGuardianApproval ? "Yes" : "No"}
              color={result.requiresGuardianApproval ? "#D97448" : "#6FB089"}
            />
          ) : (
            <span className="text-[var(--ink-2)]">—</span>
          )}
        </Row>

        {/* Human approval */}
        {result && (
          <Row label="Human approval required">
            <Pill
              label={result.humanApprovalRequired ? "Yes" : "No"}
              color={result.humanApprovalRequired ? "#D97448" : "#6FB089"}
            />
            {guardianDecision && (
              <span className="text-[11px] text-[var(--ink-2)]">
                (Guardian: {guardianDecision.replace("_", " ")})
              </span>
            )}
          </Row>
        )}

        {/* Rationale */}
        {result && (
          <div className="mt-3 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
            <div className="text-[10px] uppercase tracking-wider text-[var(--ink-2)] mb-1">
              Rationale
            </div>
            <p className="text-[12px] text-[var(--ink-1)] leading-relaxed">
              {result.rationale}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
