import { useState } from "react";

interface ReasoningProps {
  thinking: string;
  durationSec?: number;
  isStreaming?: boolean;
}

export function Reasoning({ thinking, durationSec, isStreaming }: ReasoningProps) {
  const [expanded, setExpanded] = useState(false);

  const label = isStreaming
    ? "Thinking..."
    : durationSec
      ? `Thought for ${durationSec} second${durationSec !== 1 ? "s" : ""}`
      : "Thought for a few seconds";

  return (
    <div className="mb-3">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-[13px] text-zinc-500 transition hover:text-zinc-300"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 16 16"
          fill="none"
          className={`transition-transform ${expanded ? "rotate-90" : ""}`}
        >
          <path
            d="M6 4l4 4-4 4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.2" />
          <path d="M8 5v3l2 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
        <span>{label}</span>
      </button>

      {expanded && thinking && (
        <div className="mt-2 rounded-lg border border-zinc-800/60 bg-zinc-900/40 p-3 text-[13px] leading-relaxed text-zinc-400">
          {thinking}
        </div>
      )}
    </div>
  );
}
