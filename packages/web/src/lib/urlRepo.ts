export interface UrlRepoInfo {
  owner: string;
  repo: string;
  branch: string;
}

/**
 * Extract owner/repo/branch from the current URL path.
 * Supports:
 *   /owner/repo
 *   /owner/repo/tree/branch-name
 */
export function extractRepoFromPath(pathname: string): UrlRepoInfo | null {
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length < 2) return null;

  const owner = segments[0];
  const repo = segments[1];

  if (!isValidSegment(owner) || !isValidSegment(repo)) return null;

  let branch = "main";
  if (segments[2] === "tree" && segments[3]) {
    branch = segments.slice(3).join("/");
  }

  return { owner, repo, branch };
}

function isValidSegment(s: string): boolean {
  return /^[A-Za-z0-9_.-]+$/.test(s);
}

export function buildGitHubUrl(owner: string, repo: string): string {
  return `https://github.com/${owner}/${repo}`;
}
