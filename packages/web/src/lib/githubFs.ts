import { InMemoryFs } from "just-bash/browser";

const GH_API = "https://api.github.com";
const GH_RAW = "https://raw.githubusercontent.com";

export interface GitHubFsOptions {
  owner: string;
  repo: string;
  ref: string;
  token?: () => string | undefined | Promise<string | undefined>;
}

export interface ResolvedRef {
  ref: string;
  sha: string;
}

interface GitTreeEntry {
  path: string;
  mode: string;
  type: "blob" | "tree" | "commit";
  sha: string;
  size?: number;
  url?: string;
}

interface GitTreeResponse {
  sha: string;
  url: string;
  tree: GitTreeEntry[];
  truncated: boolean;
}

interface RepoMetaResponse {
  default_branch: string;
}

interface BranchResponse {
  commit: { sha: string };
}

function isTextual(path: string, size: number | undefined): boolean {
  if (size !== undefined && size > 1_000_000) return false;
  const binaryExts = [
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".webp",
    ".ico",
    ".pdf",
    ".zip",
    ".tar",
    ".gz",
    ".woff",
    ".woff2",
    ".ttf",
    ".otf",
    ".eot",
    ".mp3",
    ".mp4",
    ".mov",
    ".webm",
    ".wav",
    ".ogg",
    ".bin",
    ".class",
    ".jar",
    ".wasm",
    ".node",
  ];
  const lower = path.toLowerCase();
  return !binaryExts.some((ext) => lower.endsWith(ext));
}

async function ghFetch(
  path: string,
  token: string | undefined,
  accept = "application/vnd.github+json"
): Promise<Response> {
  const headers: Record<string, string> = {
    Accept: accept,
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  return fetch(`${GH_API}${path}`, { headers });
}

export async function resolveRef(
  owner: string,
  repo: string,
  requested: string | undefined,
  token?: string
): Promise<ResolvedRef> {
  if (requested && requested !== "HEAD") {
    const r = await ghFetch(
      `/repos/${owner}/${repo}/branches/${encodeURIComponent(requested)}`,
      token
    );
    if (r.ok) {
      const data = (await r.json()) as BranchResponse;
      return { ref: requested, sha: data.commit.sha };
    }
  }
  const meta = await ghFetch(`/repos/${owner}/${repo}`, token);
  if (!meta.ok) {
    throw new Error(
      `Failed to resolve repo ${owner}/${repo}: ${meta.status} ${meta.statusText}`
    );
  }
  const { default_branch } = (await meta.json()) as RepoMetaResponse;
  const branch = await ghFetch(
    `/repos/${owner}/${repo}/branches/${encodeURIComponent(default_branch)}`,
    token
  );
  if (!branch.ok) {
    throw new Error(
      `Failed to resolve default branch ${default_branch}: ${branch.status}`
    );
  }
  const { commit } = (await branch.json()) as BranchResponse;
  return { ref: default_branch, sha: commit.sha };
}

export async function fetchTree(
  owner: string,
  repo: string,
  sha: string,
  token?: string
): Promise<GitTreeResponse> {
  const r = await ghFetch(
    `/repos/${owner}/${repo}/git/trees/${sha}?recursive=1`,
    token
  );
  if (!r.ok) {
    throw new Error(
      `Failed to fetch tree for ${owner}/${repo}@${sha}: ${r.status}`
    );
  }
  return (await r.json()) as GitTreeResponse;
}

async function fetchBlob(
  owner: string,
  repo: string,
  ref: string,
  path: string,
  token: string | undefined
): Promise<string> {
  const rawUrl = `${GH_RAW}/${owner}/${repo}/${encodeURIComponent(ref)}/${path
    .split("/")
    .map(encodeURIComponent)
    .join("/")}`;
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const r = await fetch(rawUrl, { headers });
  if (!r.ok) {
    throw new Error(`Failed to fetch ${path}: ${r.status} ${r.statusText}`);
  }
  return r.text();
}

export interface HydratedRepoFs {
  fs: InMemoryFs;
  resolvedRef: string;
  headSha: string;
  truncated: boolean;
  fileCount: number;
}

export async function hydrateRepoFs(
  opts: GitHubFsOptions
): Promise<HydratedRepoFs> {
  const token = opts.token ? await opts.token() : undefined;
  const resolved = await resolveRef(opts.owner, opts.repo, opts.ref, token);
  const tree = await fetchTree(opts.owner, opts.repo, resolved.sha, token);

  const fs = new InMemoryFs();
  let fileCount = 0;

  for (const entry of tree.tree) {
    if (entry.type === "tree") {
      fs.mkdirSync(`/${entry.path}`, { recursive: true });
      continue;
    }
    if (entry.type !== "blob") continue;

    const abs = `/${entry.path}`;

    if (!isTextual(entry.path, entry.size)) {
      fs.writeFileSync(abs, "");
      continue;
    }

    fs.writeFileLazy(abs, async () => {
      const latestToken = opts.token ? await opts.token() : undefined;
      return await fetchBlob(
        opts.owner,
        opts.repo,
        resolved.ref,
        entry.path,
        latestToken
      );
    });
    fileCount += 1;
  }

  return {
    fs,
    resolvedRef: resolved.ref,
    headSha: resolved.sha,
    truncated: tree.truncated,
    fileCount,
  };
}
