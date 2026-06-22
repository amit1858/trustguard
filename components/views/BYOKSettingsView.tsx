"use client";

import BYOKControl, { type ByokStatus } from "@/components/BYOKControl";
import type { BYOKConfig } from "@/lib/types";

export default function BYOKSettingsView({
  byok,
  setByok,
  status,
  errorMessage,
  technicalDetail,
  onTest,
  testing,
}: {
  byok: BYOKConfig;
  setByok: (b: BYOKConfig) => void;
  status: ByokStatus;
  errorMessage?: string;
  technicalDetail?: string;
  onTest: () => void;
  testing: boolean;
}) {
  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">BYOK Settings</h1>
        <p className="text-sm text-[var(--ink-2)]">
          Bring Your Own Key for AI-assisted explanation. The deterministic policy kernel still
          governs all final Guardian decisions.
        </p>
      </header>

      <div className="glass-strong rounded-xl p-6 flex flex-col gap-4">
        <div className="text-xs uppercase tracking-wider text-[var(--ink-2)]">Provider</div>
        <BYOKControl
          byok={byok}
          setByok={setByok}
          status={status}
          errorMessage={errorMessage}
          technicalDetail={technicalDetail}
          onTest={onTest}
          testing={testing}
        />
        <p className="text-xs text-[var(--ink-2)]">
          The button above opens the BYOK popover. The same control lives in the global header so
          you can switch modes from anywhere in the app.
        </p>
      </div>

      <div className="glass rounded-xl p-5 text-sm flex flex-col gap-3">
        <div className="font-semibold">How BYOK works</div>
        <ul className="list-disc pl-5 text-[var(--ink-2)] flex flex-col gap-1">
          <li>API keys are sent only to the server-side route at <code className="text-[var(--ink-1)]">/api/ai</code>.</li>
          <li>Keys are never logged, never persisted, and never echoed back to the client.</li>
          <li>If the provider call fails, the app falls back gracefully to the deterministic kernel.</li>
          <li>AI can assist with: worker-agent explanation, Guardian explanation, risk summary.</li>
          <li>AI <span className="font-semibold">cannot</span> change the Guardian decision, reason codes, allowed/blocked actions, or matched policies.</li>
        </ul>
      </div>

      <div className="glass rounded-xl p-5 text-sm">
        <div className="font-semibold mb-2">Supported providers</div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs text-[var(--ink-2)]">
          {["Azure OpenAI", "OpenAI", "Anthropic", "Mistral AI", "OpenRouter"].map((p) => (
            <div key={p} className="glass rounded-md px-3 py-2 text-center">
              {p}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
