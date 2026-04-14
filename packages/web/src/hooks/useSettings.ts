import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db";

export type AgentChoice = "opencode" | "pi";

const DEFAULTS: Record<string, string> = {
  agent: "opencode",
  theme: "dark",
  model: "claude-sonnet-4",
  defaultBranch: "main",
};

export function useSettings() {
  const rows = useLiveQuery(() => db.settings.toArray(), []);
  const map = new Map(rows?.map((r) => [r.key, r.value]));

  function get(key: string): string {
    return map.get(key) ?? DEFAULTS[key] ?? "";
  }

  async function set(key: string, value: string): Promise<void> {
    await db.settings.put({ key, value });
  }

  return { get, set, ready: rows !== undefined };
}
