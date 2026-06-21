"use client";

import { useState } from "react";
import PresenterDrawer from "@/components/PresenterDrawer";
import { EXECUTIVE_DEMO_STEPS } from "@/lib/executiveDemo";
import type { DeepLinkState } from "@/lib/deepLinks";

interface Props {
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  /**
   * Navigate the parent app to a deep link target. Caller should set the right
   * view (and any case/scenario/event IDs) so the highlighted target is visible.
   */
  onNavigate: (link: DeepLinkState) => void;
}

export default function ExecutiveDemoButton({ open, onOpen, onClose, onNavigate }: Props) {
  const [idx, setIdx] = useState(0);

  function handleOpen() {
    setIdx(0);
    onOpen();
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition"
        style={{
          borderColor: "rgba(245, 158, 46, 0.55)",
          background:
            "linear-gradient(90deg, rgba(245, 158, 46, 0.18), rgba(201, 163, 107, 0.18))",
          color: "#F4EFE7",
          fontWeight: 500,
        }}
        title="Run the 7-step executive walkthrough"
      >
        🎬 Executive Demo
      </button>

      <PresenterDrawer
        open={open}
        onClose={onClose}
        steps={EXECUTIVE_DEMO_STEPS}
        idx={idx}
        setIdx={setIdx}
        eyebrow="Executive demo · 7 steps"
        title="TrustGuard for Ads Trust & Safety leaders"
        onNavigate={onNavigate}
        copyLinkState={{ view: "control-plane" }}
      />
    </>
  );
}
