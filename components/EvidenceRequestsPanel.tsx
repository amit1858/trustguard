"use client";

import { useState } from "react";
import {
  EVIDENCE_CATEGORY_LABELS,
  EVIDENCE_REQUEST_STATUS_COLORS,
  EVIDENCE_REQUEST_STATUS_LABELS,
} from "@/lib/cases";
import type { CaseActions } from "@/lib/caseStore";
import type { EvidenceCategory, EvidenceRequest, EvidenceRequestStatus } from "@/lib/types";

const CATEGORIES: EvidenceCategory[] = [
  "business_verification",
  "certification_document",
  "landing_page_disclosure",
  "claim_substantiation",
  "payment_instrument_proof",
  "appeal_explanation",
];

function fmtTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export default function EvidenceRequestsPanel({
  caseId,
  evidenceRequests,
  actions,
}: {
  caseId: string;
  evidenceRequests: EvidenceRequest[];
  actions: CaseActions;
}) {
  const [addOpen, setAddOpen] = useState(false);
  const [newCategory, setNewCategory] = useState<EvidenceCategory>("business_verification");
  const [newNote, setNewNote] = useState("");

  function handleAdd() {
    actions.addEvidenceRequest(caseId, newCategory, newNote.trim() || undefined);
    setNewCategory("business_verification");
    setNewNote("");
    setAddOpen(false);
  }

  function handleStatusChange(req: EvidenceRequest, status: EvidenceRequestStatus) {
    actions.updateEvidenceRequest(caseId, req.id, status);
  }

  return (
    <section className="glass rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-semibold">Evidence Requests</div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-wider text-[var(--ink-2)]">
            {evidenceRequests.length} request{evidenceRequests.length !== 1 ? "s" : ""}
          </span>
          <button
            onClick={() => setAddOpen((v) => !v)}
            className="pill text-[10px]"
            style={{ borderColor: "rgba(201, 163, 107, 0.5)", color: "#C9A36B" }}
          >
            + Add request
          </button>
        </div>
      </div>

      {/* Add form */}
      {addOpen && (
        <div
          className="mb-4 p-3 rounded-lg border"
          style={{ borderColor: "rgba(201, 163, 107, 0.25)", background: "rgba(201, 163, 107, 0.05)" }}
        >
          <div className="text-xs font-medium mb-2 text-[var(--ink-1)]">New evidence request</div>
          <div className="flex flex-wrap gap-2 items-end">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-[var(--ink-2)] uppercase tracking-wider">Category</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as EvidenceCategory)}
                className="bg-black/40 border border-white/10 rounded-md px-2 py-1 text-xs"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {EVIDENCE_CATEGORY_LABELS[cat]}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1 flex-1 min-w-[180px]">
              <label className="text-[10px] text-[var(--ink-2)] uppercase tracking-wider">Note (optional)</label>
              <input
                type="text"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Describe what is needed&hellip;"
                className="bg-black/40 border border-white/10 rounded-md px-2 py-1 text-xs w-full"
              />
            </div>
            <button
              onClick={handleAdd}
              className="pill text-xs"
              style={{ borderColor: "rgba(111,176,137,0.5)", color: "#6FB089" }}
            >
              Add
            </button>
            <button
              onClick={() => setAddOpen(false)}
              className="pill text-xs"
              style={{ borderColor: "rgba(255,255,255,0.1)", color: "var(--ink-2)" }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {evidenceRequests.length === 0 && (
        <div className="text-xs text-[var(--ink-2)]">
          No evidence requests yet. Use &ldquo;+ Add request&rdquo; to create one.
        </div>
      )}

      {/* Request rows */}
      <div className="flex flex-col gap-2">
        {evidenceRequests.map((req) => {
          const statusColor = EVIDENCE_REQUEST_STATUS_COLORS[req.status] ?? "#7F776B";
          const statusLabel = EVIDENCE_REQUEST_STATUS_LABELS[req.status] ?? req.status;
          return (
            <div
              key={req.id}
              className="rounded-lg p-3 border flex flex-col gap-2"
              style={{ borderColor: statusColor + "25", background: statusColor + "08" }}
            >
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-medium">
                      {EVIDENCE_CATEGORY_LABELS[req.category]}
                    </span>
                    <span
                      className="pill text-[10px]"
                      style={{ borderColor: statusColor + "60", color: statusColor }}
                    >
                      {statusLabel}
                    </span>
                  </div>
                  {req.note && (
                    <div className="text-[11px] text-[var(--ink-2)] mt-1">{req.note}</div>
                  )}
                  <div className="text-[10px] text-[var(--ink-2)] mt-1 tabular-nums">
                    Requested {fmtTime(req.requestedAt)}
                    {req.updatedAt && ` · Updated ${fmtTime(req.updatedAt)}`}
                  </div>
                </div>
                <div className="flex gap-1 flex-wrap shrink-0">
                  {req.status !== "received" && (
                    <button
                      onClick={() => handleStatusChange(req, "received")}
                      className="pill text-[10px]"
                      style={{ borderColor: "#8FA1B360", color: "#8FA1B3" }}
                    >
                      Mark received
                    </button>
                  )}
                  {req.status !== "insufficient" && (
                    <button
                      onClick={() => handleStatusChange(req, "insufficient")}
                      className="pill text-[10px]"
                      style={{ borderColor: "#B83A3A60", color: "#B83A3A" }}
                    >
                      Mark insufficient
                    </button>
                  )}
                  {req.status !== "accepted" && (
                    <button
                      onClick={() => handleStatusChange(req, "accepted")}
                      className="pill text-[10px]"
                      style={{ borderColor: "#6FB08960", color: "#6FB089" }}
                    >
                      Mark accepted
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
