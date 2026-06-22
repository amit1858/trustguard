"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  PROVIDERS,
  findProvider,
  friendlyErrorMessage,
  type ProviderErrorType,
  type ModelListEntry,
  type ModelListResponse,
} from "@/lib/modelProviders";
import type { AIProvider, BYOKConfig } from "@/lib/types";

/**
 * Rich status used by the BYOK pill + popover.
 * Constructed in app/page.tsx based on the normalized AI route response.
 */
export type ByokStatus =
  | { kind: "demo" }
  | { kind: "ready" }
  | { kind: "loading_models" }
  | { kind: "models_loaded" }
  | { kind: "testing" }
  | { kind: "connected" }
  | { kind: "error"; errorType: ProviderErrorType };

export default function BYOKControl({
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
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number; width: number }>({
    top: 0,
    left: 0,
    width: 480,
  });

  // Model-list loading is local to this control.
  const [loadedModels, setLoadedModels] = useState<ModelListEntry[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [loadError, setLoadError] = useState<string | undefined>();
  const [loadErrorDetail, setLoadErrorDetail] = useState<string | undefined>();
  const [showLoadDetail, setShowLoadDetail] = useState(false);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- mount flag for portal SSR-safety
  useEffect(() => setMounted(true), []);

  // Clear loaded model list when provider or key changes — list is per-(provider, key).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional reset on provider/key change
    setLoadedModels([]);
    setLoadError(undefined);
    setLoadErrorDetail(undefined);
  }, [byok.provider, byok.apiKey]);

  useLayoutEffect(() => {
    if (!open) return;
    function place() {
      const trig = triggerRef.current;
      if (!trig) return;
      const r = trig.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const width = Math.min(480, vw - 24);
      let left = r.right - width;
      if (left < 12) left = 12;
      if (left + width > vw - 12) left = Math.max(12, vw - width - 12);
      let top = r.bottom + 8;
      const estimatedHeight = Math.min(720, vh - 48);
      if (top + estimatedHeight > vh - 12) {
        const aboveTop = r.top - 8 - estimatedHeight;
        if (aboveTop >= 12) top = aboveTop;
        else top = Math.max(12, vh - estimatedHeight - 12);
      }
      setPos({ top, left, width });
    }
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      const t = e.target as Node;
      if (popoverRef.current?.contains(t)) return;
      if (triggerRef.current?.contains(t)) return;
      setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const provider = findProvider(byok.provider);
  const presets = provider?.presets ?? [];
  const isAzure = byok.provider === "azure_openai";

  // Effective status for the pill: prefer local load state when active so
  // user sees "Loading Models" / "Models Loaded" feedback even before testing.
  const effectiveStatus: ByokStatus = useMemo(() => {
    if (byok.mode !== "demo") {
      if (loadingModels) return { kind: "loading_models" };
      if (loadedModels.length > 0 && status.kind !== "connected" && status.kind !== "error" && status.kind !== "testing") {
        return { kind: "models_loaded" };
      }
    }
    return status;
  }, [byok.mode, loadingModels, loadedModels.length, status]);

  const pill = statusPill(effectiveStatus);

  async function loadModels() {
    if (byok.mode === "demo") return;
    if (!provider?.supportsModelListing) return;
    setLoadingModels(true);
    setLoadError(undefined);
    setLoadErrorDetail(undefined);
    try {
      const res = await fetch("/api/ai/models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: byok.provider, apiKey: byok.apiKey }),
      });
      const j = (await res.json()) as ModelListResponse & { technicalDetail?: string };
      if (j.ok && j.models && j.models.length > 0) {
        setLoadedModels(j.models);
      } else if (j.ok && (!j.models || j.models.length === 0)) {
        setLoadedModels([]);
        setLoadError(`No models returned by ${provider.displayName}. Enter a model ID manually.`);
      } else {
        setLoadedModels([]);
        setLoadError(j.message ?? friendlyErrorMessage(j.errorType ?? "unknown_error", byok.provider));
        setLoadErrorDetail(j.technicalDetail);
      }
    } catch (e) {
      setLoadedModels([]);
      setLoadError(friendlyErrorMessage("network_error", byok.provider));
      setLoadErrorDetail(e instanceof Error ? e.message : undefined);
    } finally {
      setLoadingModels(false);
    }
  }

  return (
    <>
      <button
        ref={triggerRef}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition"
        style={{
          borderColor: "rgba(201, 163, 107, 0.45)",
          background:
            "linear-gradient(90deg, rgba(201, 163, 107, 0.12), rgba(155, 137, 184, 0.12))",
          color: "#F4EFE7",
        }}
      >
        <span>⚙️ BYOK</span>
        <span
          className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full whitespace-nowrap"
          style={{ background: pill.bg, color: pill.fg, border: `1px solid ${pill.border}` }}
        >
          {pill.label}
        </span>
      </button>

      {mounted &&
        open &&
        createPortal(
          <div
            ref={popoverRef}
            role="dialog"
            aria-label="BYOK settings"
            className="glass-strong p-5"
            style={{
              position: "fixed",
              top: pos.top,
              left: pos.left,
              width: pos.width,
              maxHeight: "calc(100vh - 32px)",
              overflowY: "auto",
              zIndex: 9999,
              borderColor: "rgba(180, 150, 110, 0.4)",
              boxShadow:
                "0 24px 60px rgba(0,0,0,0.55), 0 0 0 1px rgba(245, 158, 46, 0.16)",
            }}
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <div className="text-xs uppercase tracking-widest text-[var(--ink-2)]">
                  Settings
                </div>
                <div className="text-base font-semibold">BYOK · AI assistance</div>
              </div>
              <div className="flex items-center gap-2">
                <ModeToggle
                  mode={byok.mode}
                  onChange={(m) => setByok({ ...byok, mode: m })}
                />
                <button
                  onClick={() => setOpen(false)}
                  className="btn btn-ghost text-base px-2 py-1"
                  aria-label="Close BYOK settings"
                  title="Close (Esc)"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Provider" className="col-span-2">
                <select
                  disabled={byok.mode === "demo"}
                  value={byok.provider}
                  onChange={(e) => {
                    const newProvider = e.target.value as AIProvider;
                    const meta = findProvider(newProvider);
                    setByok({
                      ...byok,
                      provider: newProvider,
                      // Custom-first: only seed modelName from defaultPresetId
                      // when the provider actually has a non-empty default
                      // (OpenAI / Mistral / OpenRouter). Anthropic and Azure
                      // start empty so the user must load or paste a model.
                      modelName: meta?.defaultPresetId || "",
                      azureEndpoint:
                        newProvider === "azure_openai" ? byok.azureEndpoint : undefined,
                      azureDeployment:
                        newProvider === "azure_openai" ? byok.azureDeployment : undefined,
                      azureApiVersion:
                        newProvider === "azure_openai" ? byok.azureApiVersion : undefined,
                    });
                  }}
                  className="input"
                >
                  {PROVIDERS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.displayName}
                    </option>
                  ))}
                </select>
                {provider && (
                  <div className="text-[11px] text-[var(--ink-2)] mt-1 leading-snug">
                    {provider.helperText}{" "}
                    <a
                      href={provider.docsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline opacity-80 hover:opacity-100"
                    >
                      Docs ↗
                    </a>
                  </div>
                )}
              </Field>

              <Field label="API Key" className="col-span-2">
                <input
                  disabled={byok.mode === "demo"}
                  value={byok.apiKey}
                  onChange={(e) => setByok({ ...byok, apiKey: e.target.value })}
                  className="input"
                  type="password"
                  placeholder="held only in this browser tab · never persisted or logged"
                  spellCheck={false}
                  autoComplete="off"
                />
              </Field>

              {/* Non-Azure providers: custom-first model field + Load models + Examples */}
              {!isAzure && (
                <>
                  <Field
                    label={
                      provider?.supportsModelListing
                        ? "Model / deployment ID  (custom-first)"
                        : "Model / deployment ID"
                    }
                    className="col-span-2"
                  >
                    <div className="flex gap-2">
                      <input
                        disabled={byok.mode === "demo"}
                        value={byok.modelName}
                        onChange={(e) => setByok({ ...byok, modelName: e.target.value })}
                        className="input flex-1"
                        placeholder={provider?.modelPlaceholder ?? "model id"}
                        spellCheck={false}
                      />
                      {provider?.supportsModelListing && (
                        <button
                          type="button"
                          onClick={loadModels}
                          disabled={byok.mode === "demo" || loadingModels || !byok.apiKey}
                          className="px-3 py-2 rounded-lg border text-xs whitespace-nowrap disabled:opacity-40"
                          style={{
                            borderColor: "rgba(155, 137, 184, 0.5)",
                            background: "rgba(155, 137, 184, 0.10)",
                            color: "#F4EFE7",
                          }}
                          title={
                            !byok.apiKey
                              ? "Enter an API key first"
                              : `Fetch models available to your ${provider.displayName} account`
                          }
                        >
                          {loadingModels ? "Loading…" : "Load available models"}
                        </button>
                      )}
                    </div>
                    <div className="text-[11px] text-[var(--ink-2)] mt-1 leading-snug">
                      Model availability varies by account, region, and platform. Use{" "}
                      <span className="text-[var(--ink-1)]">Load available models</span> or paste a
                      model ID from your provider console.
                    </div>
                  </Field>

                  {/* Loaded models (only when we have some) */}
                  {loadedModels.length > 0 && (
                    <Field
                      label={`Available models  (${loadedModels.length})`}
                      className="col-span-2"
                    >
                      <select
                        disabled={byok.mode === "demo"}
                        value={
                          loadedModels.some((m) => m.id === byok.modelName)
                            ? byok.modelName
                            : ""
                        }
                        onChange={(e) => {
                          if (e.target.value) setByok({ ...byok, modelName: e.target.value });
                        }}
                        className="input"
                      >
                        <option value="">— select a model from your account —</option>
                        {loadedModels.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.displayName ? `${m.displayName}  (${m.id})` : m.id}
                          </option>
                        ))}
                      </select>
                    </Field>
                  )}

                  {/* Load error surface */}
                  {loadError && (
                    <div
                      className="col-span-2 p-2 rounded-lg border text-[11px] leading-snug"
                      style={{
                        borderColor: "rgba(217, 116, 72, 0.35)",
                        background: "rgba(217, 116, 72, 0.06)",
                        color: "#F4EFE7",
                      }}
                    >
                      <div style={{ color: "#FFB454" }}>⚠ {loadError}</div>
                      <div className="text-[var(--ink-2)] mt-0.5">
                        You can still enter a model ID manually above.
                      </div>
                      {loadErrorDetail && (
                        <details
                          className="mt-1"
                          open={showLoadDetail}
                          onToggle={(e) =>
                            setShowLoadDetail((e.target as HTMLDetailsElement).open)
                          }
                        >
                          <summary className="cursor-pointer text-[var(--ink-2)] select-none">
                            Technical details
                          </summary>
                          <pre className="mt-1 whitespace-pre-wrap break-words text-[10px] text-[var(--ink-2)] max-h-32 overflow-y-auto">
                            {loadErrorDetail}
                          </pre>
                        </details>
                      )}
                    </div>
                  )}

                  {/* Examples — always suggestions only */}
                  {presets.length > 0 && (
                    <Field
                      label="Examples  (not guaranteed available)"
                      className="col-span-2"
                    >
                      <select
                        disabled={byok.mode === "demo"}
                        value=""
                        onChange={(e) => {
                          if (e.target.value)
                            setByok({ ...byok, modelName: e.target.value });
                        }}
                        className="input"
                      >
                        <option value="">— copy an example into the field above —</option>
                        {presets.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.label}
                            {p.hint ? ` — ${p.hint}` : ""}
                          </option>
                        ))}
                      </select>
                      <div className="text-[11px] text-[var(--ink-2)] mt-1">
                        Examples may not be available to every account. Prefer Load
                        available models when supported.
                      </div>
                    </Field>
                  )}
                </>
              )}

              {/* Azure-specific fields */}
              {isAzure && (
                <>
                  <Field label="Azure endpoint" className="col-span-2">
                    <input
                      disabled={byok.mode === "demo"}
                      value={byok.azureEndpoint ?? ""}
                      onChange={(e) =>
                        setByok({ ...byok, azureEndpoint: e.target.value })
                      }
                      className="input"
                      placeholder="https://<resource>.openai.azure.com"
                      spellCheck={false}
                    />
                  </Field>
                  <Field label="Deployment name">
                    <input
                      disabled={byok.mode === "demo"}
                      value={byok.azureDeployment ?? byok.modelName ?? ""}
                      onChange={(e) =>
                        setByok({
                          ...byok,
                          azureDeployment: e.target.value,
                          modelName: e.target.value,
                        })
                      }
                      className="input"
                      placeholder="your deployment name (not raw model ID)"
                      spellCheck={false}
                    />
                  </Field>
                  <Field label="API version">
                    <input
                      disabled={byok.mode === "demo"}
                      value={byok.azureApiVersion ?? "2024-08-01-preview"}
                      onChange={(e) =>
                        setByok({ ...byok, azureApiVersion: e.target.value })
                      }
                      className="input"
                      placeholder="2024-08-01-preview"
                      spellCheck={false}
                    />
                  </Field>
                  <div
                    className="col-span-2 p-2 rounded-lg border text-[11px] leading-snug"
                    style={{
                      borderColor: "rgba(155, 137, 184, 0.35)",
                      background: "rgba(155, 137, 184, 0.06)",
                      color: "#F4EFE7",
                    }}
                  >
                    Azure OpenAI uses <span className="text-[var(--ink-1)]">deployment names</span>{" "}
                    from your Azure OpenAI resource. There is no public model list — enter the
                    deployment name exactly as it appears in your Azure portal.
                  </div>
                </>
              )}
            </div>

            <div className="mt-3">
              <div className="text-[11px] uppercase tracking-widest text-[var(--ink-2)] mb-1.5">
                Use AI for
              </div>
              <div className="flex flex-wrap gap-2">
                <TaskCheck
                  label="Worker-agent explanation"
                  checked={byok.tasks.workerFindings}
                  disabled={byok.mode === "demo"}
                  onChange={(v) =>
                    setByok({ ...byok, tasks: { ...byok.tasks, workerFindings: v } })
                  }
                />
                <TaskCheck
                  label="Guardian explanation"
                  checked={byok.tasks.guardianExplanation}
                  disabled={byok.mode === "demo"}
                  onChange={(v) =>
                    setByok({
                      ...byok,
                      tasks: { ...byok.tasks, guardianExplanation: v },
                    })
                  }
                />
                <TaskCheck
                  label="Risk summary"
                  checked={byok.tasks.riskSummary}
                  disabled={byok.mode === "demo"}
                  onChange={(v) =>
                    setByok({ ...byok, tasks: { ...byok.tasks, riskSummary: v } })
                  }
                />
              </div>
            </div>

            <button
              onClick={onTest}
              disabled={byok.mode !== "byok" || !byok.apiKey || !byok.modelName || testing}
              className="mt-4 w-full py-2 rounded-lg text-sm font-medium border transition disabled:opacity-40"
              style={{
                borderColor: "rgba(245, 158, 46, 0.5)",
                background:
                  "linear-gradient(90deg, rgba(245, 158, 46, 0.18), rgba(201, 163, 107, 0.18))",
                color: "#F4EFE7",
              }}
              title={
                !byok.apiKey
                  ? "Enter an API key first"
                  : !byok.modelName
                    ? "Enter a model / deployment ID first"
                    : "Run a small test call to validate"
              }
            >
              {testing
                ? "Calling provider…"
                : "Test connection & generate AI explanation"}
            </button>

            {/* Friendly error / success surface */}
            {status.kind === "error" && errorMessage && (
              <div
                className="mt-2 p-3 rounded-lg border text-xs leading-relaxed"
                style={{
                  borderColor: "rgba(217, 116, 72, 0.45)",
                  background: "rgba(217, 116, 72, 0.07)",
                  color: "#F4EFE7",
                }}
              >
                <div style={{ color: "#FFB454" }}>⚠ {errorMessage}</div>
                <div className="text-[var(--ink-2)] mt-1">
                  Guardian decisions continue to use the deterministic policy kernel.
                </div>
                {technicalDetail && (
                  <details
                    className="mt-2"
                    open={showDetail}
                    onToggle={(e) => setShowDetail((e.target as HTMLDetailsElement).open)}
                  >
                    <summary className="cursor-pointer text-[var(--ink-2)] select-none">
                      Technical details
                    </summary>
                    <pre className="mt-1 whitespace-pre-wrap break-words text-[10px] text-[var(--ink-2)] max-h-32 overflow-y-auto">
                      {technicalDetail}
                    </pre>
                  </details>
                )}
              </div>
            )}
            {status.kind === "connected" && (
              <div
                className="mt-2 p-3 rounded-lg border text-xs"
                style={{
                  borderColor: "rgba(111, 176, 137, 0.45)",
                  background: "rgba(111, 176, 137, 0.07)",
                  color: "#86efac",
                }}
              >
                ✓ BYOK Connected. AI-assisted explanation will appear alongside the
                deterministic explanation.
              </div>
            )}

            <div
              className="mt-3 text-[11px] text-[var(--ink-2)] leading-relaxed p-3 rounded-lg border"
              style={{
                borderColor: "rgba(245, 158, 46, 0.28)",
                background: "rgba(245, 158, 46, 0.06)",
              }}
            >
              ⓘ AI assists with explanation and summarization. Final Guardian
              decisions are governed by the deterministic policy kernel. AI cannot
              change <span className="text-[var(--ink-1)]">decision</span>,{" "}
              <span className="text-[var(--ink-1)]">allowed actions</span>, or{" "}
              <span className="text-[var(--ink-1)]">blocked actions</span>. Keys are
              never stored or logged.
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}

