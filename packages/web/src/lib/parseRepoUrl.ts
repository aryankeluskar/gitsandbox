export interface ParsedRepo {
  kind: "repo";
  owner: string;
  repo: string;
  branch: string;
}

export interface ParsedAccount {
  kind: "account";
  owner: string;
}

export type ParsedTarget = ParsedRepo | ParsedAccount;

export class InvalidRepoUrlError extends Error {
  constructor(input: string) {
    super(`Invalid repository URL: ${input}`);
    this.name = "InvalidRepoUrlError";
  }
}

const GITHUB_URL_RE =
  /^(?:https?:\/\/)?github\.com\/([A-Za-z0-9_.-]+)(?:\/([A-Za-z0-9_.-]+?))?(?:\/tree\/([^\s/]+))?(?:\/|\.git)?$/;

const SHORTHAND_RE = /^([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)$/;

const OWNER_ONLY_RE = /^@?([A-Za-z0-9_.-]+)$/;

function trimRepoSuffix(name: string): string {
  return name.endsWith(".git") ? name.slice(0, -4) : name;
}

export function parseRepoUrl(input: string): ParsedTarget {
  const trimmed = input.trim().replace(/\/+$/, "");

  const ghMatch = trimmed.match(GITHUB_URL_RE);
  if (ghMatch) {
    const owner = ghMatch[1];
    const repo = ghMatch[2];
    const branch = ghMatch[3];
    if (!repo) {
      return { kind: "account", owner };
    }
    return {
      kind: "repo",
      owner,
      repo: trimRepoSuffix(repo),
      branch: branch ?? "main",
    };
  }

  const shortMatch = trimmed.match(SHORTHAND_RE);
  if (shortMatch) {
    return {
      kind: "repo",
      owner: shortMatch[1],
      repo: trimRepoSuffix(shortMatch[2]),
      branch: "main",
    };
  }

  const ownerOnly = trimmed.match(OWNER_ONLY_RE);
  if (ownerOnly) {
    return { kind: "account", owner: ownerOnly[1] };
  }

  throw new InvalidRepoUrlError(trimmed);
}
