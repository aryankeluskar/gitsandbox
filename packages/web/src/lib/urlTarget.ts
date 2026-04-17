export type UrlTarget =
  | { kind: "repo"; owner: string; repo: string; branch: string }
  | { kind: "account"; owner: string }
  | null;

const SEGMENT_RE = /^[A-Za-z0-9_.-]+$/;

function isValidSegment(s: string): boolean {
  return SEGMENT_RE.test(s);
}

export function extractTargetFromPath(pathname: string): UrlTarget {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return null;

  const owner = segments[0];
  if (!isValidSegment(owner)) return null;

  if (segments.length === 1) {
    return { kind: "account", owner };
  }

  const repo = segments[1];
  if (!isValidSegment(repo)) return null;

  let branch = "main";
  if (segments[2] === "tree" && segments[3]) {
    branch = segments.slice(3).join("/");
  }

  return { kind: "repo", owner, repo, branch };
}

/** Read the active session id from the `?s=` query param, if any. */
export function getSessionIdFromUrl(): number | undefined {
  if (typeof window === "undefined") return undefined;
  const raw = new URLSearchParams(window.location.search).get("s");
  if (!raw) return undefined;
  const n = Number(raw);
  if (!Number.isInteger(n) || n <= 0) return undefined;
  return n;
}

/** Write `?s=<id>` into the current URL without reloading. */
export function setSessionIdInUrl(id: number): void {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  if (url.searchParams.get("s") === String(id)) return;
  url.searchParams.set("s", String(id));
  window.history.replaceState({}, "", url.toString());
}

/** Remove `?s=` from the current URL without reloading. */
export function clearSessionIdInUrl(): void {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  if (!url.searchParams.has("s")) return;
  url.searchParams.delete("s");
  window.history.replaceState({}, "", url.toString());
}

/**
 * Build a sidebar href for a session. Always includes `?s=<id>` so clicking
 * reloads into that exact session. Honors the branch when set and non-default.
 */
export function buildSessionHref(opts: {
  sessionId: number;
  owner: string;
  repo?: string;
  branch?: string;
}): string {
  const { sessionId, owner, repo, branch } = opts;
  const base =
    repo && branch && branch !== "main"
      ? `/${owner}/${repo}/tree/${encodeURIComponent(branch)}`
      : repo
        ? `/${owner}/${repo}`
        : `/${owner}`;
  return `${base}?s=${sessionId}`;
}
