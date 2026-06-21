"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import CopyLinkButton from "@/components/CopyLinkButton";
import type { DeepLinkState } from "@/lib/deepLinks";

export interface PresenterStep {
  key: string;
  title: string;
  body: string;
  /** Optional one-liner that contextualizes the current scenario / case */
  scenarioNote?: string;
  /** DOM id of an element to scroll into view and softly highlight */
  highlightId?: string;
  /** Optional CTA — switches the parent app to a view */
  goTo?: { label: string; deepLink: DeepLinkState };
}

interface Props {
  open: boolean;
  onClose: () => void;
  steps: PresenterStep[];
  idx: number;
  setIdx: (i: number) => void;
  eyebrow: string;
  title: string;
  /** Called when user clicks a step's "Go to view" CTA. */
  onNavigate?: (link: DeepLinkState) => void;
  /** Deep link representing the current panel state (for Copy link). */
  copyLinkState?: DeepLinkState;
  /** Accent color for the drawer chrome (defaults to amber). */
  accent?: string;
}

export default function PresenterDrawer({
  open,
  onClose,
  steps,
  idx,
  setIdx,
  eyebrow,
  title,
  onNavigate,
  copyLinkState,
  accent = "#F59E2E",
}: Props) {
  const safeIdx = Math.min(Math.max(idx, 0), Math.max(steps.length - 1, 0));
  const step = steps[safeIdx];

  // Highlight target element when step changes
  useEffect(() => {
    if (!open || !step?.highlightId) return;
    const el = document.getElementById(step.highlightId);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.add("walkthrough-highlight");
    const t = setTimeout(() => el.classList.remove("walkthrough-highlight"), 2400);
    return () => {
      clearTimeout(t);
      el.classList.remove("walkthrough-highlight");
    };
  }, [open, safeIdx, step?.highlightId]);

  // Keyboard nav
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setIdx(Math.min(safeIdx + 1, steps.length - 1));
      if (e.key === "ArrowLeft") setIdx(Math.max(safeIdx - 1, 0));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, safeIdx, steps.length, setIdx]);

  if (!open || !step) return null;
  if (typeof document === "undefined") return null;

  const isLast = safeIdx === steps.length - 1;

  return createPortal(
    <div
      // No full-screen blocking backdrop — app stays interactive.
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        height: "100vh",
        width: 440,
        maxWidth: "96vw",
        zIndex: 9000,
        pointerEvents: "none",
      }}
    >
      <div
        className="glass-strong"
        style={{
          pointerEvents: "auto",
          position: "absolute",
          top: 12,
          right: 12,
          bottom: 12,
          left: 12,
          padding: 20,
          borderRadius: 14,
          display: "flex",
          flexDirection: "column",
          gap: 12,
          border: `1px solid ${accent}55`,
          boxShadow: `0 24px 60px rgba(0,0,0,0.55), 0 0 0 1px ${accent}22`,
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <div
              className="text-[10px] uppercase tracking-widest"
              style={{ color: accent }}
            >
              {eyebrow}
            </div>
            <div className="text-base font-semibold mt-0.5 text-[var(--ink-0)]">
              {title}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--ink-2)] hover:text-[var(--ink-0)] text-lg leading-none px-2"
            aria-label="Close presenter panel"
            title="Close (Esc)"
          >
            ✕
          </button>
        </div>

        {/* Progress dots */}
        <div className="flex gap-1.5">
          {steps.map((s, i) => (
            <button
              key={s.key}
              onClick={() => setIdx(i)}
              className="h-1.5 flex-1 rounded transition"
              style={{
                background:
                  i === safeIdx
                    ? `linear-gradient(90deg, ${accent}, #FFB454)`
                    : i < safeIdx
                      ? `${accent}66`
                      : "rgba(255,255,255,0.08)",
              }}
              aria-label={`Go to step ${i + 1}`}
            />
          ))}
        </div>

        <div style={{ overflowY: "auto", flex: 1, paddingRight: 4 }}>
          <div className="text-lg font-semibold" style={{ color: "#F4EFE7" }}>
            {step.title}
          </div>
          <p className="text-sm text-[var(--ink-0)]/90 mt-2 leading-relaxed">
            {step.body}
          </p>

          {step.scenarioNote && (
            <div
              className="mt-3 p-3 rounded-lg border text-xs leading-relaxed text-[var(--ink-1)]"
              style={{
                borderColor: `${accent}40`,
                background: `${accent}10`,
              }}
            >
              <span className="uppercase tracking-widest text-[10px] mr-1 text-[var(--ink-2)]">
                In this scenario:
              </span>
              {step.scenarioNote}
            </div>
          )}

          {step.goTo && (
            <button
              onClick={() => onNavigate?.(step.goTo!.deepLink)}
              className="mt-4 w-full py-2 rounded-lg text-sm font-medium border transition"
              style={{
                borderColor: `${accent}88`,
                background: `linear-gradient(90deg, ${accent}25, rgba(201,163,107,0.18))`,
                color: "#F4EFE7",
              }}
            >
              → {step.goTo.label}
            </button>
          )}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]">
          <div className="text-[11px] text-[var(--ink-2)]">
            Step {safeIdx + 1} of {steps.length} · ← →
          </div>
          <div className="flex items-center gap-2">
            {copyLinkState && (
              <CopyLinkButton state={copyLinkState} label="Link" />
            )}
            <button
              onClick={() => setIdx(Math.max(safeIdx - 1, 0))}
              disabled={safeIdx === 0}
              className="px-3 py-1.5 rounded-md border text-xs disabled:opacity-40"
              style={{ borderColor: "var(--border)", color: "var(--ink-1)" }}
            >
              ← Back
            </button>
            {!isLast ? (
              <button
                onClick={() => setIdx(Math.min(safeIdx + 1, steps.length - 1))}
                className="px-3 py-1.5 rounded-md text-xs font-medium border"
                style={{
                  borderColor: `${accent}88`,
                  background: `linear-gradient(90deg, ${accent}26, rgba(201,163,107,0.2))`,
                  color: "#F4EFE7",
                }}
              >
                Next →
              </button>
            ) : (
              <button
                onClick={onClose}
                className="px-3 py-1.5 rounded-md text-xs font-medium border"
                style={{
                  borderColor: `${accent}88`,
                  background: `linear-gradient(90deg, ${accent}30, rgba(201,163,107,0.22))`,
                  color: "#F4EFE7",
                }}
              >
                Finish
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
