import { NextRequest, NextResponse } from "next/server";
import { callModel } from "@/lib/aiClient";
import { SYSTEM_PROMPT } from "@/lib/promptTemplates";
import type { AIProvider } from "@/lib/types";

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
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const { provider, apiKey, modelName, task, prompt } = body || ({} as AIRequestBody);
  if (!provider || !apiKey || !modelName || !task || !prompt) {
    return NextResponse.json(
      { ok: false, error: "Missing required fields: provider, apiKey, modelName, task, prompt" },
      { status: 400 },
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
    // Never echo the API key back. Never log it.
    return NextResponse.json({ ok: true, task, text });
  } catch (err) {
    const raw = err instanceof Error ? err.message : "Unknown error";
    const safe = scrubKey(raw, apiKey);
    // Log to server console without the key
    console.warn(`[trustguard/ai] provider=${provider} task=${task} failed: ${safe}`);
    return NextResponse.json(
      {
        ok: false,
        task,
        error: safe,
        fallback:
          "AI provider call failed. Guardian continues using the deterministic policy kernel.",
      },
      { status: 502 },
    );
  }
}

function scrubKey(s: string, key: string) {
  if (!key) return s;
  return s.split(key).join("[REDACTED]");
}
