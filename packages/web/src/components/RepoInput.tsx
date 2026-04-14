import { useState, type FormEvent } from "react";
import { parseRepoUrl, InvalidRepoUrlError } from "../lib/parseRepoUrl";

interface RepoInputProps {
  onSubmit: (repoUrl: string, branch: string) => void;
  disabled?: boolean;
}

export function RepoInput({ onSubmit, disabled }: RepoInputProps) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    try {
      const parsed = parseRepoUrl(url);
      onSubmit(`https://github.com/${parsed.owner}/${parsed.repo}`, parsed.branch);
    } catch (err) {
      if (err instanceof InvalidRepoUrlError) {
        setError(err.message);
      } else {
        setError("Invalid input");
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl">
      <div className="flex gap-2">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://github.com/owner/repo or owner/repo"
          disabled={disabled}
          className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-zinc-100 placeholder-zinc-500 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={disabled || !url.trim()}
          className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600"
        >
          {disabled ? "Starting..." : "Start"}
        </button>
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-400">{error}</p>
      )}
    </form>
  );
}
