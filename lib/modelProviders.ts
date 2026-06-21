import type { AIProvider } from "./types";

export interface ProviderMeta {
  id: AIProvider;
  label: string;
  defaultModel: string;
  needs: { endpoint?: boolean; deployment?: boolean; apiVersion?: boolean };
}

export const PROVIDERS: ProviderMeta[] = [
  { id: "azure_openai", label: "Azure OpenAI", defaultModel: "gpt-4o-mini",
    needs: { endpoint: true, deployment: true, apiVersion: true } },
  { id: "openai", label: "OpenAI", defaultModel: "gpt-4o-mini", needs: {} },
  { id: "anthropic", label: "Anthropic", defaultModel: "claude-3-5-haiku-latest", needs: {} },
  { id: "mistral", label: "Mistral AI", defaultModel: "mistral-small-latest", needs: {} },
  { id: "openrouter", label: "OpenRouter", defaultModel: "openai/gpt-4o-mini", needs: {} },
];

export function findProvider(id: AIProvider) {
  return PROVIDERS.find((p) => p.id === id);
}
