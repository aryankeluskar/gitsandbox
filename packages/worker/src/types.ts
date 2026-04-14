import type { Sandbox as SandboxDO } from "@cloudflare/sandbox";

export type Env = {
  Sandbox: DurableObjectNamespace<SandboxDO>;
};

export interface CreateSandboxBody {
  repoUrl: string;
  branch?: string;
  env?: Record<string, string>;
}

export interface DestroySandboxBody {
  sandboxId: string;
}

export interface SandboxMeta {
  sandboxId: string;
  repoUrl: string;
  agent: "opencode";
  createdAt: string;
}
