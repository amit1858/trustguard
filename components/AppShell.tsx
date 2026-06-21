"use client";

import { useState } from "react";

export type ViewId =
  | "control-plane"
  | "review-queue"
  | "policy-console"
  | "simulation-lab"
  | "runtime-events"
  | "connectors"
  | "audit-log"
  | "byok-settings";

interface NavItem {
  id: ViewId;
  label: string;
  icon: string;
  hint: string;
}

const NAV: NavItem[] = [
  { id: "control-plane", label: "Control Plane", icon: "◎", hint: "Live scenarios" },
  { id: "review-queue", label: "Review Queue", icon: "▤", hint: "Operator cases" },
  { id: "policy-console", label: "Policy Console", icon: "§", hint: "Rules & matches" },
  { id: "simulation-lab", label: "Simulation Lab", icon: "△", hint: "What-if testing" },
  { id: "runtime-events", label: "Runtime Events", icon: "⟳", hint: "Agentic event feed" },
  { id: "connectors", label: "Connectors", icon: "⇆", hint: "Integration shape" },
  { id: "audit-log", label: "Audit Log", icon: "≡", hint: "Decision ledger" },
  { id: "byok-settings", label: "BYOK Settings", icon: "⚙", hint: "AI provider" },
];

export default function AppShell({
  current,
  onNavigate,
  children,
}: {
  current: ViewId;
  onNavigate: (id: ViewId) => void;
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen">
      <aside
        className={`shrink-0 sticky top-0 h-screen border-r transition-all ${
          collapsed ? "w-[68px]" : "w-[232px]"
        }`}
        style={{
          background:
            "linear-gradient(180deg, rgba(21, 19, 16, 0.92) 0%, rgba(13, 12, 10, 0.96) 100%)",
          borderColor: "var(--border)",
        }}
      >
        <div className="px-4 pt-5 pb-5 flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-md grid place-items-center text-[11px] font-bold tracking-wider"
            style={{
              background:
                "linear-gradient(135deg, #F59E2E 0%, #C9A36B 100%)",
              color: "#0D0C0A",
              boxShadow: "0 0 12px rgba(245, 158, 46, 0.25)",
            }}
          >
            TG
          </div>
          {!collapsed && (
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold tracking-tight">TrustGuard</span>
              <span className="text-[10px] uppercase tracking-wider text-[var(--ink-2)]">
                Trust &amp; Safety
              </span>
            </div>
          )}
        </div>

        <div className="px-3 pb-2">
          <div className="h-px bg-[var(--border)]" />
        </div>

        <nav className="px-2 py-2 flex flex-col gap-0.5">
          {NAV.map((item) => {
            const active = item.id === current;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className="group w-full text-left rounded-md px-3 py-2 transition relative"
                style={{
                  background: active
                    ? "linear-gradient(90deg, rgba(245, 158, 46, 0.14), rgba(245, 158, 46, 0.04))"
                    : "transparent",
                  border: active
                    ? "1px solid rgba(245, 158, 46, 0.32)"
                    : "1px solid transparent",
                }}
                title={collapsed ? item.label : undefined}
              >
                {active && (
                  <span
                    className="absolute left-0 top-1.5 bottom-1.5 w-[2px] rounded-r"
                    style={{ background: "#F59E2E" }}
                  />
                )}
                <div className="flex items-center gap-3">
                  <span
                    className="text-[15px] w-5 text-center"
                    style={{ color: active ? "#F59E2E" : "var(--ink-2)" }}
                  >
                    {item.icon}
                  </span>
                  {!collapsed && (
                    <div className="flex flex-col leading-tight">
                      <span
                        className="text-[13px] font-medium"
                        style={{ color: active ? "#F4EFE7" : "var(--ink-1)" }}
                      >
                        {item.label}
                      </span>
                      <span className="text-[10px] text-[var(--ink-2)]">{item.hint}</span>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </nav>

        <div className="absolute bottom-3 left-0 right-0 px-3">
          <button
            onClick={() => setCollapsed((v) => !v)}
            className="w-full pill text-xs"
            style={{ borderColor: "var(--border)" }}
          >
            {collapsed ? "›" : "‹ Collapse"}
          </button>
        </div>
      </aside>

      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
