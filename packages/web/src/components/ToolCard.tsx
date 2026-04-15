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
  _result?: unknown
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

  const statusDot = isError
    ? "bg-red-500"
    : isRunning
      ? "bg-amber-400 animate-pulse"
      : "bg-emerald-500";

  return (
    <div
      className={`overflow-hidden rounded-xl border bg-zinc-900/40 transition-all duration-300 ease-smooth ${
        isError
          ? "border-red-900/50"
          : isRunning
            ? "border-amber-900/40"
            : "border-zinc-800/70"
      } hover:border-zinc-700/80`}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="press focus-ring flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left hover:bg-zinc-800/30"
      >
        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${statusDot}`} />
        <span className="text-[12.5px] font-medium text-zinc-200">
          {displayName}
        </span>
        {summary && (
          <span className="flex-1 truncate font-mono text-[12px] text-zinc-500">
            {summary}
          </span>
        )}
        <svg
          width="12"
          height="12"
          viewBox="0 0 16 16"
          fill="none"
          className={`shrink-0 text-zinc-500 transition-transform duration-300 ease-smooth ${
            expanded ? "rotate-90" : ""
          }`}
        >
          <path
            d="M6 4l4 4-4 4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </button>

      <div
        className={`grid transition-all duration-300 ease-smooth ${
          expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="border-t border-zinc-800/60 px-3.5 py-3">
            {args && (
              <div className="mb-3">
                <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                  Input
                </div>
                <pre className="max-h-40 overflow-auto rounded-md bg-zinc-950/80 p-2.5 text-[12px] leading-relaxed text-zinc-400 ring-1 ring-zinc-800/60">
                  {JSON.stringify(args, null, 2)}
                </pre>
              </div>
            )}
            {resultText && (
              <div>
                <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                  Output
                </div>
                <pre className="max-h-60 overflow-auto whitespace-pre-wrap rounded-md bg-zinc-950/80 p-2.5 text-[12px] leading-relaxed text-zinc-400 ring-1 ring-zinc-800/60">
                  {resultText.slice(0, 5000)}
                  {resultText.length > 5000 && "\n... (truncated)"}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
