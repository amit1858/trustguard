"use client";

import { useEffect, useMemo, useState } from "react";
import { SCENARIOS, getScenario } from "@/lib/scenarios";
import { runOrchestrator } from "@/lib/orchestratorEngine";
import { evaluateGuardian } from "@/lib/guardianEngine";
import { buildPrompt } from "@/lib/promptTemplates";
import type { BYOKConfig, GuardianOutput } from "@/lib/types";

import ArchitectureStrip from "@/components/ArchitectureStrip";
import ComparisonCard from "@/components/ComparisonCard";
import ScenarioTabs from "@/components/ScenarioTabs";
import OrchestratorPanel from "@/components/OrchestratorPanel";
import WorkerFindings from "@/components/WorkerFindings";
import GuardianPanel from "@/components/GuardianPanel";
import InterceptionMoment from "@/components/InterceptionMoment";
import ActionsColumns from "@/components/ActionsColumns";
import AuditTrail from "@/components/AuditTrail";
import WhyItMatters from "@/components/WhyItMatters";
import WhyTrustSafety from "@/components/WhyTrustSafety";
import ExecutiveSummaryCard from "@/components/ExecutiveSummaryCard";
import AudioOverviewCard from "@/components/AudioOverviewCard";
import ControlPlaneMetrics from "@/components/ControlPlaneMetrics";
import InsightCards from "@/components/InsightCards";
import ReadinessPanel from "@/components/ReadinessPanel";
import ExecutiveMetricsDashboard from "@/components/ExecutiveMetricsDashboard";
import CalibrationPanel from "@/components/CalibrationPanel";
import PolicyPressurePanel from "@/components/PolicyPressurePanel";
import AgentRiskLeaderboard from "@/components/AgentRiskLeaderboard";
import OperationalInsightCards from "@/components/OperationalInsightCards";
import { ProductionWarningBanner } from "@/components/EnvironmentSelector";
import QueueHealthStrip from "@/components/QueueHealthStrip";
import { usePersona } from "@/lib/persona";

