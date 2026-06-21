import type { AIProvider } from "./types";

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
  const res = await fetch(url, {
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
  if (!res.ok) throw new Error(`${p.provider} ${res.status} ${await safeText(res)}`);
  const j = await res.json();
  return j.choices?.[0]?.message?.content?.trim() ?? "";
}

async function azureOpenAI(p: AICallParams): Promise<string> {
  if (!p.azureEndpoint) throw new Error("Azure OpenAI requires azureEndpoint");
  const endpoint = p.azureEndpoint.replace(/\/$/, "");
  const deployment = p.azureDeployment || p.modelName;
  const apiVersion = p.azureApiVersion || "2024-08-01-preview";
  const url = `${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`;
  const res = await fetch(url, {
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
  if (!res.ok) throw new Error(`azure_openai ${res.status} ${await safeText(res)}`);
  const j = await res.json();
  return j.choices?.[0]?.message?.content?.trim() ?? "";
}

async function anthropic(p: AICallParams): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
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
  if (!res.ok) throw new Error(`anthropic ${res.status} ${await safeText(res)}`);
  const j = await res.json();
  return j.content?.[0]?.text?.trim() ?? "";
}

async function safeText(res: Response) {
  try {
    return (await res.text()).slice(0, 300);
  } catch {
    return "";
  }
}
