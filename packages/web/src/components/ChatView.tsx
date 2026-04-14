import { useRef, useEffect } from "react";
import { ChatMessage } from "./ChatMessage";
import { ChatComposer } from "./ChatComposer";
import type { UseOpenCodeReturn } from "../hooks/useOpenCode";

interface ChatViewProps {
  opencode: UseOpenCodeReturn;
  repoLabel: string;
}

export function ChatView({ opencode, repoLabel }: ChatViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { messages, status, error, sendMessage, abort } = opencode;

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages]);

  const isEmpty = messages.length === 0 && status === "idle";

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {isEmpty && (
          <div className="flex h-full flex-col items-center justify-center px-6 text-center">
            <div className="mb-6 rounded-2xl bg-zinc-900/50 p-4">
              <svg width="32" height="32" viewBox="0 0 16 16" fill="none" className="text-zinc-600">
                <rect x="1.5" y="2.5" width="13" height="11" rx="1.5" stroke="currentColor" strokeWidth="1" />
                <path d="M4 8h3M4 6h5M4 10h4" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" />
              </svg>
            </div>
            <h3 className="mb-2 text-lg font-medium text-zinc-300">
              {repoLabel}
            </h3>
            <p className="max-w-sm text-[13px] text-zinc-600">
              Ask anything about this codebase. The agent can read files,
              run commands, and search code to answer your questions.
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <ChatMessage
            key={msg.info.id}
            message={msg}
            allMessages={messages}
          />
        ))}

        {status === "streaming" && messages.length > 0 && (
          <div className="px-4 py-3">
            <div className="flex items-center gap-2 text-[13px] text-zinc-500">
              <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" className="opacity-20" />
                <path d="M2 8a6 6 0 016-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              Agent is working...
            </div>
          </div>
        )}

        {error && (
          <div className="px-4 py-3">
            <div className="rounded-lg border border-red-900/40 bg-red-950/20 px-3 py-2 text-[13px] text-red-400">
              {error}
            </div>
          </div>
        )}
      </div>

      <ChatComposer
        onSend={sendMessage}
        onAbort={abort}
        status={status}
        disabled={!opencode.session}
      />
    </div>
  );
}
