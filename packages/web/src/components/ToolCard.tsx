import { useState } from "react";

interface ToolCardProps {
  toolName: string;
  args?: Record<string, unknown>;
  result?: unknown;
  isRunning?: boolean;
  isError?: boolean;
}

function formatToolName(name: string): string {
  const parts = name.split(/[._-]/);
  return parts[parts.length - 1] || name;
}

function extractSummary(
  name: string,
  args?: Record<string, unknown>,
  result?: unknown
): string {
  const shortName = formatToolName(name);

  if (shortName === "bash" || shortName === "shell") {
    const cmd = args?.command as string;
    return cmd ? cmd.slice(0, 80) : "running command...";
  }
  if (shortName === "read" || shortName === "readFile") {
    return (args?.path as string) || "reading file...";
  }
  if (shortName === "write" || shortName === "writeFile") {
    return (args?.path as string) || "writing file...";
  }
  if (shortName === "glob" || shortName === "find") {
    return (args?.pattern as string) || "searching files...";
  }
  if (shortName === "grep" || shortName === "search") {
    return (args?.pattern as string) || "searching...";
  }

  if (args?.command) return String(args.command).slice(0, 80);
  if (args?.path) return String(args.path);
  return "";
}

function resultToString(result: unknown): string {
  if (result === null || result === undefined) return "";
  if (typeof result === "string") return result;
  if (typeof result === "object") {
    const r = result as Record<string, unknown>;
    if (r.text) return String(r.text);
    if (r.stdout) return String(r.stdout);
    if (r.content) return String(r.content);
    return JSON.stringify(result, null, 2);
  }
  return String(result);
}

export function ToolCard({
  toolName,
  args,
  result,
  isRunning,
  isError,
}: ToolCardProps) {
  const [expanded, setExpanded] = useState(false);
  const displayName = formatToolName(toolName);
  const summary = extractSummary(toolName, args, result);
  const resultText = resultToString(result);

  const statusColor = isError
    ? "text-red-400"
    : isRunning
      ? "text-amber-400"
      : "text-emerald-400";

  const statusLabel = isError
    ? "Error"
    : isRunning
      ? "Running"
      : "Completed";

  return (
    <div className="mb-2 overflow-hidden rounded-lg border border-zinc-800/60 bg-zinc-900/30">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-2 px-3 py-2.5 text-left transition hover:bg-zinc-800/30"
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="shrink-0 text-zinc-500">
          <path d="M3 2h4l1 2h5a1 1 0 011 1v7a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.2" />
        </svg>
        <span className="text-[13px] font-medium text-zinc-300">
          {displayName}
        </span>
        <span className={`flex items-center gap-1 text-[11px] font-medium ${statusColor}`}>
          {!isRunning && !isError && (
            <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0a8 8 0 110 16A8 8 0 018 0zm3.41 5.59a1 1 0 00-1.41 0L7 8.59 5.41 7a1 1 0 10-1.41 1.41l2.29 2.3a1 1 0 001.41 0l3.71-3.71a1 1 0 000-1.41z" />
            </svg>
          )}
          {isRunning && (
            <svg className="h-2.5 w-2.5 animate-spin" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" className="opacity-20" />
              <path d="M2 8a6 6 0 016-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          )}
          {statusLabel}
        </span>
        {summary && (
          <span className="ml-auto truncate text-[12px] text-zinc-600 max-w-[300px]">
            {summary}
          </span>
        )}
        <svg
          width="12"
          height="12"
          viewBox="0 0 16 16"
          fill="none"
          className={`shrink-0 text-zinc-600 transition-transform ${expanded ? "rotate-90" : ""}`}
        >
          <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>

      {expanded && (
        <div className="border-t border-zinc-800/40 px-3 py-2.5">
          {args && (
            <div className="mb-2">
              <div className="mb-1 text-[10px] font-medium uppercase tracking-wider text-zinc-600">
                Input
              </div>
              <pre className="max-h-40 overflow-auto rounded bg-zinc-950/60 p-2 text-[12px] text-zinc-400">
                {JSON.stringify(args, null, 2)}
              </pre>
            </div>
          )}
          {resultText && (
            <div>
              <div className="mb-1 text-[10px] font-medium uppercase tracking-wider text-zinc-600">
                Output
              </div>
              <pre className="max-h-60 overflow-auto rounded bg-zinc-950/60 p-2 text-[12px] text-zinc-400 whitespace-pre-wrap">
                {resultText.slice(0, 5000)}
                {resultText.length > 5000 && "\n... (truncated)"}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
