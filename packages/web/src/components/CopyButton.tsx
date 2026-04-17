import { useState } from "react";

interface CopyButtonProps {
  getText: () => string;
  label?: string;
  text?: string;
  className?: string;
}

export function CopyButton({ getText, label = "Copy", text = "Copy", className = "" }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(getText());
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  }

  return (
    <button
      onClick={handleCopy}
      className={`press focus-ring inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11.5px] text-zinc-500 transition-[color,background-color] hover:bg-zinc-800/60 hover:text-zinc-200 ${className}`}
      aria-label={label}
      title={label}
    >
      {copied ? (
        <>
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 8.5L6.5 12 13 4.5" />
          </svg>
          <span>Copied</span>
        </>
      ) : (
        <>
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="5" y="5" width="9" height="9" rx="1.5" />
            <path d="M11 5V3.5A1.5 1.5 0 0 0 9.5 2h-6A1.5 1.5 0 0 0 2 3.5v6A1.5 1.5 0 0 0 3.5 11H5" />
          </svg>
          <span>{text}</span>
        </>
      )}
    </button>
  );
}
