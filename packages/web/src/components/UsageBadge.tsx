import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db";
import { estimateCost, formatCost } from "../lib/estimateCost";

interface UsageBadgeProps {
  sessionId?: number;
}

export function UsageBadge({ sessionId }: UsageBadgeProps) {
  const entries = useLiveQuery(
    () =>
      sessionId
        ? db.usage.where("sessionId").equals(sessionId).toArray()
        : db.usage.toArray(),
    [sessionId]
  );

  if (!entries?.length) return null;

  const totalCost = entries.reduce(
    (sum, e) =>
      sum +
      estimateCost({
        provider: e.provider,
        model: e.model,
        inputTokens: e.inputTokens,
        outputTokens: e.outputTokens,
      }),
    0
  );

  const totalTokens = entries.reduce(
    (sum, e) => sum + e.inputTokens + e.outputTokens,
    0
  );

  return (
    <div className="flex items-center gap-3 rounded-md bg-zinc-800/50 px-3 py-1.5 text-xs text-zinc-400">
      <span>{totalTokens.toLocaleString()} tokens</span>
      <span className="text-zinc-600">|</span>
      <span>{formatCost(totalCost)}</span>
    </div>
  );
}