function statusPill(status: ByokStatus) {
  if (status.kind === "connected") {
    return {
      label: "BYOK Connected",
      fg: "#86efac",
      bg: "rgba(111,176,137,0.14)",
      border: "rgba(111,176,137,0.55)",
    };
  }
  if (status.kind === "testing") {
    return {
      label: "Testing Connection",
      fg: "#F4EFE7",
      bg: "rgba(245, 158, 46, 0.18)",
      border: "rgba(245, 158, 46, 0.55)",
    };
  }
  if (status.kind === "loading_models") {
    return {
      label: "Loading Models",
      fg: "#F4EFE7",
      bg: "rgba(155, 137, 184, 0.18)",
      border: "rgba(155, 137, 184, 0.55)",
    };
  }
  if (status.kind === "models_loaded") {
    return {
      label: "Models Loaded",
      fg: "#F4EFE7",
      bg: "rgba(155, 137, 184, 0.16)",
      border: "rgba(155, 137, 184, 0.55)",
    };
  }
  if (status.kind === "ready") {
    return {
      label: "BYOK Ready",
      fg: "#F4EFE7",
      bg: "rgba(155, 137, 184, 0.16)",
      border: "rgba(155, 137, 184, 0.55)",
    };
  }
  if (status.kind === "error") {
    return {
      label: errorPillLabel(status.errorType),
      fg: "#FFB454",
      bg: "rgba(217,116,72,0.14)",
      border: "rgba(217,116,72,0.55)",
    };
  }
  return {
    label: "Demo Mode Active",
    fg: "#F4EFE7",
    bg: "rgba(245, 158, 46, 0.12)",
    border: "rgba(245, 158, 46, 0.50)",
  };
}

