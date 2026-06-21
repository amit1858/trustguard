"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { PROVIDERS } from "@/lib/modelProviders";
import type { AIProvider, BYOKConfig } from "@/lib/types";

export type ByokStatus = "demo" | "connected" | "error";

export default function BYOKControl({
  byok,
  setByok,
  status,
  errorMessage,
  onTest,
  testing,
}: {
  byok: BYOKConfig;
  setByok: (b: BYOKConfig) => void;
  status: ByokStatus;
  errorMessage?: string;
  onTest: () => void;
  testing: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number; width: number }>({
    top: 0,
    left: 0,
    width: 460,
  });

  // eslint-disable-next-line react-hooks/set-state-in-effect -- mount flag for portal SSR-safety
  useEffect(() => setMounted(true), []);

  // Compute viewport-safe popover position whenever it opens or window resizes/scrolls.
  useLayoutEffect(() => {
    if (!open) return;
    function place() {
      const trig = triggerRef.current;
      if (!trig) return;
      const r = trig.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const width = Math.min(460, vw - 24);
      let left = r.right - width; // right-aligned to trigger
      if (left < 12) left = 12;
      if (left + width > vw - 12) left = Math.max(12, vw - width - 12);
      let top = r.bottom + 8;
      // If not enough room below, flip above
      const estimatedHeight = Math.min(640, vh - 48);
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

  // Outside click + Escape
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

  const pill = statusPill(status);

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
          className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full"
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
              <Field label="Provider">
                <select
                  disabled={byok.mode === "demo"}
                  value={byok.provider}
                  onChange={(e) => {
                    const provider = e.target.value as AIProvider;
                    const p = PROVIDERS.find((x) => x.id === provider);
                    setByok({
                      ...byok,
                      provider,
                      modelName: p?.defaultModel || byok.modelName,
                    });
                  }}
                  className="input"
                >
                  {PROVIDERS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Model">
                <input
                  disabled={byok.mode === "demo"}
                  value={byok.modelName}
                  onChange={(e) => setByok({ ...byok, modelName: e.target.value })}
                  className="input"
                  placeholder="model name"
                />
              </Field>
              <Field label="API Key" className="col-span-2">
                <input
                  disabled={byok.mode === "demo"}
                  value={byok.apiKey}
                  onChange={(e) => setByok({ ...byok, apiKey: e.target.value })}
                  className="input"
                  type="password"
                  placeholder="sk-…   (held only in this browser tab, never persisted)"
                />
              </Field>
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
              disabled={byok.mode !== "byok" || !byok.apiKey || testing}
              className="mt-4 w-full py-2 rounded-lg text-sm font-medium border transition disabled:opacity-40"
              style={{
                borderColor: "rgba(245, 158, 46, 0.5)",
                background:
                  "linear-gradient(90deg, rgba(245, 158, 46, 0.18), rgba(201, 163, 107, 0.18))",
                color: "#F4EFE7",
              }}
            >
              {testing
                ? "Calling provider…"
                : "Test connection & generate AI explanation"}
            </button>
            {errorMessage && (
              <div className="text-xs mt-2" style={{ color: "#D97448" }}>
                ⚠ {errorMessage} — falling back to deterministic mode.
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
  if (status === "connected")
    return {
      label: "BYOK Connected",
      fg: "#86efac",
      bg: "rgba(111,176,137,0.14)",
      border: "rgba(111,176,137,0.55)",
    };
  if (status === "error")
    return {
      label: "BYOK Error · falling back to Deterministic",
      fg: "#FFB454",
      bg: "rgba(217,116,72,0.14)",
      border: "rgba(217,116,72,0.55)",
    };
  return {
    label: "Demo Mode Active",
    fg: "#F4EFE7",
    bg: "rgba(245, 158, 46, 0.12)",
    border: "rgba(245, 158, 46, 0.50)",
  };
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
  return (
    <label
      className={`flex items-center gap-2 text-xs px-2.5 py-1.5 rounded-lg border ${
        disabled ? "opacity-40" : ""
      }`}
      style={{
        borderColor: checked ? "rgba(245, 158, 46, 0.5)" : "var(--border)",
        background: checked ? "rgba(245, 158, 46, 0.08)" : "transparent",
      }}
    >
      <input
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
