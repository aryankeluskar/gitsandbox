import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db";

interface SessionSidebarProps {
  activeSessionId?: number;
  onSelect: (sessionId: number, sandboxId: string) => void;
}

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export function SessionSidebar({ activeSessionId, onSelect }: SessionSidebarProps) {
  const sessions = useLiveQuery(
    () => db.sessions.orderBy("lastActiveAt").reverse().toArray(),
    []
  );

  if (!sessions?.length) {
    return (
      <div className="p-4 text-sm text-zinc-500">
        No previous sessions
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1 p-2">
      <h2 className="px-2 py-1 text-xs font-semibold uppercase tracking-wider text-zinc-500">
        History
      </h2>
      {sessions.map((s) => (
        <button
          key={s.id}
          onClick={() => onSelect(s.id!, s.sandboxId)}
          className={`rounded-md px-3 py-2 text-left transition ${
            s.id === activeSessionId
              ? "bg-zinc-800 text-zinc-100"
              : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
          }`}
        >
          <div className="truncate text-sm font-medium">{s.repoUrl}</div>
          <div className="mt-0.5 flex items-center gap-2 text-xs text-zinc-500">
            <span className="rounded bg-zinc-800 px-1.5 py-0.5">
              {s.agent}
            </span>
            <span>{timeAgo(s.lastActiveAt)}</span>
          </div>
        </button>
      ))}
    </div>
  );
}
