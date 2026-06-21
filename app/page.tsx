"use client";

import { useEffect, useRef, useState } from "react";
import type { BYOKConfig } from "@/lib/types";
import { PersonaProvider, usePersona } from "@/lib/persona";
import { EnvProvider } from "@/lib/environment";
import { ToastProvider } from "@/components/Toast";
import { parseDeepLink, syncDeepLink, type DeepLinkState } from "@/lib/deepLinks";

import Header from "@/components/Header";
import AppShell, { type ViewId } from "@/components/AppShell";
import BYOKControl, { type ByokStatus } from "@/components/BYOKControl";
import WalkthroughButton from "@/components/WalkthroughButton";
import PersonaSwitcher from "@/components/PersonaSwitcher";
import EnvironmentSelector from "@/components/EnvironmentSelector";
import ExecutiveDemoButton from "@/components/ExecutiveDemoButton";
import ResetDemoButton from "@/components/ResetDemoButton";

import ControlPlaneView from "@/components/views/ControlPlaneView";
import ReviewQueueView from "@/components/views/ReviewQueueView";
import PolicyConsoleView from "@/components/views/PolicyConsoleView";
import SimulationLabView from "@/components/views/SimulationLabView";
import RuntimeEventsView from "@/components/views/RuntimeEventsView";
import ConnectorsView from "@/components/views/ConnectorsView";
import AuditLogView from "@/components/views/AuditLogView";
import BYOKSettingsView from "@/components/views/BYOKSettingsView";

const DEFAULT_BYOK: BYOKConfig = {
  mode: "demo",
  provider: "openai",
  apiKey: "",
  modelName: "gpt-4o-mini",
  tasks: { workerFindings: false, guardianExplanation: true, riskSummary: false },
};

export default function Home() {
  return (
    <PersonaProvider>
      <EnvProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </EnvProvider>
    </PersonaProvider>
  );
}

const VALID_VIEWS: ViewId[] = [
  "control-plane",
  "review-queue",
  "policy-console",
  "simulation-lab",
  "runtime-events",
  "connectors",
  "audit-log",
  "byok-settings",
];

