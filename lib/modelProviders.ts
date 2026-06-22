import type { AIProvider } from "./types";

/**
 * Provider model registry.
 *
 * IMPORTANT — model IDs drift over time. Each provider deprecates/renames
 * model IDs on their own schedule, so a hardcoded "default" model that ships
 * today can return 404 in three months. This registry is structured so that:
 *
 *   1. Presets are suggestions only; the UI always allows a custom model ID.
 *   2. Defaults use dated/stable model IDs ("YYYY-MM-DD") wherever the
 *      provider supports them, because dated IDs are pinned and don't move.
 *   3. If a preset returns "model not found", the UI surfaces a friendly
 *      error and tells the user to enter a custom model ID from their account.
 *
 * Before a demo: visit the provider's docs and confirm a preset still works,
 * or enter the model ID you know is enabled in your account.
 */

export interface ModelPreset {
  /** Provider model ID — passed to the provider API verbatim. */
  id: string;
  /** Human-readable label in the dropdown. */
  label: string;
  /** Optional short hint shown under the model preset (e.g., "low cost"). */
  hint?: string;
}

export interface ProviderMeta {
  id: AIProvider;
  displayName: string;
  /** Short helper copy shown under the provider dropdown. */
  helperText: string;
  /** Suggested model presets. Customers can always override with a custom ID. */
  presets: ModelPreset[];
  /** Default preset index (0 by default). The default is a suggestion. */
  defaultPresetId: string;
  /** Always true today — the registry encourages custom model input. */
  allowsCustomModel: true;
  /** What extra fields this provider needs in the BYOK UI. */
  needs: {
    endpoint?: boolean;
    deployment?: boolean;
    apiVersion?: boolean;
  };
  /** Brief docs link surfaced to the user. */
  docsUrl: string;
}

export const PROVIDERS: ProviderMeta[] = [
  {
    id: "openai",
    displayName: "OpenAI",
    helperText: "Enter an OpenAI API key and a model ID enabled for your account.",
    presets: [
      { id: "gpt-4o-mini", label: "gpt-4o-mini", hint: "low cost · fast" },
      { id: "gpt-4o", label: "gpt-4o", hint: "stronger" },
      { id: "gpt-4.1-mini", label: "gpt-4.1-mini", hint: "alternative" },
    ],
    defaultPresetId: "gpt-4o-mini",
    allowsCustomModel: true,
    needs: {},
    docsUrl: "https://platform.openai.com/docs/models",
  },
  {
    id: "azure_openai",
    displayName: "Azure OpenAI",
    helperText:
      "Enter your Azure resource endpoint, deployment name (not model name), and API key.",
    // Azure model field is a *deployment name* unique to the customer's
    // resource — no global presets are meaningful. The UI hides the preset
    // dropdown for Azure and shows a deployment-name input instead.
    presets: [],
    defaultPresetId: "",
    allowsCustomModel: true,
    needs: { endpoint: true, deployment: true, apiVersion: true },
    docsUrl:
      "https://learn.microsoft.com/azure/ai-services/openai/how-to/create-resource",
  },
  {
    id: "anthropic",
    displayName: "Anthropic",
    helperText:
      "Enter an Anthropic API key and a currently available Claude model ID. Dated IDs (claude-3-5-…-2024xxxx) are pinned and most stable.",
    // Dated stable IDs — Anthropic pins these. The `-latest` aliases tend to
    // 404 once a model rolls forward, which is what caused the original bug.
    presets: [
      {
        id: "claude-3-5-haiku-20241022",
        label: "claude-3-5-haiku-20241022",
        hint: "low cost · dated",
      },
      {
        id: "claude-3-5-sonnet-20241022",
        label: "claude-3-5-sonnet-20241022",
        hint: "stronger · dated",
      },
      {
        id: "claude-3-haiku-20240307",
        label: "claude-3-haiku-20240307",
        hint: "older · cheap",
      },
    ],
    defaultPresetId: "claude-3-5-haiku-20241022",
    allowsCustomModel: true,
    needs: {},
    docsUrl: "https://docs.anthropic.com/en/docs/about-claude/models",
  },
  {
    id: "mistral",
    displayName: "Mistral AI",
    helperText: "Enter a Mistral API key and a model ID enabled for your account.",
    presets: [
      { id: "mistral-small-latest", label: "mistral-small-latest", hint: "low cost" },
      { id: "mistral-large-latest", label: "mistral-large-latest", hint: "stronger" },
      { id: "open-mistral-7b", label: "open-mistral-7b", hint: "open weights" },
    ],
    defaultPresetId: "mistral-small-latest",
    allowsCustomModel: true,
    needs: {},
    docsUrl: "https://docs.mistral.ai/getting-started/models/",
  },
  {
    id: "openrouter",
    displayName: "OpenRouter",
    helperText:
      "Enter an OpenRouter API key and a model route in provider/model form (e.g. openai/gpt-4o-mini).",
    presets: [
      { id: "openai/gpt-4o-mini", label: "openai/gpt-4o-mini", hint: "low cost" },
      {
        id: "anthropic/claude-3.5-haiku",
        label: "anthropic/claude-3.5-haiku",
        hint: "Claude",
      },
      {
        id: "meta-llama/llama-3.1-8b-instruct",
        label: "meta-llama/llama-3.1-8b-instruct",
        hint: "open",
      },
    ],
    defaultPresetId: "openai/gpt-4o-mini",
    allowsCustomModel: true,
    needs: {},
    docsUrl: "https://openrouter.ai/models",
  },
];

export function findProvider(id: AIProvider): ProviderMeta | undefined {
  return PROVIDERS.find((p) => p.id === id);
}

export function getDefaultModelFor(id: AIProvider): string {
  return findProvider(id)?.defaultPresetId ?? "";
}

// Common normalized error codes returned by the BYOK API route.
export type ProviderErrorType =
  | "model_not_found"
  | "invalid_api_key"
  | "rate_limited"
  | "provider_unavailable"
  | "malformed_request"
  | "network_error"
  | "unknown_error";

export interface AIRouteResponse {
  ok: boolean;
  provider: AIProvider;
  model: string;
  task: string;
  text?: string;
  errorType?: ProviderErrorType;
  message?: string;
  /** True when AI failed and the client should fall back to deterministic mode. */
  fallbackUsed: boolean;
}

/** Friendly, demo-safe message for each error type. */
export function friendlyErrorMessage(type: ProviderErrorType, provider: AIProvider): string {
  const name = findProvider(provider)?.displayName ?? provider;
  switch (type) {
    case "model_not_found":
      return `Model not found for ${name}. Choose another preset or enter a custom model ID available in your account.`;
    case "invalid_api_key":
      return `Invalid API key for ${name}. Check the key and try again.`;
    case "rate_limited":
      return `${name} rate-limited the request. Try again in a moment.`;
    case "provider_unavailable":
      return `${name} is temporarily unavailable. Falling back to deterministic mode.`;
    case "malformed_request":
      return `The request to ${name} was malformed. Check the model ID and required fields.`;
    case "network_error":
      return `Network error reaching ${name}. Falling back to deterministic mode.`;
    case "unknown_error":
    default:
      return `${name} returned an unexpected error. Falling back to deterministic mode.`;
  }
}
