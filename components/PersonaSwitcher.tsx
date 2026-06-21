"use client";

import { PERSONAS, usePersona, type Persona } from "@/lib/persona";

export default function PersonaSwitcher() {
  const { persona, setPersona, meta } = usePersona();
  return (
    <div className="flex flex-col gap-1">
      <div
        className="glass rounded-md px-2 py-1 flex items-center gap-1"
        title="Persona switcher (changes UI emphasis only)"
      >
        {PERSONAS.map((p) => {
          const active = p.id === persona;
          return (
            <button
              key={p.id}
              onClick={() => setPersona(p.id as Persona)}
              className="text-[10px] uppercase tracking-wider px-2 py-1 rounded transition"
              style={{
                background: active
                  ? "linear-gradient(90deg, rgba(245, 158, 46, 0.18), rgba(245, 158, 46, 0.06))"
                  : "transparent",
                color: active ? "#F4EFE7" : "var(--ink-2)",
                border: active ? "1px solid rgba(245, 158, 46, 0.45)" : "1px solid transparent",
              }}
            >
              {p.short}
            </button>
          );
        })}
      </div>
      <div className="text-[10px] text-[var(--ink-2)] px-1 max-w-[280px]">{meta.hint}</div>
    </div>
  );
}
