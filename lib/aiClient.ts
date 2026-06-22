import type { AIProvider } from "./types";
import type { ProviderErrorType } from "./modelProviders";

export interface AICallParams {
  provider: AIProvider;
  apiKey: string;
  modelName: string;
  prompt: string;
  system: string;
  azureEndpoint?: string;
  azureDeployment?: string;
  azureApiVersion?: string;
}

/**
 * Thrown by provider adapters with a normalized error type so the BYOK route
 * can return a friendly, demo-safe message to the client without leaking the
 * raw provider error or the API key.
 */
export class ProviderError extends Error {
  errorType: ProviderErrorType;
  /** Raw provider message (already key-scrubbed). Surfaced only as collapsed technical detail. */
  rawDetail?: string;
  constructor(errorType: ProviderErrorType, message: string, rawDetail?: string) {
    super(message);
    this.errorType = errorType;
    this.rawDetail = rawDetail;
  }
}

export async function callModel(p: AICallParams): Promise<string> {
  switch (p.provider) {
    case "openai":
      return openAICompat("https://api.openai.com/v1/chat/completions", p);
    case "openrouter":
      return openAICompat("https://openrouter.ai/api/v1/chat/completions", p);
    case "mistral":
      return openAICompat("https://api.mistral.ai/v1/chat/completions", p);
    case "azure_openai":
      return azureOpenAI(p);
    case "anthropic":
      return anthropic(p);
  }
}

