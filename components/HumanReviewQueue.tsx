"use client";

import { getReviewQueue } from "@/lib/controlPlane";

const decisionColors: Record<string, string> = {
  RESTRICT: "#9B89B8",
  ESCALATE: "#D97448",
  BLOCK: "#B83A3A",
  ALLOW_WITH_CONDITIONS: "#F59E2E",
  ALLOW: "#6FB089",
};

export default function HumanReviewQueue({
  onOpenScenario,
}: {
  onOpenScenario: (id: string) => void;
}) {
  const items = getReviewQueue();
  return (
    <section className="glass p-5">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div>
          <div className="text-xs uppercase tracking-widest text-[var(--ink-2)]">
            Human review queue
          </div>
          <div className="text-base font-semibold">High-risk actions routed to T&amp;S specialists</div>
        </div>
        <span className="pill" style={{ borderColor: "rgba(251,146,60,0.5)", color: "#fdba74" }}>
          {items.length} open
        </span>
      </div>

      {items.length === 0 ? (
        <div className="text-sm text-[var(--ink-2)]">No items in queue.</div>
      ) : (
        <div className="space-y-2">
          {items.map((it) => {
            const color = decisionColors[it.decision] || "#aab0c8";
            return (
              <button
                key={it.scenarioId}
                onClick={() => onOpenScenario(it.scenarioId)}
                className="w-full text-left p-3 rounded-xl border transition hover:translate-x-0.5"
                style={{
                  borderColor: `${color}55`,
                  background: `linear-gradient(180deg, ${color}10, transparent)`,
                }}
              >
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold truncate">
                      {it.advertiser}
                      <span className="text-[var(--ink-2)] font-normal"> · {it.vertical} / {it.market}</span>
                    </div>
                    <div className="text-xs text-[var(--ink-1)] mt-0.5">
                      Requested: {it.requestedAction}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className="text-[10px] uppercase tracking-widest px-2 py-1 rounded"
                      style={{ color, background: `${color}15`, border: `1px solid ${color}55` }}
                    >
                      {it.decision.replace("_", " ")}
                    </span>
                    <span className="text-[10px] text-[var(--ink-2)]">risk {it.riskScore}</span>
                  </div>
                </div>
                {it.reasonCodes.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {it.reasonCodes.slice(0, 4).map((r) => (
                      <span
                        key={r}
                        className="text-[10px] px-1.5 py-0.5 rounded border"
                        style={{ borderColor: `${color}40`, color: `${color}` }}
                      >
                        {r}
                      </span>
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
