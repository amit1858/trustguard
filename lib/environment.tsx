"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type EnvMode = "demo" | "sandbox" | "preprod" | "production";

export interface EnvMeta {
  id: EnvMode;
  label: string;
  short: string;
  description: string;
  color: string;
}

export const ENV_MODES: EnvMeta[] = [
  {
    id: "demo",
    label: "Demo",
    short: "Demo",
    description: "Deterministic walkthrough. Mock events and scenarios.",
    color: "#6FB089",
  },
  {
    id: "sandbox",
    label: "Sandbox",
    short: "Sandbox",
    description: "Internal testing surface. No external systems wired.",
    color: "#C9A36B",
  },
  {
    id: "preprod",
    label: "Pre-prod",
    short: "Pre-prod",
    description: "Integration shape. Connectors stubbed for validation.",
    color: "#F59E2E",
  },
  {
    id: "production",
    label: "Production concept",
    short: "Prod concept",
    description:
      "Production concept mode is illustrative. No real ads systems or external services are connected.",
    color: "#D97448",
  },
];

const LS_KEY = "trustguard.env.v1";

interface EnvContextValue {
  env: EnvMode;
  meta: EnvMeta;
  setEnv: (e: EnvMode) => void;
}

const EnvContext = createContext<EnvContextValue | null>(null);

export function EnvProvider({ children }: { children: ReactNode }) {
  const [env, setEnvState] = useState<EnvMode>("demo");

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const v = window.localStorage.getItem(LS_KEY) as EnvMode | null;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from localStorage on mount
      if (v && ENV_MODES.some((m) => m.id === v)) setEnvState(v);
    } catch {
      /* ignore */
    }
  }, []);

  function setEnv(e: EnvMode) {
    setEnvState(e);
    try {
      window.localStorage.setItem(LS_KEY, e);
    } catch {
      /* ignore */
    }
  }

  const meta = ENV_MODES.find((m) => m.id === env) ?? ENV_MODES[0];

  return (
    <EnvContext.Provider value={{ env, meta, setEnv }}>
      {children}
    </EnvContext.Provider>
  );
}

export function useEnv() {
  const ctx = useContext(EnvContext);
  if (!ctx) throw new Error("useEnv must be used inside <EnvProvider>");
  return ctx;
}
