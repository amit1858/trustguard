import type { ViewId } from "@/components/AppShell";

export interface DeepLinkState {
  view?: ViewId;
  case?: string;
  event?: string;
  scenario?: string;
  policy?: string;
  agent?: string; // Phase 3C: agent-governance deep link
}

export function parseDeepLink(search: string): DeepLinkState {
  if (typeof window === "undefined") return {};
  try {
    const u = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
    const view = u.get("view") as ViewId | null;
    return {
      view: view ?? undefined,
      case: u.get("case") ?? undefined,
      event: u.get("event") ?? undefined,
      scenario: u.get("scenario") ?? undefined,
      policy: u.get("policy") ?? undefined,
      agent: u.get("agent") ?? undefined,
    };
  } catch {
    return {};
  }
}

export function buildDeepLink(state: DeepLinkState): string {
  if (typeof window === "undefined") return "";
  const u = new URLSearchParams();
  if (state.view) u.set("view", state.view);
  if (state.case) u.set("case", state.case);
  if (state.event) u.set("event", state.event);
  if (state.scenario) u.set("scenario", state.scenario);
  if (state.policy) u.set("policy", state.policy);
  if (state.agent) u.set("agent", state.agent);
  const q = u.toString();
  const base = `${window.location.origin}${window.location.pathname}`;
  return q ? `${base}?${q}` : base;
}

export function syncDeepLink(state: DeepLinkState) {
  if (typeof window === "undefined") return;
  const url = buildDeepLink(state);
  try {
    window.history.replaceState(null, "", url);
  } catch {
    /* ignore */
  }
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    // Fallback
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}
