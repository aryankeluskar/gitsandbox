import { getCredential, setCredential } from "../db/credentials";
import {
  exchangeGithubTokenForCopilot,
  pollForGithubAccessToken,
  startCopilotDeviceFlow,
  type CopilotCredentials,
} from "./copilotOAuth";

export const GITHUB_CRED_KEY = "GITHUB_OAUTH";

export interface GithubCredentials {
  /** GitHub user access token (read:user scope). Sent as Bearer to api.github.com. */
  access: string;
  /** OAuth scope string as returned (informational). */
  scope: string;
  obtainedAt: number;
}

export async function getGithubCreds(): Promise<GithubCredentials | null> {
  const raw = await getCredential(GITHUB_CRED_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as GithubCredentials;
    if (typeof parsed.access !== "string" || parsed.access.length === 0) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export async function saveGithubCreds(
  creds: GithubCredentials,
): Promise<void> {
  await setCredential(GITHUB_CRED_KEY, JSON.stringify(creds));
}

export interface GithubLoginHandlers {
  onCode: (info: { userCode: string; verificationUri: string }) => void;
  signal?: AbortSignal;
}

/**
 * Run the GitHub device flow against the shared OAuth app used for Copilot.
 *
 * Reusing the same client id is deliberate: the resulting access token is also
 * accepted by `exchangeGithubTokenForCopilot`, so users who later connect
 * Copilot skip a second device prompt entirely.
 */
export async function loginGithub(
  handlers: GithubLoginHandlers,
): Promise<GithubCredentials> {
  const device = await startCopilotDeviceFlow();
  handlers.onCode({
    userCode: device.user_code,
    verificationUri: device.verification_uri,
  });
  const access = await pollForGithubAccessToken(
    device.device_code,
    device.interval,
    device.expires_in,
    undefined,
    handlers.signal,
  );
  const creds: GithubCredentials = {
    access,
    scope: "read:user",
    obtainedAt: Date.now(),
  };
  await saveGithubCreds(creds);
  return creds;
}

/**
 * Exchange an existing GitHub device-flow token for Copilot credentials.
 * Used by the Copilot sign-in button to avoid re-prompting when the user has
 * already completed the mandatory GitHub auth.
 */
export async function exchangeGithubForCopilot(
  creds: GithubCredentials,
): Promise<CopilotCredentials> {
  return exchangeGithubTokenForCopilot(creds.access);
}
