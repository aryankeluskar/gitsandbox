import { useState, useRef, useCallback } from "react";
import type { ChatStatus } from "../hooks/useOpenCode";

interface ChatComposerProps {
  onSend: (text: string) => void;
  onAbort: () => void;
  status: ChatStatus;
  disabled?: boolean;
}

export function ChatComposer({ onSend, onAbort, status, disabled }: ChatComposerProps) {
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isStreaming = status === "streaming" || status === "loading";

  const handleSubmit = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;

    if (isStreaming) {
      onAbort();
      return;
    }

    onSend(trimmed);
    setText("");

    requestAnimationFrame(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    });
  }, [text, disabled, isStreaming, onSend, onAbort]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  const handleInput = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, []);

  return (
    <div className="border-t border-zinc-800/40 bg-black/80 backdrop-blur-sm px-4 py-3">
      <div className="mx-auto flex max-w-3xl items-end gap-2">
        <div className="relative flex-1">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              handleInput();
            }}
            onKeyDown={handleKeyDown}
            placeholder="What would you like to know?"
            disabled={disabled}
            rows={1}
            className="w-full resize-none rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-3 pr-12 text-[14px] text-zinc-100 placeholder-zinc-600 outline-none transition focus:border-zinc-700 disabled:opacity-40"
          />
          <button
            onClick={handleSubmit}
            disabled={disabled || (!text.trim() && !isStreaming)}
            className="absolute bottom-2 right-2 rounded-lg p-1.5 text-zinc-500 transition hover:bg-zinc-800 hover:text-zinc-300 disabled:opacity-30"
          >
            {isStreaming ? (
              <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor">
                <rect x="3" y="3" width="10" height="10" rx="1.5" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
                <path
                  d="M8 14V2m0 0L3 7m5-5l5 5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      {isStreaming && (
        <p className="mt-2 text-center text-[11px] text-zinc-600">
          Agent is working...{" "}
          <button onClick={onAbort} className="text-zinc-500 underline hover:text-zinc-400">
            Stop
          </button>
        </p>
      )}
    </div>
  );
}
