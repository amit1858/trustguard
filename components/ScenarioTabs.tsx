"use client";

import { SCENARIOS } from "@/lib/scenarios";

export default function ScenarioTabs({
  current,
  onSelect,
}: {
  current: string;
  onSelect: (id: string) => void;
}) {
  return (
    <section>
      <div className="text-xs uppercase tracking-widest text-[var(--ink-2)] mb-3 px-1">
        Scenarios
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {SCENARIOS.map((s) => {
          const active = s.id === current;
          return (
            <button
              key={s.id}
              onClick={() => onSelect(s.id)}
              className={`text-left glass p-3 transition ${
                active ? "glow-amber" : "hover:border-[rgba(245,158,46,0.32)]"
              }`}
              style={active ? { borderColor: "rgba(245, 158, 46, 0.45)" } : {}}
            >
              <div className="text-[10px] uppercase tracking-widest text-[var(--ink-2)]">
                {s.market} · {s.vertical}
              </div>
              <div className="text-sm font-semibold mt-1 leading-tight">
                {s.shortLabel}
              </div>
              <div className="text-xs text-[var(--ink-1)] mt-1 line-clamp-2">
                {s.advertiser}
              </div>
              <DecisionBadge decision={s.expectedDecision} />
            </button>
          );
        })}
      </div>
    </section>
  );
}

function DecisionBadge({ decision }: { decision: string }) {
  const map: Record<string, string> = {
    ALLOW: "#6FB089",
    ALLOW_WITH_CONDITIONS: "#F59E2E",
    RESTRICT: "#9B89B8",
    ESCALATE: "#D97448",
    BLOCK: "#B83A3A",
  };
  const color = map[decision] || "#8FA1B3";
  return (
    <div
      className="mt-2 inline-block text-[10px] uppercase tracking-widest px-2 py-1 rounded"
      style={{
        color,
        background: `${color}15`,
        border: `1px solid ${color}55`,
      }}
    >
      {decision.replace("_", " ")}
    </div>
  );
}
