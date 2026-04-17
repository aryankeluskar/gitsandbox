const CLIENT_ID = "app_EMoamEEZ73f0CkXaXp7hrann";
const TOKEN_URL = "https://auth.openai.com/oauth/token";
const JWT_CLAIM_PATH = "https://api.openai.com/auth";

export interface CodexCredentials {
  access: string;
  refresh: string;
  accountId: string;
  expires: number;
  providerId: "openai-codex";
}

interface CodexCredentialsDraft {
  access?: unknown;
  accountId?: unknown;
  expires?: unknown;
  providerId?: unknown;
  refresh?: unknown;
}

function decodeJwt(token: string): Record<string, unknown> | undefined {
  const parts = token.split(".");
  if (parts.length !== 3 || !parts[1]) return undefined;
  try {
    const normalized = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    return JSON.parse(atob(padded));
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

function decodeBase64Url(value: string): string {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function requireString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`Login code is missing ${field}`);
  }
  return value;
}

function requireNumber(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`Login code has invalid ${field}`);
  }
  return value;
}

function validateDraft(draft: CodexCredentialsDraft): CodexCredentials {
  if (draft.providerId !== "openai-codex") {
    throw new Error("Login code is not for ChatGPT / Codex");
  }
  return {
    access: requireString(draft.access, "access token"),
    refresh: requireString(draft.refresh, "refresh token"),
    accountId: requireString(draft.accountId, "accountId"),
    expires: requireNumber(draft.expires, "expires"),
    providerId: "openai-codex",
  };
}

export function parseImportedCodexCredentials(value: string): CodexCredentials {
  const trimmed = value.trim();
  if (trimmed.length === 0) throw new Error("Paste the login code first");

  let jsonText: string;
  if (trimmed.startsWith("{")) {
    jsonText = trimmed;
  } else {
    try {
      jsonText = decodeBase64Url(trimmed);
    } catch {
      throw new Error("Login code is not valid base64url");
    }
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new Error("Login code is not valid JSON");
  }

  if (typeof parsed !== "object" || parsed === null) {
    throw new Error("Login code must be a JSON object");
  }

  const draft = parsed as CodexCredentialsDraft;

  // If accountId is missing but access token is a JWT we can recover it
  if (typeof draft.accountId !== "string" && typeof draft.access === "string") {
    const recovered = getAccountId(draft.access);
    if (recovered) draft.accountId = recovered;
  }

  return validateDraft(draft);
}

async function postTokenRequest(
  body: Record<string, string>,
): Promise<Record<string, unknown>> {
  const res = await fetch(TOKEN_URL, {
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

export async function refreshCodex(creds: CodexCredentials): Promise<CodexCredentials> {
  const tokenData = await postTokenRequest({
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

  const accountId = getAccountId(access) ?? creds.accountId;
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
