import Dexie, { type EntityTable } from "dexie";

export interface Session {
  id?: number;
  repoUrl: string;
  agent: string;
  /** LLM provider (e.g. anthropic, openai, github-copilot). */
  provider?: string;
  /** Human-readable title derived from the first user message. */
  title?: string;
  /** Git ref the session is scoped to. Undefined for account-scope sessions. */
  branch?: string;
  sandboxId: string;
  createdAt: Date;
  lastActiveAt: Date;
}

/**
 * A single persisted agent message. `data` is a JSON-serialized AgentMessage
 * so that the agent transcript round-trips losslessly across reloads.
 */
export interface StoredMessage {
  id?: number;
  sessionId: number;
  order: number;
  data: string;
  updatedAt: Date;
}

export interface Setting {
  key: string;
  value: string;
}

export interface Credential {
  key: string;
  value: string;
}

export interface UsageEntry {
  id?: number;
  sessionId: number;
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  timestamp: Date;
}

export const db = new Dexie("gitsandbox") as Dexie & {
  sessions: EntityTable<Session, "id">;
  messages: EntityTable<StoredMessage, "id">;
  settings: EntityTable<Setting, "key">;
  credentials: EntityTable<Credential, "key">;
  usage: EntityTable<UsageEntry, "id">;
};

db.version(1).stores({
  sessions: "++id, repoUrl, agent, createdAt, lastActiveAt",
  messages: "++id, sessionId, role, timestamp",
  settings: "key",
  credentials: "key",
  usage: "++id, sessionId, provider, model, timestamp",
});

db.version(2).stores({
  sessions: "++id, repoUrl, agent, provider, createdAt, lastActiveAt",
  messages: "++id, sessionId, role, timestamp",
  settings: "key",
  credentials: "key",
  usage: "++id, sessionId, provider, model, timestamp",
});

db.version(3).stores({
  sessions: "++id, repoUrl, agent, provider, title, createdAt, lastActiveAt",
  messages: "++id, sessionId, role, timestamp",
  settings: "key",
  credentials: "key",
  usage: "++id, sessionId, provider, model, timestamp",
});

db.version(4)
  .stores({
    sessions: "++id, repoUrl, agent, provider, title, branch, createdAt, lastActiveAt",
    messages: "++id, sessionId, [sessionId+order], order",
    settings: "key",
    credentials: "key",
    usage: "++id, sessionId, provider, model, timestamp",
  })
  .upgrade(async (tx) => {
    // Prior `messages` rows used a different shape and were never written by
    // application code. Clearing keeps the table consistent with the new
    // StoredMessage contract.
    await tx.table("messages").clear();
  });