function errorPillLabel(t: ProviderErrorType): string {
  switch (t) {
    case "model_not_found":
      return "Model Not Available · Falling Back";
    case "invalid_api_key":
      return "Invalid Key · Falling Back";
    case "permission_denied":
      return "Access Denied · Falling Back";
    case "region_unavailable":
      return "Region Unavailable · Falling Back";
    case "rate_limited":
      return "Rate Limited · Falling Back";
    case "provider_unavailable":
      return "Provider Error · Falling Back";
    case "network_error":
      return "Network Error · Falling Back";
    case "malformed_request":
      return "Bad Request · Falling Back";
    case "unknown_error":
    default:
      return "BYOK Error · Falling Back";
  }
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className || ""}`}>
      <div className="text-[11px] uppercase tracking-widest text-[var(--ink-2)] mb-1">
        {label}
      </div>
      {children}
    </label>
  );
}

function ModeToggle({
  mode,
  onChange,
}: {
  mode: "demo" | "byok";
  onChange: (m: "demo" | "byok") => void;
}) {
  return (
    <div className="flex p-1 rounded-lg border border-[var(--border)] text-xs">
      {(["demo", "byok"] as const).map((m) => (
        <button
          key={m}
          onClick={() => onChange(m)}
          className={`px-3 py-1 rounded-md transition ${
            mode === m ? "text-[var(--ink-0)]" : "text-[var(--ink-2)]"
          }`}
          style={
            mode === m
              ? {
                  background:
                    "linear-gradient(90deg, rgba(245, 158, 46, 0.24), rgba(201, 163, 107, 0.24))",
                  border: "1px solid rgba(245, 158, 46, 0.4)",
                }
              : {}
          }
        >
          {m === "demo" ? "Demo (deterministic)" : "BYOK (AI-assisted)"}
        </button>
      ))}
    </div>
  );
}

function TaskCheck({
  label,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (v: boolean) => void;
}) {
  const id = useMemo(() => `tc-${label.replace(/\s+/g, "-").toLowerCase()}`, [label]);
  return (
    <label
      htmlFor={id}
      className={`flex items-center gap-2 text-xs px-2.5 py-1.5 rounded-lg border ${
        disabled ? "opacity-40" : ""
      }`}
      style={{
        borderColor: checked ? "rgba(245, 158, 46, 0.5)" : "var(--border)",
        background: checked ? "rgba(245, 158, 46, 0.08)" : "transparent",
      }}
    >
      <input
        id={id}
        type="checkbox"
        disabled={disabled}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="accent-amber-500"
      />
      {label}
    </label>
  );
}
