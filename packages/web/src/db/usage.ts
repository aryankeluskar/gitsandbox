import { db, type UsageEntry } from "./index";

export async function addUsageEntry(
  entry: Omit<UsageEntry, "id" | "timestamp">
): Promise<void> {
  await db.usage.add({ ...entry, timestamp: new Date() });
}

export async function getSessionUsage(
  sessionId: number
): Promise<UsageEntry[]> {
  return db.usage.where("sessionId").equals(sessionId).toArray();
}

export async function getTotalUsage(): Promise<{
  totalInputTokens: number;
  totalOutputTokens: number;
}> {
  const all = await db.usage.toArray();
  return all.reduce(
    (acc, e) => ({
      totalInputTokens: acc.totalInputTokens + e.inputTokens,
      totalOutputTokens: acc.totalOutputTokens + e.outputTokens,
    }),
    { totalInputTokens: 0, totalOutputTokens: 0 }
  );
}
