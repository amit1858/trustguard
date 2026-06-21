"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type Persona = "operator" | "policy_lead" | "product_leader" | "auditor";

export interface PersonaMeta {
  id: Persona;
  label: string;
  short: string;
  hint: string;
  focusView: import("@/components/AppShell").ViewId;
}

export const PERSONAS: PersonaMeta[] = [
  {
    id: "operator",
    label: "T&S Operator",
    short: "Operator",
    hint: "Focus: Review Queue, SLA, case handling.",
    focusView: "review-queue",
  },
  {
    id: "policy_lead",
    label: "Policy Lead",
    short: "Policy",
    hint: "Focus: Policy Console, Simulation Lab, rule impact.",
    focusView: "policy-console",
  },
  {
    id: "product_leader",
    label: "Product Leader",
    short: "Product",
    hint: "Focus: Control Plane metrics, decision distribution, insight cards.",
    focusView: "control-plane",
  },
  {
    id: "auditor",
    label: "Auditor",
    short: "Auditor",
    hint: "Focus: Audit Log, immutable Guardian decisions, exportable payloads.",
    focusView: "audit-log",
  },
];

interface Ctx {
  persona: Persona;
  setPersona: (p: Persona) => void;
  meta: PersonaMeta;
}

const PersonaContext = createContext<Ctx | null>(null);

const LS_KEY = "trustguard.persona.v1";

export function PersonaProvider({ children }: { children: React.ReactNode }) {
  const [persona, setPersonaState] = useState<Persona>("operator");
  useEffect(() => {
    try {
      const v = window.localStorage.getItem(LS_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from localStorage on mount
      if (v && PERSONAS.some((p) => p.id === v)) setPersonaState(v as Persona);
    } catch {
      /* ignore */
    }
  }, []);
  function setPersona(p: Persona) {
    setPersonaState(p);
    try {
      window.localStorage.setItem(LS_KEY, p);
    } catch {
      /* ignore */
    }
  }
  const meta = PERSONAS.find((p) => p.id === persona) ?? PERSONAS[0];
  return (
    <PersonaContext.Provider value={{ persona, setPersona, meta }}>
      {children}
    </PersonaContext.Provider>
  );
}

export function usePersona(): Ctx {
  const c = useContext(PersonaContext);
  if (!c) throw new Error("usePersona must be used within PersonaProvider");
  return c;
}
