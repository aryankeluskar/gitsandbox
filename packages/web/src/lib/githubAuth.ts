import { getCredential } from "../db/credentials";
import type { CopilotCredentials } from "./copilotOAuth";
import { GITHUB_CRED_KEY, type GithubCredentials } from "./githubOAuth";

/**
 * Resolve the best available GitHub API token, in priority order:
 *   1. GITHUB_OAUTH    (mandatory user device-flow token)
 *   2. COPILOT_OAUTH.refresh (same class of token; kept as fallback for users
 *                             who authed before the mandatory GitHub gate landed)
 *   3. GITHUB_TOKEN    (user-supplied PAT in Settings)
 *
 * Returns undefined if none are available. Callers should still handle 401s in
 * case the token has been revoked out of band.
 */
export async function getGithubToken(): Promise<string | undefined> {
  const ghOauth = await getCredential(GITHUB_CRED_KEY);
  if (ghOauth) {
    try {
      const parsed = JSON.parse(ghOauth) as GithubCredentials;
      if (typeof parsed.access === "string" && parsed.access.length > 0) {
        return parsed.access;
      }
    } catch {
      /* fall through */
    }
  }

  const copilot = await getCredential("COPILOT_OAUTH");
  if (copilot) {
    try {
      const parsed = JSON.parse(copilot) as CopilotCredentials;
      if (typeof parsed.refresh === "string" && parsed.refresh.length > 0) {
        return parsed.refresh;
      }
    } catch {
      /* fall through */
    }
  }

  const pat = await getCredential("GITHUB_TOKEN");
  return pat && pat.length > 0 ? pat : undefined;
}

/** Convenience: returns `{ Authorization: "Bearer ..." }` or an empty object. */
export async function githubAuthHeaders(): Promise<Record<string, string>> {
  const token = await getGithubToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
