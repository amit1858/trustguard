import { NextRequest, NextResponse } from "next/server";
import { callModel, ProviderError } from "@/lib/aiClient";
import { SYSTEM_PROMPT } from "@/lib/promptTemplates";
import type { AIProvider } from "@/lib/types";
import {
  friendlyErrorMessage,
  type AIRouteResponse,
  type ProviderErrorType,
} from "@/lib/modelProviders";

export const runtime = "nodejs";

interface AIRequestBody {
  provider: AIProvider;
  apiKey: string;
  modelName: string;
  task: string;
  prompt: string;
  azureEndpoint?: string;
  azureDeployment?: string;
  azureApiVersion?: string;
}

export async function POST(req: NextRequest) {
  let body: AIRequestBody;
  try {
    body = (await req.json()) as AIRequestBody;
  } catch {
    return jsonError(
      { provider: "openai" as AIProvider, model: "", task: "" },
      "malformed_request",
      "Invalid JSON in request body.",
      400,
    );
  }

  const { provider, apiKey, modelName, task, prompt } = body || ({} as AIRequestBody);

  // Required fields. API key is required for any BYOK call by definition.
  const missing: string[] = [];
  if (!provider) missing.push("provider");
  if (!apiKey) missing.push("apiKey");
  if (!modelName && !body.azureDeployment) missing.push("modelName");
  if (!task) missing.push("task");
  if (!prompt) missing.push("prompt");
  if (missing.length) {
    return jsonError(
      { provider: provider ?? ("openai" as AIProvider), model: modelName ?? "", task: task ?? "" },
      "malformed_request",
      `Missing required fields: ${missing.join(", ")}`,
      400,
    );
  }

  try {
    const text = await callModel({
      provider,
      apiKey,
      modelName,
      prompt,
      system: SYSTEM_PROMPT,
      azureEndpoint: body.azureEndpoint,
      azureDeployment: body.azureDeployment,
      azureApiVersion: body.azureApiVersion,
    });
    const payload: AIRouteResponse = {
      ok: true,
      provider,
      model: modelName,
      task,
      text,
      fallbackUsed: false,
    };
    return NextResponse.json(payload);
  } catch (err) {
    let errorType: ProviderErrorType = "unknown_error";
    let rawDetail: string | undefined;
    if (err instanceof ProviderError) {
      errorType = err.errorType;
      rawDetail = err.rawDetail;
    } else if (err instanceof Error) {
      rawDetail = err.message;
    }

    // Scrub key from any technical detail surfaced to client / server logs.
    const safeDetail = scrubKey(rawDetail ?? "", apiKey);
    const friendly = friendlyErrorMessage(errorType, provider);
    // Server-side log: never include the key. Truncate body to avoid log spam.
    console.warn(
      `[trustguard/ai] provider=${provider} model=${modelName} task=${task} ` +
        `errorType=${errorType} detail=${safeDetail.slice(0, 200)}`,
    );

    const payload: AIRouteResponse & { technicalDetail?: string } = {
      ok: false,
      provider,
      model: modelName,
      task,
      errorType,
      message: friendly,
      fallbackUsed: true,
      technicalDetail: safeDetail || undefined,
    };
    // HTTP 200 so the client treats this as a normal (non-fatal) response;
    // the body carries the structured error. This keeps the demo unscary.
    return NextResponse.json(payload, { status: 200 });
  }
}

function jsonError(
  ctx: { provider: AIProvider; model: string; task: string },
  errorType: ProviderErrorType,
  message: string,
  status: number,
) {
  const payload: AIRouteResponse = {
    ok: false,
    provider: ctx.provider,
    model: ctx.model,
    task: ctx.task,
    errorType,
    message,
    fallbackUsed: true,
  };
  return NextResponse.json(payload, { status });
}

function scrubKey(s: string, key: string): string {
  if (!key) return s;
  return s.split(key).join("[REDACTED]");
}
