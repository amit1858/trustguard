"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useCaseStore } from "@/lib/caseStore";
import { useToast } from "@/components/Toast";

const LS_KEYS = [
  "trustguard.cases.v1",
  "trustguard.ledger.v1",
  "trustguard.outcomes.v1",
  "trustguard.persona.v1",
  "trustguard.env.v1",
  "trustguard.byok.v1",
];

export default function ResetDemoButton({
  variant = "header",
}: {
  variant?: "header" | "settings";
}) {
  const [confirming, setConfirming] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { reset } = useCaseStore();
  const { show } = useToast();

  // eslint-disable-next-line react-hooks/set-state-in-effect -- mount flag for portal SSR-safety
  useEffect(() => setMounted(true), []);

  function performReset() {
    if (typeof window !== "undefined") {
      LS_KEYS.forEach((k) => {
        try {
          window.localStorage.removeItem(k);
        } catch {
          /* ignore */
        }
      });
    }
    reset();
    setConfirming(false);
    show("Demo state reset. Seed data restored.", "info");
    // Soft reload after a short delay so persona/env providers re-hydrate to defaults.
    setTimeout(() => {
      if (typeof window !== "undefined") {
        window.location.href = `${window.location.origin}${window.location.pathname}`;
      }
    }, 700);
  }

  const trigger =
    variant === "header" ? (
      <button
        onClick={() => setConfirming(true)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition"
        style={{
          borderColor: "rgba(180, 70, 70, 0.45)",
          background: "rgba(184, 58, 58, 0.10)",
          color: "#F4EFE7",
        }}
        title="Reset all cases, ledger, outcomes, persona, environment, and BYOK to seed data"
      >
        ↺ Reset demo
      </button>
    ) : (
      <button
        onClick={() => setConfirming(true)}
        className="btn"
        style={{
          borderColor: "rgba(180, 70, 70, 0.45)",
          background: "rgba(184, 58, 58, 0.10)",
          color: "#F4EFE7",
        }}
      >
        ↺ Reset demo state
      </button>
    );

  return (
    <>
      {trigger}
      {mounted &&
        confirming &&
        createPortal(
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 9500,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(0,0,0,0.55)",
              backdropFilter: "blur(2px)",
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) setConfirming(false);
            }}
          >
            <div
              className="glass-strong"
              style={{
                padding: 22,
                width: 440,
                maxWidth: "92vw",
                borderRadius: 12,
                border: "1px solid rgba(184, 58, 58, 0.45)",
                boxShadow: "0 24px 60px rgba(0,0,0,0.55)",
              }}
            >
              <div
                className="text-[10px] uppercase tracking-widest"
                style={{ color: "#D97448" }}
              >
                Confirm reset
              </div>
              <h3 className="text-base font-semibold mt-0.5 text-[var(--ink-0)]">
                Reset demo state?
              </h3>
              <p className="text-xs text-[var(--ink-1)] mt-2 leading-relaxed">
                This clears local cases, decision ledger, review outcomes, persona,
                environment selection, and any BYOK preferences from this browser, then
                reseeds cases from the scenarios. The Guardian decision logic and the
                deterministic policy kernel are unchanged.
              </p>
              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={() => setConfirming(false)}
                  className="px-3 py-1.5 rounded-md border text-xs"
                  style={{ borderColor: "var(--border)", color: "var(--ink-1)" }}
                >
                  Cancel
                </button>
                <button
                  onClick={performReset}
                  className="px-3 py-1.5 rounded-md text-xs font-medium border"
                  style={{
                    borderColor: "rgba(184, 58, 58, 0.6)",
                    background:
                      "linear-gradient(90deg, rgba(184,58,58,0.32), rgba(217,116,72,0.22))",
                    color: "#F4EFE7",
                  }}
                >
                  Reset and reseed
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