function App() {
  const { meta } = usePersona();
  const [view, setView] = useState<ViewId>(meta.focusView);
  const [byok, setByok] = useState<BYOKConfig>(DEFAULT_BYOK);
  const [walkthroughOpen, setWalkthroughOpen] = useState(false);
  const [executiveOpen, setExecutiveOpen] = useState(false);
  const [aiError, setAiError] = useState<string | undefined>();
  const [aiLoading, setAiLoading] = useState(false);
  const [aiConnected, setAiConnected] = useState(false);
  const [initialCaseId, setInitialCaseId] = useState<string | null>(null);
  const [initialEventId, setInitialEventId] = useState<string | null>(null);
  const [initialScenarioId, setInitialScenarioId] = useState<string | null>(null);
  const personaInitOverride = useRef(false);

  // Parse deep link on first mount — overrides persona's focusView.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const parsed = parseDeepLink(window.location.search);
    if (parsed.view && VALID_VIEWS.includes(parsed.view)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot hydration from URL on mount
      setView(parsed.view);
      personaInitOverride.current = true;
    }
    if (parsed.case) setInitialCaseId(parsed.case);
    if (parsed.event) setInitialEventId(parsed.event);
    if (parsed.scenario) setInitialScenarioId(parsed.scenario);
  }, []);

  // Keep URL in sync with current view (without polluting history).
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = parseDeepLink(window.location.search);
    const next: DeepLinkState = { view };
    // Preserve case/event/scenario when relevant to the active view.
    if (view === "review-queue" && params.case) next.case = params.case;
    if (view === "runtime-events" && params.event) next.event = params.event;
    if (view === "control-plane" && params.scenario) next.scenario = params.scenario;
    syncDeepLink(next);
  }, [view]);

  // Whenever persona changes (after first mount), jump to that persona's focus view
  // — unless a deep link has already chosen a view on initial load.
  useEffect(() => {
    if (personaInitOverride.current) {
      personaInitOverride.current = false;
      return;
    }
    setView(meta.focusView);
  }, [meta.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const byokStatus: ByokStatus =
    byok.mode === "demo" ? "demo" : aiError ? "error" : aiConnected ? "connected" : "demo";

  async function testByok() {
    if (byok.mode !== "byok" || !byok.apiKey) return;
    setAiLoading(true);
    setAiError(undefined);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: byok.provider,
          apiKey: byok.apiKey,
          modelName: byok.modelName,
          task: "guardian_explanation",
          prompt: "Test connection. Reply with 'ok'.",
        }),
      });
      const j = await res.json();
      if (!res.ok || j.ok === false) throw new Error(j.error || "AI request failed");
      setAiConnected(true);
    } catch (e) {
      setAiConnected(false);
      setAiError(e instanceof Error ? e.message : "AI request failed");
    } finally {
      setAiLoading(false);
    }
  }

  function openCaseInReviewQueue(caseId: string) {
    setInitialCaseId(caseId);
    setView("review-queue");
    syncDeepLink({ view: "review-queue", case: caseId });
  }

  function handleDeepNavigate(link: DeepLinkState) {
    if (link.case) setInitialCaseId(link.case);
    if (link.event) setInitialEventId(link.event);
    if (link.scenario) setInitialScenarioId(link.scenario);
    if (link.view && VALID_VIEWS.includes(link.view)) {
      setView(link.view);
      syncDeepLink(link);
    }
  }

  return (
    <AppShell current={view} onNavigate={setView}>
      <main className="mx-auto max-w-[1400px] px-6 py-6 flex flex-col gap-6">
        <Header
          rightSlot={
            <div className="flex flex-col md:flex-row gap-2 items-stretch md:items-center flex-wrap">
              <EnvironmentSelector />
              <PersonaSwitcher />
              <ExecutiveDemoButton
                open={executiveOpen}
                onOpen={() => setExecutiveOpen(true)}
                onClose={() => setExecutiveOpen(false)}
                onNavigate={handleDeepNavigate}
              />
              <WalkthroughButton onClick={() => setWalkthroughOpen(true)} />
              <ResetDemoButton />
              <BYOKControl
                byok={byok}
                setByok={setByok}
                status={byokStatus}
                errorMessage={aiError}
                onTest={testByok}
                testing={aiLoading}
              />
            </div>
          }
        />

        {view === "control-plane" && (
          <ControlPlaneView
            byok={byok}
            walkthroughOpen={walkthroughOpen}
            setWalkthroughOpen={setWalkthroughOpen}
            onOpenReviewQueue={() => setView("review-queue")}
            onOpenPolicy={() => setView("policy-console")}
            onOpenRuntimeEvents={() => setView("runtime-events")}
            initialScenarioId={initialScenarioId}
            onClearInitialScenario={() => setInitialScenarioId(null)}
          />
        )}

        {view === "review-queue" && (
          <ReviewQueueView
            initialCaseId={initialCaseId}
            onClearInitial={() => setInitialCaseId(null)}
          />
        )}

        {view === "policy-console" && <PolicyConsoleView />}
        {view === "simulation-lab" && <SimulationLabView />}
        {view === "runtime-events" && (
          <RuntimeEventsView
            onOpenCase={openCaseInReviewQueue}
            initialEventId={initialEventId}
            onClearInitialEvent={() => setInitialEventId(null)}
          />
        )}
        {view === "connectors" && <ConnectorsView />}
        {view === "audit-log" && <AuditLogView onOpenCase={openCaseInReviewQueue} />}
        {view === "byok-settings" && (
          <BYOKSettingsView
            byok={byok}
            setByok={setByok}
            status={byokStatus}
            errorMessage={aiError}
            onTest={testByok}
            testing={aiLoading}
          />
        )}

        <footer className="text-center text-xs text-[var(--ink-2)] py-6">
          TrustGuard prototype · Deterministic policy kernel governs final decisions. BYOK is optional.
          Guardian decisions are immutable; operator actions add review outcomes only.
        </footer>
      </main>
    </AppShell>
  );
}
