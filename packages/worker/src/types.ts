import type { Sandbox as SandboxDO } from "@cloudflare/sandbox";

export type Env = {
  Sandbox: DurableObjectNamespace<SandboxDO>;
};

export type AgentChoice = "opencode" | "pi";

export interface CreateSandboxBody {
  repoUrl: string;
  branch?: string;
  agent: AgentChoice;
  env?: Record<string, string>;
}

export interface DestroySandboxBody {
  sandboxId: string;
}

export interface SandboxMeta {
  sandboxId: string;
  repoUrl: string;
  agent: AgentChoice;
  createdAt: string;
}
