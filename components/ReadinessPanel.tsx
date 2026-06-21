"use client";

import { READINESS_ITEMS, READINESS_COLORS } from "@/lib/readiness";

export default function ReadinessPanel() {
  return (
    <section className="glass rounded-xl p-5">
      <div className="flex items-baseline justify-between mb-1 flex-wrap gap-2">
        <div>
          <div className="section-title">Deployment readiness</div>
          <div className="section-heading mt-1">Mock vs production boundaries</div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(READINESS_COLORS) as Array<keyof typeof READINESS_COLORS>).map(
            (k) => (
              <span
                key={k}
                className="chip text-[10px]"
                style={{ color: READINESS_COLORS[k], borderColor: READINESS_COLORS[k] + "55" }}
              >
                <span
                  className="status-dot"
                  style={{ background: READINESS_COLORS[k], boxShadow: "none" }}
                />
                {k}
              </span>
            ),
          )}
        </div>
      </div>

      <div className="text-xs text-[var(--ink-1)] mb-4 max-w-3xl">
        Where each layer stands today versus what would be needed to put TrustGuard in
        front of a real agentic ads workflow. Everything below is local and deterministic;
        nothing reaches an external system.
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {READINESS_ITEMS.map((item) => {
          const c = READINESS_COLORS[item.status];
          return (
            <div
              key={item.category}
              className="rounded-lg border p-4"
              style={{ borderColor: "var(--border)", background: "var(--bg-2)" }}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="text-[13px] font-semibold text-[var(--ink-0)]">
                  {item.category}
                </div>
                <span
                  className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full"
                  style={{
                    color: c,
                    background: c + "14",
                    border: `1px solid ${c}55`,
                  }}
                >
                  {item.status}
                </span>
              </div>
              <Row label="Built" color="#6FB089" text={item.built} />
              <Row label="Mocked" color="#C9A36B" text={item.mocked} />
              <Row label="Next" color="#F59E2E" text={item.needed} />
              <Row label="Production" color="#D97448" text={item.production} />
            </div>
          );
        })}
      </div>
    </section>
  );
}

function Row({ label, color, text }: { label: string; color: string; text: string }) {
  return (
    <div className="flex gap-3 text-[11px] mt-1.5 leading-snug">
      <span
        className="uppercase tracking-wider w-[78px] shrink-0"
        style={{ color }}
      >
        {label}
      </span>
      <span className="text-[var(--ink-1)]">{text}</span>
    </div>
  );
}