export default function ControlPlaneView({
  byok,
  onOpenReviewQueue,
  onOpenPolicy,
  onOpenRuntimeEvents,
  initialScenarioId,
  onClearInitialScenario,
  onActiveScenarioChange,
}: {
  byok: BYOKConfig;
  onOpenReviewQueue: () => void;
  onOpenPolicy?: (id?: string) => void;
  onOpenRuntimeEvents?: () => void;
  initialScenarioId?: string | null;
  onClearInitialScenario?: () => void;
  onActiveScenarioChange?: (id: string) => void;
}) {
  const { meta: persona } = usePersona();
  const [scenarioId, setScenarioId] = useState(SCENARIOS[0].id);
  const [aiExplanation, setAiExplanation] = useState<string | undefined>();
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | undefined>();

  const scenario = useMemo(() => getScenario(scenarioId), [scenarioId]);
  const orchestrator = useMemo(() => runOrchestrator(scenario), [scenario]);
  const guardian: GuardianOutput = useMemo(
    () => evaluateGuardian(scenario, orchestrator, aiExplanation),
    [scenario, orchestrator, aiExplanation],
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset stale AI state when scenario changes
    setAiExplanation(undefined);
    setAiError(undefined);
    onActiveScenarioChange?.(scenarioId);
  }, [scenarioId, onActiveScenarioChange]);

  // Deep-link: switch scenario when caller passes one in (e.g. from URL or Executive Demo).
  useEffect(() => {
    if (!initialScenarioId) return;
    if (SCENARIOS.some((s) => s.id === initialScenarioId)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- consume one-shot init prop
      setScenarioId(initialScenarioId);
    }
    onClearInitialScenario?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialScenarioId]);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (byok.mode !== "byok" || !byok.apiKey || !byok.tasks.guardianExplanation) return;
      setAiLoading(true);
      setAiError(undefined);
      try {
        const prompt = buildPrompt("guardian_explanation", scenario, guardian);
        const res = await fetch("/api/ai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            provider: byok.provider,
            apiKey: byok.apiKey,
            modelName: byok.modelName,
            task: "guardian_explanation",
            prompt,
          }),
        });
        const j = await res.json();
        if (!res.ok || j.ok === false) throw new Error(j.error || "AI request failed");
        if (!cancelled) setAiExplanation(j.text);
      } catch (e) {
        if (!cancelled) {
          setAiError(e instanceof Error ? e.message : "AI request failed");
          setAiExplanation(undefined);
        }
      } finally {
        if (!cancelled) setAiLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenarioId, byok.mode, byok.apiKey, byok.provider, byok.modelName]);

  return (
    <div className="flex flex-col gap-6">
      <ProductionWarningBanner />

      <ExecutiveSummaryCard />

      <p className="-mt-2 text-xs italic text-[var(--ink-2)]">
        Operational narrative mirrors the queue: Guardian allows safe launches, restricts unsafe
        actions, and surfaces human review load live.
      </p>

      <QueueHealthStrip />

      <AudioOverviewCard />

      <div
        className="glass rounded-xl p-3 text-xs flex items-center gap-3"
        style={{ borderColor: "rgba(201, 163, 107, 0.3)" }}
      >
        <span className="pill text-[10px]" style={{ borderColor: "rgba(201, 163, 107, 0.5)", color: "#F4EFE7" }}>
          Persona: {persona.label}
        </span>
        <span className="text-[var(--ink-2)]">{persona.hint}</span>
      </div>

      <ArchitectureStrip />
      <ComparisonCard />
      <WhyTrustSafety />

      <ControlPlaneMetrics />

      {/* ── Phase 3D: Executive Metrics Dashboard ── */}
      <ExecutiveMetricsDashboard />

      {/* ── Phase 3D: Calibration Panel + Policy Pressure (2-col on lg) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <CalibrationPanel />
        <PolicyPressurePanel
          onOpenPolicy={onOpenPolicy ? (id) => onOpenPolicy(id) : undefined}
        />
      </div>

      {/* ── Phase 3D: Agent Risk Leaderboard ── */}
      <AgentRiskLeaderboard />

      <InsightCards
        onOpenPolicy={onOpenPolicy ? () => onOpenPolicy() : undefined}
        onOpenRuntimeEvents={onOpenRuntimeEvents}
      />

      {/* ── Phase 3D: Operational Insight Narratives ── */}
      <OperationalInsightCards
        onOpenPolicy={onOpenPolicy}
        onOpenRuntimeEvents={onOpenRuntimeEvents}
      />

      <div className="glass rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold">Scenario simulator</div>
          <div className="text-xs text-[var(--ink-2)]">
            Pick a scenario to see how Orchestrator → Worker Agents → Guardian decisions flow.
          </div>
        </div>
        <button
          onClick={onOpenReviewQueue}
          className="pill"
          style={{ borderColor: "rgba(201, 163, 107, 0.5)", color: "#F4EFE7" }}
        >
          → Open Review Queue
        </button>
      </div>

      <div id="section-scenarios">
        <ScenarioTabs current={scenarioId} onSelect={setScenarioId} />
      </div>

      <div id="section-interception">
        <InterceptionMoment scenario={scenario} guardian={guardian} />
      </div>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 flex flex-col gap-6" id="section-orchestrator">
          <OrchestratorPanel scenario={scenario} orchestrator={orchestrator} />
        </div>
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div id="section-guardian">
            <GuardianPanel
              scenario={scenario}
              guardian={guardian}
              aiAssisted={!!aiExplanation}
            />
            {aiLoading && (
              <div className="text-xs text-[var(--ink-2)] mt-2">Requesting AI explanation…</div>
            )}
            {aiError && (
              <div className="text-xs mt-2" style={{ color: "#fca5a5" }}>
                AI explanation unavailable — using deterministic kernel. ({aiError})
              </div>
            )}
          </div>
          <ActionsColumns guardian={guardian} />
          <div id="section-workers">
            <WorkerFindings findings={scenario.workerFindings} />
          </div>
        </div>
      </section>

      <div id="section-audit">
        <AuditTrail events={guardian.auditTrail} />
      </div>

      <ReadinessPanel />

      <WhyItMatters />
    </div>
  );
}
