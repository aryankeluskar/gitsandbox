import { useState, type FormEvent } from "react";
import { parseRepoUrl, InvalidRepoUrlError } from "../lib/parseRepoUrl";

interface RepoInputProps {
  onSubmit: (target: { path: string; label: string }) => void;
  disabled?: boolean;
  initialValue?: string;
}

/*
 * Input shell uses concentric radii: outer rounded-2xl (16px) with p-1.5 (6px)
 * wraps an inner button at rounded-xl (12px) — 16 − 6 ≈ 10 → rounded-[10px].
 * We keep rounded-xl because it sits flush with the inner height.
 */
export function RepoInput({ onSubmit, disabled, initialValue }: RepoInputProps) {
  const [url, setUrl] = useState(initialValue ?? "");
  const [error, setError] = useState<string | null>(null);
  const [focused, setFocused] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    try {
      const parsed = parseRepoUrl(url);
      if (parsed.kind === "account") {
        onSubmit({ path: `/${parsed.owner}`, label: parsed.owner });
      } else {
        const branchSuffix =
          parsed.branch && parsed.branch !== "main"
            ? `/tree/${parsed.branch}`
            : "";
        onSubmit({
          path: `/${parsed.owner}/${parsed.repo}${branchSuffix}`,
          label: `${parsed.owner}/${parsed.repo}`,
        });
      }
    } catch (err) {
      if (err instanceof InvalidRepoUrlError) {
        setError(err.message);
      } else {
        setError("Invalid input");
      }
    }
  }

  const submitDisabled = disabled || !url.trim();

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div
        className={`group relative flex items-center gap-2 rounded-2xl border bg-zinc-900/60 p-1.5 shadow-soft shadow-inset-hair transition-[border-color,background-color,box-shadow] duration-200 ${focused
          ? "border-emerald-600/40 bg-zinc-900/80 ring-emerald-glow"
          : "border-zinc-800 hover:border-zinc-700"
          }`}
      >

        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Paste any GitHub URL or type owner/repo or organization"
          disabled={disabled}
          spellCheck={false}
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          className="min-w-0 ml-3 flex-1 bg-transparent px-1 py-2.5 font-display text-[14px] text-zinc-100 placeholder:font-sans placeholder:text-[13.5px] placeholder:text-zinc-600 outline-none disabled:opacity-50"
        />

        <button
          type="submit"
          disabled={submitDisabled}
          aria-label={disabled ? "Loading repository" : "Submit repository"}
          className="press focus-ring inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-[13px] font-semibold tracking-tight text-emerald-950 shadow-[0_1px_0_rgba(255,255,255,0.25)_inset,0_2px_8px_-2px_rgba(16,185,129,0.5)] transition-[background-color,transform,box-shadow,opacity] duration-200 hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-500 disabled:shadow-none"
        >
          <span className="relative block h-4 w-4 overflow-hidden">
            <span
              className="absolute inset-0 flex items-center justify-center transition-[opacity,transform,filter] duration-300 ease-[cubic-bezier(0.2,0,0,1)]"
              style={{
                opacity: disabled ? 0 : 1,
                transform: disabled ? "translateY(-6px)" : "translateY(0)",
                filter: disabled ? "blur(2px)" : "blur(0)",
              }}
            >
              {/* Start */}
              <svg
                width="12"
                height="12"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 3l5 5-5 5" />
              </svg>
            </span>
            <span
              className="absolute inset-0 flex items-center justify-center gap-1.5 transition-[opacity,transform,filter] duration-300 ease-[cubic-bezier(0.2,0,0,1)]"
              style={{
                opacity: disabled ? 1 : 0,
                transform: disabled ? "translateY(0)" : "translateY(6px)",
                filter: disabled ? "blur(0)" : "blur(2px)",
              }}
            >
              <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </span>
          </span>
        </button>
      </div>
      {error && (
        <p className="mt-2 pl-1 text-[13px] text-red-400 animate-fade-in">{error}</p>
      )}
    </form>
  );
}