async function openAICompat(url: string, p: AICallParams): Promise<string> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${p.apiKey}`,
      },
      body: JSON.stringify({
        model: p.modelName,
        temperature: 0.2,
        max_tokens: 400,
        messages: [
          { role: "system", content: p.system },
          { role: "user", content: p.prompt },
        ],
      }),
    });
  } catch (e) {
    throw new ProviderError("network_error", networkMessage(e));
  }
  if (!res.ok) {
    const body = await safeText(res);
    throw classifyHttpError(res.status, body);
  }
  const j = await res.json().catch(() => null);
  return j?.choices?.[0]?.message?.content?.trim() ?? "";
}

async function azureOpenAI(p: AICallParams): Promise<string> {
  if (!p.azureEndpoint) {
    throw new ProviderError(
      "malformed_request",
      "Azure OpenAI requires an endpoint URL.",
    );
  }
  if (!p.azureDeployment && !p.modelName) {
    throw new ProviderError(
      "malformed_request",
      "Azure OpenAI requires a deployment name.",
    );
  }
  const endpoint = p.azureEndpoint.replace(/\/$/, "");
  const deployment = p.azureDeployment || p.modelName;
  const apiVersion = p.azureApiVersion || "2024-08-01-preview";
  const url = `${endpoint}/openai/deployments/${encodeURIComponent(
    deployment,
  )}/chat/completions?api-version=${encodeURIComponent(apiVersion)}`;
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "api-key": p.apiKey },
      body: JSON.stringify({
        messages: [
          { role: "system", content: p.system },
          { role: "user", content: p.prompt },
        ],
        temperature: 0.2,
        max_tokens: 400,
      }),
    });
  } catch (e) {
    throw new ProviderError("network_error", networkMessage(e));
  }
  if (!res.ok) {
    const body = await safeText(res);
    throw classifyHttpError(res.status, body);
  }
  const j = await res.json().catch(() => null);
  return j?.choices?.[0]?.message?.content?.trim() ?? "";
}

async function anthropic(p: AICallParams): Promise<string> {
  let res: Response;
  try {
    res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": p.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: p.modelName,
        max_tokens: 400,
        system: p.system,
        messages: [{ role: "user", content: p.prompt }],
      }),
    });
  } catch (e) {
    throw new ProviderError("network_error", networkMessage(e));
  }
  if (!res.ok) {
    const body = await safeText(res);
    throw classifyHttpError(res.status, body);
  }
  const j = await res.json().catch(() => null);
  return j?.content?.[0]?.text?.trim() ?? "";
}

/** Map HTTP status + body fragment to a normalized error type. */
function classifyHttpError(status: number, body: string): ProviderError {
  const lower = body.toLowerCase();
  if (
    status === 404 ||
    (lower.includes("model") &&
      (lower.includes("not_found") ||
        lower.includes("not found") ||
        lower.includes("does not exist") ||
        lower.includes("no such model")))
  ) {
    return new ProviderError("model_not_found", "Model not found.", body);
  }
  if (status === 401) {
    return new ProviderError("invalid_api_key", "Invalid API key.", body);
  }
  if (status === 403) {
    // 403 commonly means "valid key, no access to this model/region".
    if (lower.includes("region") || lower.includes("not available in")) {
      return new ProviderError("region_unavailable", "Model not available in this region.", body);
    }
    return new ProviderError("permission_denied", "Permission denied for this model.", body);
  }
  if (status === 429) {
    return new ProviderError("rate_limited", "Rate limited by provider.", body);
  }
  if (status >= 500) {
    return new ProviderError(
      "provider_unavailable",
      "Provider returned a server error.",
      body,
    );
  }
  if (status === 400 || status === 422) {
    // Some providers return 400 for model-not-found instead of 404.
    if (lower.includes("model")) {
      return new ProviderError("model_not_found", "Model not found.", body);
    }
    return new ProviderError(
      "malformed_request",
      "Provider rejected the request.",
      body,
    );
  }
  return new ProviderError("unknown_error", `Provider returned HTTP ${status}.`, body);
}

function networkMessage(e: unknown): string {
  return e instanceof Error ? e.message : "Network request failed.";
}

async function safeText(res: Response): Promise<string> {
  try {
    return (await res.text()).slice(0, 500);
  } catch {
    return "";
  }
}

/* ------------------------------------------------------------------------- */
/*  Model listing                                                            */
/* ------------------------------------------------------------------------- */

export interface ListModelsParams {
  provider: AIProvider;
  apiKey?: string;
}

export interface ListedModel {
  id: string;
  displayName?: string;
}

/**
 * Fetch the list of models available to the user for a provider.
 * Throws ProviderError with a normalized errorType on failure.
 * Never logs or returns the API key.
 */
export async function listModels(p: ListModelsParams): Promise<ListedModel[]> {
  switch (p.provider) {
    case "openai":
      return listFromOpenAICompat("https://api.openai.com/v1/models", p.apiKey, "Bearer");
    case "mistral":
      return listFromOpenAICompat("https://api.mistral.ai/v1/models", p.apiKey, "Bearer");
    case "openrouter":
      // OpenRouter models endpoint is publicly listable; pass key if present.
      return listFromOpenAICompat("https://openrouter.ai/api/v1/models", p.apiKey, "Bearer");
    case "anthropic":
      return listAnthropic(p.apiKey);
    case "azure_openai":
      // Listing Azure deployments requires Azure ARM management permissions.
      // We don't implement that — return a malformed_request so the caller
      // can render the "enter deployment name" guidance.
      throw new ProviderError(
        "malformed_request",
        "Azure OpenAI uses deployment names. Enter the deployment name from your Azure OpenAI resource.",
      );
  }
}

async function listFromOpenAICompat(
  url: string,
  apiKey: string | undefined,
  scheme: "Bearer",
): Promise<ListedModel[]> {
  let res: Response;
  try {
    const headers: Record<string, string> = { Accept: "application/json" };
    if (apiKey) headers["Authorization"] = `${scheme} ${apiKey}`;
    res = await fetch(url, { method: "GET", headers });
  } catch (e) {
    throw new ProviderError("network_error", networkMessage(e));
  }
  if (!res.ok) {
    const body = await safeText(res);
    throw classifyHttpError(res.status, body);
  }
  const j = (await res.json().catch(() => null)) as
    | { data?: Array<{ id?: string; name?: string }> }
    | null;
  const data = j?.data ?? [];
  return data
    .map((m) => ({ id: String(m?.id ?? "").trim(), displayName: m?.name }))
    .filter((m) => m.id.length > 0);
}

async function listAnthropic(apiKey: string | undefined): Promise<ListedModel[]> {
  if (!apiKey) {
    throw new ProviderError(
      "invalid_api_key",
      "Anthropic model listing requires an API key.",
    );
  }
  let res: Response;
  try {
    res = await fetch("https://api.anthropic.com/v1/models", {
      method: "GET",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        Accept: "application/json",
      },
    });
  } catch (e) {
    throw new ProviderError("network_error", networkMessage(e));
  }
  if (!res.ok) {
    const body = await safeText(res);
    throw classifyHttpError(res.status, body);
  }
  const j = (await res.json().catch(() => null)) as
    | { data?: Array<{ id?: string; display_name?: string }> }
    | null;
  const data = j?.data ?? [];
  return data
    .map((m) => ({ id: String(m?.id ?? "").trim(), displayName: m?.display_name }))
    .filter((m) => m.id.length > 0);
}
