export type ReadinessStatus = "Built" | "Mocked" | "Next" | "Production Required";

export interface ReadinessItem {
  category: string;
  built: string;
  mocked: string;
  needed: string;
  production: string;
  status: ReadinessStatus;
}

export const READINESS_ITEMS: ReadinessItem[] = [
  {
    category: "Event ingestion",
    built: "Deterministic in-memory feed of agentic ads events",
    mocked: "All 10 events derived from scenarios + synthetic pending",
    needed: "Real-time stream from ads-orchestrator (Kafka/PubSub/webhook)",
    production: "Durable queue, replay, idempotency, source authentication",
    status: "Mocked",
  },
  {
    category: "Policy rules service",
    built: "Versioned governance metadata, severity, status, owners",
    mocked: "8 in-repo rules in lib/policies.ts evaluated by deterministic kernel",
    needed: "External rule store with rollout, A/B, and approval workflow",
    production: "Rule SLO, rollback, market/vertical targeting, change review",
    status: "Built",
  },
  {
    category: "Agent identity",
    built: "Source agent + system fields shown on every runtime event",
    mocked: "Agent identity is string-only; no signature verification",
    needed: "Signed agent tokens / mTLS so Guardian knows who is asking",
    production: "Agent registry, scopes, rate limits, key rotation",
    status: "Next",
  },
  {
    category: "Tool / action authorization",
    built: "Guardian decision returns allowedActions and blockedActions",
    mocked: "Execution layer is a JSON payload — no real calls fire",
    needed: "Wire enforcement into the ads-execution API as a policy gate",
    production: "Atomic gate: nothing ships without Guardian audit reference",
    status: "Production Required",
  },
  {
    category: "Human review queue",
    built: "Review Queue, Case Detail, operator actions, immutable Guardian decision",
    mocked: "Persistence is browser localStorage",
    needed: "Server-side case store + assignment, SLA, multi-reviewer",
    production: "Durable cases, audit-grade outcomes, evidence retention",
    status: "Built",
  },
  {
    category: "Audit store",
    built: "Decision ledger, outcome records, export audit pack JSON",
    mocked: "Ledger persisted in localStorage; export is client-side download",
    needed: "Append-only, tamper-evident server store with retention policy",
    production: "WORM storage, signed entries, regulatory export",
    status: "Mocked",
  },
  {
    category: "BYOK / model provider",
    built: "Provider config, masked key, server-side /api/ai route",
    mocked: "Key is in-session only; deterministic fallback always wins",
    needed: "Key vaulting, per-tenant isolation, redaction at egress",
    production: "Customer-managed keys, telemetry, abuse controls",
    status: "Built",
  },
  {
    category: "Monitoring and telemetry",
    built: "Control Plane metrics + insight cards from scenario data",
    mocked: "Metrics are computed in-browser from deterministic data",
    needed: "Real metrics pipeline: decisions/sec, override rates, SLA",
    production: "SLO dashboards, alerting, decision drift detection",
    status: "Next",
  },
];

export const READINESS_COLORS: Record<ReadinessStatus, string> = {
  Built: "#6FB089",
  Mocked: "#C9A36B",
  Next: "#F59E2E",
  "Production Required": "#D97448",
};
