"use client";

import { useMemo, useState } from "react";
import {
  CONNECTORS,
  CONNECTOR_STATUS_COLORS,
  CONNECTOR_TYPE_COLORS,
  type Connector,
  type ConnectorStatus,
  type ConnectorType,
} from "@/lib/connectors";

const TYPE_FILTERS: ("All" | ConnectorType)[] = [
  "All",
  "Input",
  "Policy",
  "Risk",
  "Execution",
  "Review",
  "Audit",
  "AI Provider",
];

const STATUS_FILTERS: ("All" | ConnectorStatus)[] = [
  "All",
  "Connected",
  "Mocked",
  "Needs Setup",
];

export default function ConnectorsView() {
  const [type, setType] = useState<(typeof TYPE_FILTERS)[number]>("All");
  const [status, setStatus] = useState<(typeof STATUS_FILTERS)[number]>("All");
  const [selected, setSelected] = useState<Connector | null>(null);

  const filtered = useMemo(
    () =>
      CONNECTORS.filter(
        (c) =>
          (type === "All" || c.type === type) &&
          (status === "All" || c.status === status),
      ),
    [type, status],
  );

  return (
    <div className="flex flex-col gap-4">
      <section className="glass rounded-xl p-5">
        <div className="flex items-baseline justify-between mb-1 flex-wrap gap-2">
          <div>
            <div className="section-title">Connector Registry</div>
            <div className="section-heading mt-1">
              Mock integrations that would back a real deployment
            </div>
          </div>
          <span className="pill">prototype · no external calls</span>
        </div>
        <div className="text-xs text-[var(--ink-1)] mt-1 mb-4 max-w-3xl">
          Each connector represents a service TrustGuard would talk to in production —
          inbound risk and policy signals, outbound execution and review systems, and
          BYOK model providers. Today everything is mocked or in-browser.
        </div>

        <div className="flex flex-wrap gap-3 mb-4">
          <FilterGroup label="Type">
            {TYPE_FILTERS.map((t) => (
              <Chip key={t} active={type === t} onClick={() => setType(t)}>
                {t}
              </Chip>
            ))}
          </FilterGroup>
          <FilterGroup label="Status">
            {STATUS_FILTERS.map((s) => (
              <Chip key={s} active={status === s} onClick={() => setStatus(s)}>
                {s}
              </Chip>
            ))}
          </FilterGroup>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] uppercase tracking-wider text-[var(--ink-2)] text-left">
                <th className="py-2 pr-3 font-medium">Connector</th>
                <th className="py-2 pr-3 font-medium">Type</th>
                <th className="py-2 pr-3 font-medium">Direction</th>
                <th className="py-2 pr-3 font-medium">Status</th>
                <th className="py-2 pr-3 font-medium">Last sync</th>
                <th className="py-2 pr-3 font-medium">Used by</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => {
                const sc = CONNECTOR_STATUS_COLORS[c.status];
                const tc = CONNECTOR_TYPE_COLORS[c.type];
                return (
                  <tr
                    key={c.id}
                    onClick={() => setSelected(c)}
                    className="border-t cursor-pointer hover:bg-white/[0.02]"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <td className="py-2.5 pr-3">
                      <div className="text-[13px] font-medium">{c.name}</div>
                      <div className="text-[10px] text-[var(--ink-2)]">{c.id}</div>
                    </td>
                    <td className="py-2.5 pr-3">
                      <span
                        className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full"
                        style={{
                          color: tc,
                          background: tc + "14",
                          border: `1px solid ${tc}55`,
                        }}
                      >
                        {c.type}
                      </span>
                    </td>
                    <td className="py-2.5 pr-3 text-[12px] text-[var(--ink-1)]">
                      {c.direction}
                    </td>
                    <td className="py-2.5 pr-3">
                      <span
                        className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full"
                        style={{
                          color: sc,
                          background: sc + "14",
                          border: `1px solid ${sc}55`,
                        }}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="py-2.5 pr-3 text-[12px] text-[var(--ink-1)]">
                      {c.lastSync}
                    </td>
                    <td className="py-2.5 pr-3 text-[11px] text-[var(--ink-2)]">
                      {c.usedBy.join(", ")}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-xs text-[var(--ink-2)]">
                    No connectors match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {selected && (
        <ConnectorDetailDrawer connector={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

function FilterGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-[10px] uppercase tracking-wider text-[var(--ink-2)]">
        {label}
      </span>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="text-[11px] px-2.5 py-1 rounded-full transition"
      style={{
        color: active ? "#F4EFE7" : "var(--ink-1)",
        background: active ? "var(--accent-soft)" : "transparent",
        border: `1px solid ${active ? "rgba(245, 158, 46, 0.55)" : "var(--border)"}`,
      }}
    >
      {children}
    </button>
  );
}

function ConnectorDetailDrawer({
  connector,
  onClose,
}: {
  connector: Connector;
  onClose: () => void;
}) {
  const sc = CONNECTOR_STATUS_COLORS[connector.status];
  const tc = CONNECTOR_TYPE_COLORS[connector.type];
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0"
        onClick={onClose}
        style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(2px)" }}
      />
      <aside
        className="relative h-full w-full max-w-[560px] overflow-y-auto"
        style={{
          background: "linear-gradient(180deg, #1D1A16 0%, #151310 100%)",
          borderLeft: "1px solid var(--border-warm)",
        }}
      >
        <div
          className="sticky top-0 z-10 px-6 py-4 flex items-center justify-between"
          style={{ background: "rgba(13,12,10,0.95)", borderBottom: "1px solid var(--border)" }}
        >
          <div>
            <div className="section-title">Connector</div>
            <div className="section-heading mt-1">{connector.name}</div>
            <div className="text-[10px] text-[var(--ink-2)] mt-0.5">{connector.id}</div>
          </div>
          <button onClick={onClose} className="btn btn-ghost">Close ✕</button>
        </div>

        <div className="px-6 py-5 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <Meta label="Type" value={connector.type} valueColor={tc} />
            <Meta label="Status" value={connector.status} valueColor={sc} />
            <Meta label="Direction" value={connector.direction} />
            <Meta label="Last sync" value={connector.lastSync} />
          </div>

          <div>
            <div className="section-title mb-2">Used by</div>
            <div className="flex flex-wrap gap-1.5">
              {connector.usedBy.map((u) => (
                <span key={u} className="chip">{u}</span>
              ))}
            </div>
          </div>

          <div>
            <div className="section-title mb-2">Future integration note</div>
            <div
              className="rounded-lg p-3 text-[12px] text-[var(--ink-1)] leading-relaxed"
              style={{ background: "var(--bg-2)", border: "1px solid var(--border)" }}
            >
              {connector.note}
            </div>
          </div>

          <div
            className="rounded-lg p-3 text-[11px]"
            style={{
              background: "rgba(245, 158, 46, 0.06)",
              border: "1px solid rgba(245, 158, 46, 0.28)",
              color: "var(--ink-1)",
            }}
          >
            No external calls are made from this prototype. This view shows the integration
            shape only.
          </div>
        </div>
      </aside>
    </div>
  );
}

function Meta({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <div
      className="rounded-lg p-3 border"
      style={{ borderColor: "var(--border)", background: "var(--bg-2)" }}
    >
      <div className="text-[10px] uppercase tracking-wider text-[var(--ink-2)]">{label}</div>
      <div
        className="text-[13px] font-medium mt-1"
        style={{ color: valueColor ?? "var(--ink-0)" }}
      >
        {value}
      </div>
    </div>
  );
}
