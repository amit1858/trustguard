"use client";

import type { EvidenceSection } from "@/lib/evidence";

export default function EvidencePack({ sections }: { sections: EvidenceSection[] }) {
  return (
    <section className="glass rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-semibold">Evidence Pack</div>
        <span className="text-[10px] uppercase tracking-wider text-[var(--ink-2)]">
          Signals Guardian used
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {sections.map((s) => (
          <div
            key={s.label}
            className="glass rounded-lg p-3"
            style={{ borderColor: "rgba(201, 163, 107, 0.18)" }}
          >
            <div className="text-[10px] uppercase tracking-wider text-[var(--ink-2)] mb-2">
              {s.label}
            </div>
            <dl className="text-xs flex flex-col gap-1">
              {s.items.map((it, i) => (
                <div key={i} className="grid grid-cols-[110px_1fr] gap-2">
                  <dt className="text-[var(--ink-2)] truncate">{it.key}</dt>
                  <dd className="text-[var(--ink-1)]">{it.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>
    </section>
  );
}
