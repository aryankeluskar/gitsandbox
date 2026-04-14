import { getApiBase } from "./config";

export interface CreateSandboxParams {
  repoUrl: string;
  branch?: string;
  env?: Record<string, string>;
}

export interface SandboxMeta {
  sandboxId: string;
  repoUrl: string;
  agent: "opencode";
  createdAt: string;
}

export async function apiCreateSandbox(
  params: CreateSandboxParams
): Promise<SandboxMeta> {
  const base = getApiBase();
  const res = await fetch(`${base}/sandbox/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(
      (err as { error: string }).error || "Failed to create sandbox"
    );
  }
  return res.json() as Promise<SandboxMeta>;
}

export async function apiDestroySandbox(sandboxId: string): Promise<void> {
  const base = getApiBase();
  const res = await fetch(`${base}/sandbox/destroy`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sandboxId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(
      (err as { error: string }).error || "Failed to destroy sandbox"
    );
  }
}

function ocBase(sandboxId: string): string {
  return `${getApiBase()}/oc/${sandboxId}`;
}

export async function ocFetch(
  sandboxId: string,
  path: string,
  init?: RequestInit
): Promise<Response> {
  return fetch(`${ocBase(sandboxId)}${path}`, init);
}

export async function ocHealth(
  sandboxId: string
): Promise<{ healthy: boolean; version: string }> {
  const res = await ocFetch(sandboxId, "/global/health");
  return res.json();
}

export interface OcSession {
  id: string;
  title?: string;
  parentID?: string;
}

export async function ocCreateSession(
  sandboxId: string
): Promise<OcSession> {
  const res = await ocFetch(sandboxId, "/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  if (!res.ok) throw new Error("Failed to create session");
  return res.json();
}

export interface OcPart {
  type: string;
  text?: string;
  toolCallId?: string;
  toolName?: string;
  args?: Record<string, unknown>;
  result?: unknown;
  thinking?: string;
  [key: string]: unknown;
}

export interface OcMessageInfo {
  id: string;
  role: "user" | "assistant" | "tool";
  createdAt?: string;
  model?: { providerID: string; modelID: string };
  [key: string]: unknown;
}

export interface OcMessage {
  info: OcMessageInfo;
  parts: OcPart[];
}

export async function ocListMessages(
  sandboxId: string,
  sessionId: string
): Promise<OcMessage[]> {
  const res = await ocFetch(sandboxId, `/session/${sessionId}/message`);
  if (!res.ok) throw new Error("Failed to list messages");
  return res.json();
}

export async function ocSendMessage(
  sandboxId: string,
  sessionId: string,
  text: string,
  model?: { providerID: string; modelID: string }
): Promise<OcMessage> {
  const body: Record<string, unknown> = {
    parts: [{ type: "text", text }],
  };
  if (model) body.model = model;

  const res = await ocFetch(sandboxId, `/session/${sessionId}/message`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { error?: string }).error || "Failed to send message"
    );
  }
  return res.json();
}

export async function ocSendMessageAsync(
  sandboxId: string,
  sessionId: string,
  text: string,
  model?: { providerID: string; modelID: string }
): Promise<void> {
  const body: Record<string, unknown> = {
    parts: [{ type: "text", text }],
  };
  if (model) body.model = model;

  const res = await ocFetch(sandboxId, `/session/${sessionId}/prompt_async`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { error?: string }).error || "Failed to send message"
    );
  }
}

export interface OcProvider {
  id: string;
  name: string;
  models?: Array<{ id: string; name: string }>;
}

export async function ocListProviders(
  sandboxId: string
): Promise<{ all: OcProvider[]; connected: string[] }> {
  const res = await ocFetch(sandboxId, "/provider");
  if (!res.ok) throw new Error("Failed to list providers");
  return res.json();
}

export function ocEventsUrl(sandboxId: string): string {
  return `${ocBase(sandboxId)}/event`;
}

export async function ocAbortSession(
  sandboxId: string,
  sessionId: string
): Promise<void> {
  await ocFetch(sandboxId, `/session/${sessionId}/abort`, { method: "POST" });
}
