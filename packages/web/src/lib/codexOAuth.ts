const CLIENT_ID = "app_EMoamEEZ73f0CkXaXp7hrann";
const AUTHORIZE_URL = "https://auth.openai.com/oauth/authorize";
const TOKEN_URL = "https://auth.openai.com/oauth/token";
const SCOPE = "openid profile email offline_access";
const JWT_CLAIM_PATH = "https://api.openai.com/auth";

export interface CodexCredentials {
  access: string;
  refresh: string;
  accountId: string;
  expires: number;
  providerId: "openai-codex";
}

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

async function generatePKCE(): Promise<{ challenge: string; verifier: string }> {
  const verifierBytes = new Uint8Array(32);
  crypto.getRandomValues(verifierBytes);
  const verifier = base64UrlEncode(verifierBytes);
  const challengeBytes = new Uint8Array(
    await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier)),
  );
  return { challenge: base64UrlEncode(challengeBytes), verifier };
}

function generateState(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return base64UrlEncode(bytes);
}

function decodeJwt(token: string): Record<string, unknown> | undefined {
  const parts = token.split(".");
  if (parts.length !== 3 || !parts[1]) return undefined;
  try {
    return JSON.parse(atob(parts[1]));
  } catch {
    return undefined;
  }
}

function getAccountId(accessToken: string): string | undefined {
  const payload = decodeJwt(accessToken);
  const authValue = payload?.[JWT_CLAIM_PATH];
  if (typeof authValue !== "object" || authValue === null) return undefined;
  return (authValue as { chatgpt_account_id?: string }).chatgpt_account_id;
}

const POPUP_FEATURES = "popup=yes,width=560,height=760,left=120,top=120";

function runPopupOAuthFlow(authUrl: string): Promise<URL> {
  const popup = window.open(authUrl, "gitsandbox-codex-oauth", POPUP_FEATURES);
  if (!popup) throw new Error("Failed to open OAuth popup — check your popup blocker");

  return new Promise<URL>((resolve, reject) => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type !== "oauth-callback") return;
      cleanup();
      if (event.data.error) {
        reject(new Error(event.data.error));
        return;
      }
      if (!event.data.url) {
        reject(new Error("OAuth callback did not include a redirect URL"));
        return;
      }
      resolve(new URL(event.data.url));
    };

    const interval = window.setInterval(() => {
      if (!popup.closed) return;
      cleanup();
      reject(new Error("OAuth popup was closed before completing login"));
    }, 250);

    const cleanup = () => {
      window.clearInterval(interval);
      window.removeEventListener("message", onMessage);
      popup.close();
    };

    window.addEventListener("message", onMessage);
  });
}

async function postTokenRequest(
  url: string,
  body: Record<string, string>,
): Promise<Record<string, unknown>> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token request failed: ${res.status} ${text}`);
  }
  return (await res.json()) as Record<string, unknown>;
}

export async function loginCodex(): Promise<CodexCredentials> {
  const { challenge, verifier } = await generatePKCE();
  const state = generateState();
  const redirectUri = `${window.location.origin}/oauth/callback`;

  const url = new URL(AUTHORIZE_URL);
  url.searchParams.set("client_id", CLIENT_ID);
  url.searchParams.set("code_challenge", challenge);
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("codex_cli_simplified_flow", "true");
  url.searchParams.set("id_token_add_organizations", "true");
  url.searchParams.set("originator", "gitsandbox");
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", SCOPE);
  url.searchParams.set("state", state);

  const redirect = await runPopupOAuthFlow(url.toString());
  const code = redirect.searchParams.get("code");

  if (!code || redirect.searchParams.get("state") !== state) {
    throw new Error("OAuth callback validation failed");
  }

  const tokenData = await postTokenRequest(TOKEN_URL, {
    client_id: CLIENT_ID,
    code,
    code_verifier: verifier,
    grant_type: "authorization_code",
    redirect_uri: redirectUri,
  });

  const access = tokenData.access_token;
  const refresh = tokenData.refresh_token;
  const expiresIn = tokenData.expires_in;

  if (typeof access !== "string" || typeof refresh !== "string" || typeof expiresIn !== "number") {
    throw new Error("Token response missing required fields");
  }

  const accountId = getAccountId(access);
  if (!accountId) throw new Error("Failed to extract accountId from token");

  return {
    access,
    refresh,
    accountId,
    expires: Date.now() + expiresIn * 1000,
    providerId: "openai-codex",
  };
}

export async function refreshCodex(creds: CodexCredentials): Promise<CodexCredentials> {
  const tokenData = await postTokenRequest(TOKEN_URL, {
    client_id: CLIENT_ID,
    grant_type: "refresh_token",
    refresh_token: creds.refresh,
  });

  const access = tokenData.access_token;
  const refresh = tokenData.refresh_token;
  const expiresIn = tokenData.expires_in;

  if (typeof access !== "string" || typeof refresh !== "string" || typeof expiresIn !== "number") {
    throw new Error("Token refresh response missing required fields");
  }

  const accountId = getAccountId(access);
  if (!accountId) throw new Error("Failed to extract accountId from refreshed token");

  return {
    access,
    refresh,
    accountId,
    expires: Date.now() + expiresIn * 1000,
    providerId: "openai-codex",
  };
}

export async function ensureFreshCodex(creds: CodexCredentials): Promise<CodexCredentials> {
  if (creds.expires > Date.now()) return creds;
  return refreshCodex(creds);
}
