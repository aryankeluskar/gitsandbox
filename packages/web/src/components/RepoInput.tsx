import { useState, type FormEvent } from "react";
import { parseRepoUrl, InvalidRepoUrlError } from "../lib/parseRepoUrl";

interface RepoInputProps {
  onSubmit: (target: { path: string; label: string }) => void;
  disabled?: boolean;
  initialValue?: string;
}

export function RepoInput({ onSubmit, disabled, initialValue }: RepoInputProps) {
  const [url, setUrl] = useState(initialValue ?? "");
  const [error, setError] = useState<string | null>(null);

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

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-xl">
      <div className="relative">
        <div className="flex items-center rounded-2xl border border-zinc-800 bg-zinc-900/60 shadow-soft shadow-inset-hair transition-[border-color,background-color,box-shadow] duration-200 focus-within:border-emerald-700/50 focus-within:bg-zinc-900 focus-within:ring-2 focus-within:ring-emerald-500/10">
          <div className="pl-4 text-zinc-600">
            <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor" className="opacity-60">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
            </svg>
          </div>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="owner/repo or organization or paste a GitHub URL"
            disabled={disabled}
            className="flex-1 bg-transparent px-3 py-3.5 text-[14px] text-zinc-100 placeholder-zinc-600 outline-none disabled:opacity-50"
          />
          <div className="pr-2">
            <button
              type="submit"
              disabled={disabled || !url.trim()}
              className="press focus-ring rounded-xl bg-emerald-500 px-4 py-2 text-[13px] font-semibold text-emerald-950 shadow-soft hover:bg-emerald-400 disabled:opacity-40 disabled:hover:bg-emerald-500"
            >
              {disabled ? (
                <span className="flex items-center gap-2">
                  <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                    <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                  Starting
                </span>
              ) : (
                "Start"
              )}
            </button>
          </div>
        </div>
      </div>
      {error && (
        <p className="mt-2 text-[13px] text-red-400">{error}</p>
      )}
    </form>
  );
}
