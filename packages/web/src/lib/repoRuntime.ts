import { Bash, type InMemoryFs, type BashExecResult } from "just-bash/browser";
import { hydrateRepoFs, type HydratedRepoFs } from "./githubFs";

export interface RepoRuntime {
  fs: InMemoryFs;
  bash: Bash;
  owner: string;
  repo: string;
  ref: string;
  headSha: string;
  truncated: boolean;
  fileCount: number;
  getCwd(): string;
  setCwd(next: string): void;
}

export interface RepoExecResult extends BashExecResult {
  cwd: string;
}

export interface CreateRepoRuntimeOptions {
  owner: string;
  repo: string;
  ref?: string;
  getToken?: () => string | undefined | Promise<string | undefined>;
}

export async function createRepoRuntime(
  opts: CreateRepoRuntimeOptions
): Promise<RepoRuntime> {
  const hydrated: HydratedRepoFs = await hydrateRepoFs({
    owner: opts.owner,
    repo: opts.repo,
    ref: opts.ref ?? "HEAD",
    token: opts.getToken,
  });

  const bash = new Bash({ cwd: "/", fs: hydrated.fs });
  let cwd = "/";

  return {
    fs: hydrated.fs,
    bash,
    owner: opts.owner,
    repo: opts.repo,
    ref: hydrated.resolvedRef,
    headSha: hydrated.headSha,
    truncated: hydrated.truncated,
    fileCount: hydrated.fileCount,
    getCwd: () => cwd,
    setCwd: (next) => {
      if (!next) return;
      cwd = next.startsWith("/") ? next : `/${next}`;
    },
  };
}

function shellQuote(value: string): string {
  return `'${value.replaceAll("'", "'\\''")}'`;
}

export async function execInRepo(
  runtime: RepoRuntime,
  command: string,
  signal?: AbortSignal
): Promise<RepoExecResult> {
  const cwd = runtime.getCwd();
  const script = cwd === "/" ? command : `cd ${shellQuote(cwd)}\n${command}`;
  const result = await runtime.bash.exec(script, { cwd, signal });
  const nextCwd = result.env?.PWD;
  if (nextCwd) runtime.setCwd(nextCwd);
  return { ...result, cwd: runtime.getCwd() };
}
