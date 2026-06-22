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
    lower.includes("model") &&
      (lower.includes("not_found") ||
        lower.includes("not found") ||
        lower.includes("does not exist") ||
        lower.includes("no such model"))
  ) {
    return new ProviderError("model_not_found", "Model not found.", body);
  }
  if (status === 401 || status === 403) {
    return new ProviderError("invalid_api_key", "Invalid API key.", body);
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
