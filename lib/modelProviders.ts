import type { AIProvider } from "./types";

/**
 * Provider model registry.
 *
 * IMPORTANT — model availability is custom-first.
 *
 * Provider model IDs drift over time and vary by account, region, and
 * platform. A model that worked last quarter can return 404 today, and a
 * preset that works for one account may be unavailable for another. This
 * registry treats presets as **examples only** and never forces them as
 * the only path.
 *
 * Recommended user flow:
 *   1. Load available models (where the provider exposes a list endpoint), OR
 *   2. Enter a custom model ID from the provider console / docs.
 *   3. Presets in this file are example IDs — convenience, not guarantee.
 *
 * Anthropic specifically does NOT have a hardcoded default. The user must
 * load models or paste a model ID their account has access to. This avoids
 * the recurring "claude-3-5-haiku-… returns 404" issue caused by hardcoded
 * defaults going stale.
 */

export interface ModelPreset {
  /** Provider model ID — passed to the provider API verbatim. */
  id: string;
  /** Human-readable label in the dropdown. */
  label: string;
  /** Optional short hint shown under the model preset (e.g., "example"). */
  hint?: string;
}

export interface ProviderMeta {
  id: AIProvider;
  displayName: string;
  /** Short helper copy shown under the provider dropdown. */
  helperText: string;
  /** Example model IDs. Treated as suggestions only, never required. */
  presets: ModelPreset[];
  /**
   * Default preset ID. Empty string = no default — UI prompts user to
   * load models or enter a custom ID. Used for providers (like Anthropic
   * and Azure) where forcing a default produces brittle demo behavior.
   */
  defaultPresetId: string;
  /** Always true — the registry encourages custom model input. */
  allowsCustomModel: true;
  /** True if the provider exposes a model-list endpoint we can call. */
  supportsModelListing: boolean;
  /** Placeholder text for the custom model input. */
  modelPlaceholder: string;
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
    helperText:
      "Enter an OpenAI API key, then load available models or enter any model ID enabled for your account. Presets are examples.",
    presets: [
      { id: "gpt-4o-mini", label: "gpt-4o-mini", hint: "example" },
      { id: "gpt-4o", label: "gpt-4o", hint: "example" },
      { id: "gpt-4.1-mini", label: "gpt-4.1-mini", hint: "example" },
    ],
    defaultPresetId: "gpt-4o-mini",
    allowsCustomModel: true,
    supportsModelListing: true,
    modelPlaceholder: "e.g. gpt-4o-mini or any model ID enabled for your account",
    needs: {},
    docsUrl: "https://platform.openai.com/docs/models",
  },
  {
    id: "azure_openai",
    displayName: "Azure OpenAI",
    helperText:
      "Azure OpenAI uses deployment names, not model IDs. Enter your resource endpoint, deployment name, API version, and API key.",
    presets: [],
    defaultPresetId: "",
    allowsCustomModel: true,
    // Listing deployments requires Azure management-plane permissions —
    // we don't implement that. UI shows a clear "enter deployment name"
    // message instead of a model-list button.
    supportsModelListing: false,
    modelPlaceholder: "your deployment name (not a raw model ID)",
    needs: { endpoint: true, deployment: true, apiVersion: true },
    docsUrl:
      "https://learn.microsoft.com/azure/ai-services/openai/how-to/create-resource",
  },
  {
    id: "anthropic",
    displayName: "Anthropic",
    helperText:
      "Model availability varies by account. Use “Load available models” or copy a model ID from the Anthropic Console / API docs. Presets are examples and may not be available to every account.",
    // Examples only — these are NOT a guarantee that the model is available
    // to a given account, region, or API plan. We do not pick a default so
    // the user is nudged to load or paste a model ID they own.
    presets: [
      { id: "claude-haiku-4-5-20251001", label: "claude-haiku-4-5-20251001", hint: "example" },
      { id: "claude-sonnet-4-6", label: "claude-sonnet-4-6", hint: "example" },
      { id: "claude-opus-4-8", label: "claude-opus-4-8", hint: "example" },
    ],
    defaultPresetId: "",
    allowsCustomModel: true,
    supportsModelListing: true,
    modelPlaceholder:
      "enter model ID, e.g. claude-haiku-4-5-20251001 or another model available to your API account",
    needs: {},
    docsUrl: "https://docs.anthropic.com/en/docs/about-claude/models",
  },
  {
    id: "mistral",
    displayName: "Mistral AI",
    helperText:
      "Enter a Mistral API key, then load available models or enter any model ID enabled for your account. Presets are examples.",
    presets: [
      { id: "mistral-small-latest", label: "mistral-small-latest", hint: "example" },
      { id: "mistral-large-latest", label: "mistral-large-latest", hint: "example" },
      { id: "open-mistral-7b", label: "open-mistral-7b", hint: "example" },
    ],
    defaultPresetId: "mistral-small-latest",
    allowsCustomModel: true,
    supportsModelListing: true,
    modelPlaceholder: "e.g. mistral-small-latest or any model enabled for your account",
    needs: {},
    docsUrl: "https://docs.mistral.ai/getting-started/models/",
  },
  {
    id: "openrouter",
    displayName: "OpenRouter",
    helperText:
      "OpenRouter routes use provider/model format (e.g. openai/gpt-4o-mini). Load available routes or enter any route ID. Presets are examples.",
    presets: [
      { id: "openai/gpt-4o-mini", label: "openai/gpt-4o-mini", hint: "example" },
      { id: "anthropic/claude-3.5-sonnet", label: "anthropic/claude-3.5-sonnet", hint: "example" },
      { id: "meta-llama/llama-3.1-8b-instruct", label: "meta-llama/llama-3.1-8b-instruct", hint: "example" },
    ],
    defaultPresetId: "openai/gpt-4o-mini",
    allowsCustomModel: true,
    supportsModelListing: true,
    modelPlaceholder: "e.g. openai/gpt-4o-mini or any OpenRouter route",
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

// Common normalized error codes returned by the BYOK API routes.
export type ProviderErrorType =
  | "model_not_found"
  | "invalid_api_key"
  | "permission_denied"
  | "region_unavailable"
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

export interface ModelListEntry {
  id: string;
  displayName?: string;
}

export interface ModelListResponse {
  ok: boolean;
  provider: AIProvider;
  models?: ModelListEntry[];
  errorType?: ProviderErrorType;
  message?: string;
  fallbackUsed?: boolean;
}

/** Friendly, demo-safe message for each error type. */
export function friendlyErrorMessage(type: ProviderErrorType, provider: AIProvider): string {
  const name = findProvider(provider)?.displayName ?? provider;
  switch (type) {
    case "model_not_found":
      return `Model not found or not available for this ${name} account. Load available models or enter a model ID available in your account.`;
    case "invalid_api_key":
      return `Invalid API key. Check the key and provider.`;
    case "permission_denied":
      return `Your ${name} account may not have access to this model. Try another model or check your account permissions.`;
    case "region_unavailable":
      return `This model may not be available in your selected ${name} region or platform.`;
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
