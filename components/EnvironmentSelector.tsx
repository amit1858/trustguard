"use client";

import { ENV_MODES, useEnv, type EnvMode } from "@/lib/environment";

export default function EnvironmentSelector() {
  const { env, meta, setEnv } = useEnv();
  return (
    <div className="flex flex-col gap-1">
      <div
        className="glass rounded-md px-2 py-1 flex items-center gap-1"
        title="Environment mode (visual only — affects emphasis and banners)"
      >
        {ENV_MODES.map((m) => {
          const active = m.id === env;
          return (
            <button
              key={m.id}
              onClick={() => setEnv(m.id as EnvMode)}
              className="text-[10px] uppercase tracking-wider px-2 py-1 rounded transition"
              style={{
                background: active
                  ? `linear-gradient(90deg, ${m.color}22, ${m.color}08)`
                  : "transparent",
                color: active ? "#F4EFE7" : "var(--ink-2)",
                border: active
                  ? `1px solid ${m.color}80`
                  : "1px solid transparent",
              }}
            >
              {m.short}
            </button>
          );
        })}
      </div>
      <div className="text-[10px] text-[var(--ink-2)] px-1 max-w-[300px] leading-tight">
        {meta.description}
      </div>
    </div>
  );
}

export function ProductionWarningBanner() {
  const { env, meta } = useEnv();
  if (env !== "production") return null;
  return (
    <div
      className="rounded-lg px-4 py-3 text-xs flex items-start gap-3"
      style={{
        background: "rgba(217, 116, 72, 0.10)",
        border: "1px solid rgba(217, 116, 72, 0.45)",
        color: "#F4EFE7",
      }}
    >
      <span className="text-base leading-none">⚠</span>
      <div>
        <div className="font-semibold mb-0.5">Production concept mode</div>
        <div className="text-[var(--ink-1)]">{meta.description}</div>
      </div>
    </div>
  );
}
