"use client";

import { useMemo, useState, useEffect } from "react";
import type { Scenario, GuardianOutput } from "@/lib/types";
import { buildWalkthrough } from "@/lib/walkthrough";
import PresenterDrawer, { type PresenterStep } from "@/components/PresenterDrawer";

/**
 * Presenter Mode wrapper.
 *
 * This is now a thin wrapper around the shared PresenterDrawer so the demo
 * walkthrough is shown as a non-intrusive right-side drawer — not a heavy
 * full-screen modal. The app stays visible and interactive during a live demo.
 */
export default function WalkthroughModal({
  open,
  onClose,
  scenario,
  guardian,
}: {
  open: boolean;
  onClose: () => void;
  scenario: Scenario;
  guardian: GuardianOutput;
}) {
  const steps = useMemo<PresenterStep[]>(
    () =>
      buildWalkthrough(scenario, guardian).map((s) => ({
        key: s.key,
        title: s.title,
        body: s.body,
        scenarioNote: s.scenarioNote,
        highlightId: s.highlightId,
      })),
    [scenario, guardian],
  );

  const [idx, setIdx] = useState(0);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset step index when drawer opens or scenario changes
    if (open) setIdx(0);
  }, [open, scenario.id]);

  return (
    <PresenterDrawer
      open={open}
      onClose={onClose}
      steps={steps}
      idx={idx}
      setIdx={setIdx}
      eyebrow="Presenter Mode · Walkthrough"
      title={`Scenario: ${scenario.title}`}
      copyLinkState={{ view: "control-plane", scenario: scenario.id }}
    />
  );
}
