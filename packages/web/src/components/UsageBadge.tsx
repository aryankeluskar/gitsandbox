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
    <div className="flex items-center gap-2 rounded-lg bg-zinc-900/50 px-2.5 py-1 text-[11px] font-medium text-zinc-500">
      <span>{totalTokens.toLocaleString()} tok</span>
      <span className="text-zinc-700">/</span>
      <span>{formatCost(totalCost)}</span>
    </div>
  );
}
