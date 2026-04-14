import { useRef, useState } from "react";
import { useTerminal, type TerminalState } from "../hooks/useTerminal";
import "@xterm/xterm/css/xterm.css";

interface TerminalViewProps {
  sandboxId: string | null;
}

const STATE_LABELS: Record<TerminalState, string> = {
  disconnected: "Disconnected",
  connecting: "Connecting...",
  connected: "Connected",
  error: "Connection Error",
};

const STATE_DOT: Record<TerminalState, string> = {
  disconnected: "bg-zinc-500",
  connecting: "bg-amber-400 animate-pulse",
  connected: "bg-emerald-400",
  error: "bg-red-400",
};

export function TerminalView({ sandboxId }: TerminalViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<TerminalState>("disconnected");

  useTerminal({
    sandboxId,
    containerRef,
    onStateChange: setState,
  });

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-zinc-800/60 bg-zinc-950 px-4 py-2">
        <span className={`h-1.5 w-1.5 rounded-full ${STATE_DOT[state]}`} />
        <span className="text-[11px] font-medium text-zinc-500">
          {STATE_LABELS[state]}
        </span>
        {sandboxId && (
          <span className="ml-auto font-mono text-[11px] text-zinc-700">
            {sandboxId.slice(0, 8)}
          </span>
        )}
      </div>
      <div ref={containerRef} className="flex-1 bg-[#09090b] p-1" />
    </div>
  );
}
