export default function WhyTrustSafety() {
  return (
    <section
      className="glass-strong p-6 relative overflow-hidden"
      style={{
        border: "1.5px solid rgba(245, 158, 46, 0.45)",
        boxShadow: "0 0 30px rgba(245, 158, 46, 0.18)",
      }}
    >
      <div
        className="absolute -top-20 -right-20 w-72 h-72 rounded-full blur-3xl opacity-30"
        style={{ background: "radial-gradient(circle, #F59E2E, transparent 60%)" }}
      />
      <div className="relative">
        <div className="text-xs uppercase tracking-widest text-[var(--ink-2)] mb-2">
          Why this matters for Ads Trust &amp; Safety
        </div>
        <div className="text-lg md:text-xl font-semibold leading-snug grad-text max-w-3xl">
          From post-facto review to runtime control.
        </div>
        <p className="text-sm text-[var(--ink-0)]/90 mt-3 max-w-3xl leading-relaxed">
          As ads workflows become more agentic, Trust &amp; Safety needs to move from post-facto review to runtime control. Guardian Agent helps intercept risky advertiser actions, campaign launches, targeting changes, budget increases, and appeal decisions <em>before</em> they create user, advertiser, platform, or regulatory harm.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {[
            "Runtime, not post-facto",
            "Policy-gated agent actions",
            "Auditable & explainable",
            "Human review on high risk",
          ].map((t) => (
            <span
              key={t}
              className="pill"
              style={{ borderColor: "rgba(245, 158, 46, 0.5)", color: "#f5d0fe" }}
            >
              {t}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
