import { getSandbox } from "@cloudflare/sandbox";
import type { Env, SandboxMeta } from "./types";
import { parseRepoUrl, buildTarballUrl } from "./repo";

const OPENCODE_PORT = 4096;

function makeSandboxId(): string {
  return crypto.randomUUID();
}

function buildCloneScript(
  tarUrl: string,
  repoName: string,
  githubToken?: string
): string {
  const header = githubToken
    ? `-H "Authorization: token ${githubToken}"`
    : "";
  return [
    `mkdir -p /workspace/${repoName}`,
    `curl -sL ${header} "${tarUrl}" | tar xz --strip-components=1 -C /workspace/${repoName}`,
  ].join(" && ");
}

export async function createSandbox(
  env: Env,
  repoUrl: string,
  branch: string | undefined,
  userEnv: Record<string, string> = {}
): Promise<SandboxMeta> {
  const parsed = parseRepoUrl(repoUrl);
  const resolvedBranch = branch ?? parsed.branch;
  const sandboxId = makeSandboxId();

  const sandbox = getSandbox(env.Sandbox, sandboxId, { normalizeId: true });

  const githubToken = userEnv.GITHUB_TOKEN;
  const tarUrl = buildTarballUrl(
    { ...parsed, branch: resolvedBranch },
    Boolean(githubToken)
  );

  const cloneScript = buildCloneScript(tarUrl, parsed.repo, githubToken);
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

  const proc = await sandbox.startProcess(
    `cd /workspace/${parsed.repo} && opencode serve --port ${OPENCODE_PORT} --hostname 0.0.0.0`
  );

  await proc.waitForPort(OPENCODE_PORT, {
    mode: "http",
    path: "/global/health",
  });

  return {
    sandboxId,
    repoUrl: `${parsed.owner}/${parsed.repo}`,
    agent: "opencode",
    createdAt: new Date().toISOString(),
  };
}

export async function destroySandbox(
  env: Env,
  sandboxId: string
): Promise<void> {
  const sandbox = getSandbox(env.Sandbox, sandboxId, { normalizeId: true });
  await sandbox.destroy();
}

export async function proxyToOpenCode(
  env: Env,
  sandboxId: string,
  path: string,
  request: Request
): Promise<Response> {
  const sandbox = getSandbox(env.Sandbox, sandboxId, { normalizeId: true });

  const url = `http://localhost:${OPENCODE_PORT}${path}`;
  const headers = new Headers(request.headers);
  headers.delete("host");

  const init: RequestInit = {
    method: request.method,
    headers,
  };

  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = request.body;
  }

  return sandbox.containerFetch(url, init, OPENCODE_PORT);
}
