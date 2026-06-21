export default function Header({ rightSlot }: { rightSlot?: React.ReactNode }) {
  const pills = ["BYOK Enabled", "Policy-Gated", "Human-in-the-loop", "Audit Ready"];
  return (
    <header className="glass-strong p-6 md:p-8 relative overflow-hidden">
      <div
        className="absolute -top-32 -right-32 w-96 h-96 rounded-full blur-3xl opacity-25"
        style={{ background: "radial-gradient(circle, #F59E2E, transparent 60%)" }}
      />
      <div
        className="absolute -bottom-40 -left-32 w-96 h-96 rounded-full blur-3xl opacity-15"
        style={{ background: "radial-gradient(circle, #C9A36B, transparent 60%)" }}
      />

      <div className="relative flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{
                background:
                  "linear-gradient(135deg, rgba(245, 158, 46, 0.22), rgba(245, 158, 46, 0.06))",
                border: "1px solid rgba(245, 158, 46, 0.35)",
                boxShadow: "0 0 18px rgba(245, 158, 46, 0.18)",
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 2l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6l8-4z"
                  stroke="#F59E2E"
                  strokeWidth="1.6"
                />
              </svg>
            </div>
            <div className="text-3xl md:text-4xl font-semibold tracking-tight grad-text">
              TrustGuard
            </div>
          </div>
          <div className="text-lg md:text-xl text-[var(--ink-0)]/95 font-medium">
            Guardian Agent for Ads Trust &amp; Safety
          </div>
          <div className="text-sm text-[var(--ink-1)] mt-1 max-w-2xl">
            Runtime trust-and-safety control layer for agentic ads workflows.
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            {pills.map((p) => (
              <span key={p} className="pill">{p}</span>
            ))}
          </div>
        </div>

        {rightSlot && <div className="shrink-0">{rightSlot}</div>}
      </div>
    </header>
  );
}
