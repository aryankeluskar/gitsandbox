import { getSandbox, proxyTerminal } from "@cloudflare/sandbox";
import type { Env, AgentChoice, SandboxMeta } from "./types";
import { parseRepoUrl, buildTarballUrl } from "./repo";

function makeSandboxId(): string {
  return crypto.randomUUID();
}

function buildCloneScript(
  repoUrl: string,
  branch: string,
  repoName: string,
  githubToken?: string
): string {
  const hasToken = Boolean(githubToken);
  const tarballUrl = buildTarballUrl(
    { owner: "", repo: "", branch },
    hasToken
  );

  if (hasToken) {
    return [
      `mkdir -p /workspace/${repoName}`,
      `curl -sL -H "Authorization: token ${githubToken}" "${repoUrl}" | tar xz --strip-components=1 -C /workspace/${repoName}`,
    ].join(" && ");
  }

  return [
    `mkdir -p /workspace/${repoName}`,
    `curl -sL "${repoUrl}" | tar xz --strip-components=1 -C /workspace/${repoName}`,
  ].join(" && ");
}

function buildAgentStartCommand(
  agent: AgentChoice,
  workDir: string,
  envVars: Record<string, string>
): string {
  if (agent === "pi") {
    return `cd ${workDir} && pi`;
  }
  return `cd ${workDir} && opencode`;
}

export async function createSandbox(
  env: Env,
  repoUrl: string,
  branch: string | undefined,
  agent: AgentChoice,
  userEnv: Record<string, string> = {}
): Promise<SandboxMeta> {
  const parsed = parseRepoUrl(repoUrl);
  const resolvedBranch = branch ?? parsed.branch;
  const sandboxId = makeSandboxId();

  const sandbox = getSandbox(env.Sandbox, sandboxId);

  const githubToken = userEnv.GITHUB_TOKEN;
  const tarUrl = buildTarballUrl(
    { ...parsed, branch: resolvedBranch },
    Boolean(githubToken)
  );

  const cloneScript = buildCloneScript(
    tarUrl,
    resolvedBranch,
    parsed.repo,
    githubToken
  );

  const cloneResult = await sandbox.exec(cloneScript);
  if (!cloneResult.success) {
    await sandbox.destroy();
    throw new Error(
      `Failed to clone repository: ${cloneResult.stderr || cloneResult.stdout}`
    );
  }

  const envExports = Object.entries(userEnv)
    .filter(([key]) => key !== "GITHUB_TOKEN")
    .map(([key, value]) => `export ${key}='${value.replace(/'/g, "'\\''")}'`)
    .join(" && ");

  if (envExports) {
    await sandbox.exec(
      `echo '${envExports.replace(/'/g, "'\\''")}' >> /root/.bashrc`
    );
  }

  return {
    sandboxId,
    repoUrl: `${parsed.owner}/${parsed.repo}`,
    agent,
    createdAt: new Date().toISOString(),
  };
}

export async function destroySandbox(
  env: Env,
  sandboxId: string
): Promise<void> {
  const sandbox = getSandbox(env.Sandbox, sandboxId);
  await sandbox.destroy();
}

export function getTerminalResponse(
  env: Env,
  sandboxId: string,
  request: Request
): Promise<Response> {
  const id = env.Sandbox.idFromName(sandboxId);
  const stub = env.Sandbox.get(id);
  return proxyTerminal(stub, "default", request, {
    cols: 80,
    rows: 24,
  });
}
