import { NextRequest, NextResponse } from "next/server";
import { listModels, ProviderError } from "@/lib/aiClient";
import type { AIProvider } from "@/lib/types";
import {
  friendlyErrorMessage,
  type ModelListResponse,
  type ProviderErrorType,
} from "@/lib/modelProviders";

export const runtime = "nodejs";

interface ListRequestBody {
  provider: AIProvider;
  apiKey?: string;
}

export async function POST(req: NextRequest) {
  let body: ListRequestBody;
  try {
    body = (await req.json()) as ListRequestBody;
  } catch {
    return NextResponse.json(
      mkError("openai" as AIProvider, "malformed_request", "Invalid JSON in request body."),
      { status: 200 },
    );
  }

  const provider = body?.provider;
  const apiKey = body?.apiKey ?? "";

  if (!provider) {
    return NextResponse.json(
      mkError("openai" as AIProvider, "malformed_request", "Missing provider."),
      { status: 200 },
    );
  }

  try {
    const models = await listModels({ provider, apiKey: apiKey || undefined });
    const payload: ModelListResponse = {
      ok: true,
      provider,
      models,
    };
    return NextResponse.json(payload);
  } catch (err) {
    let errorType: ProviderErrorType = "unknown_error";
    let rawDetail: string | undefined;
    if (err instanceof ProviderError) {
      errorType = err.errorType;
      rawDetail = err.rawDetail ?? err.message;
    } else if (err instanceof Error) {
      rawDetail = err.message;
    }
    const safeDetail = scrubKey(rawDetail ?? "", apiKey);
    console.warn(
      `[trustguard/ai/models] provider=${provider} errorType=${errorType} detail=${safeDetail.slice(0, 200)}`,
    );
    const payload: ModelListResponse & { technicalDetail?: string } = {
      ok: false,
      provider,
      errorType,
      message: friendlyErrorMessage(errorType, provider),
      fallbackUsed: true,
      technicalDetail: safeDetail || undefined,
    };
    return NextResponse.json(payload, { status: 200 });
  }
}

function mkError(
  provider: AIProvider,
  errorType: ProviderErrorType,
  message: string,
): ModelListResponse {
  return { ok: false, provider, errorType, message, fallbackUsed: true };
}

function scrubKey(s: string, key: string): string {
  if (!key) return s;
  return s.split(key).join("[REDACTED]");
}
