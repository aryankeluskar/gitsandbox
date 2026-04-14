import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db";

export interface CredentialStatus {
  hasAnyKey: boolean;
  providers: { key: string; label: string; configured: boolean }[];
  ready: boolean;
}

const PROVIDERS = [
  { key: "ANTHROPIC_API_KEY", label: "Anthropic" },
  { key: "OPENAI_API_KEY", label: "OpenAI" },
  { key: "GOOGLE_API_KEY", label: "Google AI" },
];

export function useCredentialStatus(): CredentialStatus {
  const rows = useLiveQuery(() => db.credentials.toArray(), []);
  const keys = new Set(rows?.map((r) => r.key));

  const providers = PROVIDERS.map((p) => ({
    ...p,
    configured: keys.has(p.key),
  }));

  return {
    hasAnyKey: providers.some((p) => p.configured),
    providers,
    ready: rows !== undefined,
  };
}
