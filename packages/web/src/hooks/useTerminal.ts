import { useEffect, useRef, useCallback } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { SandboxAddon } from "@cloudflare/sandbox/xterm";

export type TerminalState =
  | "disconnected"
  | "connecting"
  | "connected"
  | "error";

interface UseTerminalOptions {
  sandboxId: string | null;
  containerRef: React.RefObject<HTMLDivElement | null>;
  onStateChange?: (state: TerminalState) => void;
}

export function useTerminal({
  sandboxId,
  containerRef,
  onStateChange,
}: UseTerminalOptions) {
  const termRef = useRef<Terminal | null>(null);
  const fitRef = useRef<FitAddon | null>(null);
  const addonRef = useRef<SandboxAddon | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const terminal = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      theme: {
        background: "#0a0a0a",
        foreground: "#e4e4e7",
        cursor: "#a1a1aa",
        selectionBackground: "#27272a",
      },
    });

    const fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);

    const sandboxAddon = new SandboxAddon({
      getWebSocketUrl: ({ sandboxId: id }) => {
        const proto = location.protocol === "https:" ? "wss:" : "ws:";
        return `${proto}//${location.host}/ws/terminal?id=${encodeURIComponent(id)}`;
      },
      onStateChange: (state, error) => {
        const mapped: TerminalState =
          state === "connected"
            ? "connected"
            : state === "connecting"
              ? "connecting"
              : error
                ? "error"
                : "disconnected";
        onStateChange?.(mapped);
      },
    });
    terminal.loadAddon(sandboxAddon);

    terminal.open(container);
    fitAddon.fit();

    termRef.current = terminal;
    fitRef.current = fitAddon;
    addonRef.current = sandboxAddon;

    const handleResize = () => fitAddon.fit();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      sandboxAddon.disconnect();
      terminal.dispose();
      termRef.current = null;
      fitRef.current = null;
      addonRef.current = null;
    };
  }, [containerRef, onStateChange]);

  useEffect(() => {
    if (sandboxId && addonRef.current) {
      addonRef.current.connect({ sandboxId });
    }
  }, [sandboxId]);

  const fit = useCallback(() => {
    fitRef.current?.fit();
  }, []);

  return { terminal: termRef, fit };
}
