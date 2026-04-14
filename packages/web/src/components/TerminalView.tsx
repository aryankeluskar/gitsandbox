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

const STATE_COLORS: Record<TerminalState, string> = {
  disconnected: "bg-zinc-500",
  connecting: "bg-yellow-500",
  connected: "bg-green-500",
  error: "bg-red-500",
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
      <div className="flex items-center gap-2 border-b border-zinc-800 bg-zinc-950 px-4 py-2">
        <span
          className={`h-2 w-2 rounded-full ${STATE_COLORS[state]}`}
        />
        <span className="text-xs text-zinc-400">
          {STATE_LABELS[state]}
        </span>
        {sandboxId && (
          <span className="ml-auto font-mono text-xs text-zinc-600">
            {sandboxId.slice(0, 8)}
          </span>
        )}
      </div>
      <div ref={containerRef} className="flex-1 bg-[#0a0a0a] p-1" />
    </div>
  );
}
