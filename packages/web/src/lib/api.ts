import { getApiBase, getWsOrigin } from "./config";

export interface CreateSandboxParams {
  repoUrl: string;
  branch?: string;
  agent: "opencode" | "pi";
  env: Record<string, string>;
}

export interface SandboxMeta {
  sandboxId: string;
  repoUrl: string;
  agent: "opencode" | "pi";
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

export function buildTerminalWsUrl(sandboxId: string): string {
  const wsOrigin = getWsOrigin();
  return `${wsOrigin}/ws/terminal?id=${encodeURIComponent(sandboxId)}`;
}
