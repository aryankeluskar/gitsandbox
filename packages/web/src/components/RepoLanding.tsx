import type { AgentChoice } from "../hooks/useSettings";
import type { CredentialStatus } from "../hooks/useCredentialStatus";

interface RepoLandingProps {
  owner: string;
  repo: string;
  branch: string;
  agent: AgentChoice;
  onAgentChange: (agent: AgentChoice) => void;
  credentialStatus: CredentialStatus;
  onOpenSettings: () => void;
  onStart: () => void;
  loading: boolean;
  error: string | null;
}

export function RepoLanding({
  owner,
  repo,
  branch,
  agent,
  onAgentChange,
  credentialStatus,
  onOpenSettings,
  onStart,
  loading,
  error,
}: RepoLandingProps) {
  const repoPath = `${owner}/${repo}`;
  const githubUrl = `https://github.com/${repoPath}`;

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6">
      <div className="animate-fade-in w-full max-w-md">
        {/* Repo card */}
        <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/30 p-5">
          <div className="flex items-start gap-3.5">
            <img
              src={`https://github.com/${owner}.png?size=64`}
              alt={owner}
              className="h-10 w-10 rounded-lg bg-zinc-800"
            />
            <div className="min-w-0 flex-1">
              <a
                href={githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-1.5"
              >
                <h2 className="truncate text-[15px] font-semibold text-zinc-100 group-hover:text-white">
                  {repoPath}
                </h2>
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="shrink-0 text-zinc-600 group-hover:text-zinc-400"
                >
                  <path d="M6 3h7v7M13 3L6 10" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
              <div className="mt-1 flex items-center gap-2 text-[12px] text-zinc-500">
                <span className="rounded bg-zinc-800/80 px-1.5 py-0.5 font-mono text-[11px]">
                  {branch}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Agent picker */}
        <div className="mt-6">
          <label className="mb-2 block text-[12px] font-medium uppercase tracking-widest text-zinc-600">
            Agent
          </label>
          <div className="flex gap-2">
            <AgentOption
              id="opencode"
              label="OpenCode"
              description="Open-source coding agent"
              selected={agent === "opencode"}
              onSelect={() => onAgentChange("opencode")}
            />
          </div>
        </div>

        {/* API key status */}
        <div className="mt-6">
          <label className="mb-2 block text-[12px] font-medium uppercase tracking-widest text-zinc-600">
            Provider
          </label>

          {credentialStatus.hasAnyKey ? (
            <div className="flex flex-wrap gap-2">
              {credentialStatus.providers
                .filter((p) => p.configured)
                .map((p) => (
                  <span
                    key={p.key}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-950/30 px-2.5 py-1.5 text-[12px] font-medium text-emerald-400"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    {p.label}
                  </span>
                ))}
              <button
                onClick={onOpenSettings}
                className="rounded-lg px-2.5 py-1.5 text-[12px] text-zinc-600 transition hover:text-zinc-400"
              >
                Edit keys
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenSettings}
              className="flex w-full items-center gap-3 rounded-xl border border-dashed border-zinc-800 px-4 py-3 text-left transition hover:border-zinc-700 hover:bg-zinc-900/30"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M8 2v12M14 8H2" />
                </svg>
              </div>
              <div>
                <p className="text-[13px] font-medium text-zinc-300">
                  Add an API key
                </p>
                <p className="text-[12px] text-zinc-600">
                  Anthropic, OpenAI, or Google AI -- stored locally
                </p>
              </div>
            </button>
          )}
        </div>

        {/* Start button */}
        <div className="mt-8">
          <button
            onClick={onStart}
            disabled={loading || !credentialStatus.hasAnyKey}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-100 py-3 text-[14px] font-semibold text-zinc-900 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-zinc-100"
          >
            {loading ? (
              <>
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-20" />
                  <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
                Starting sandbox...
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <rect x="1.5" y="2.5" width="13" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
                  <path d="M4 8h3M4 6h5M4 10h4" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
                </svg>
                Open in sandbox
              </>
            )}
          </button>

          {!credentialStatus.hasAnyKey && (
            <p className="mt-2 text-center text-[12px] text-zinc-600">
              Add at least one API key to get started
            </p>
          )}
        </div>

        {/* Error */}
        {error && (
          <p className="mt-4 text-center text-[13px] text-red-400">{error}</p>
        )}

        {/* Switch repo */}
        <div className="mt-8 text-center">
          <a
            href="/"
            className="text-[12px] text-zinc-600 transition hover:text-zinc-400"
          >
            Switch to a different repository
          </a>
        </div>
      </div>
    </div>
  );
}

function AgentOption({
  id,
  label,
  description,
  selected,
  onSelect,
}: {
  id: string;
  label: string;
  description: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={`flex-1 rounded-xl border px-4 py-3 text-left transition ${
        selected
          ? "border-zinc-600 bg-zinc-800/60"
          : "border-zinc-800/60 hover:border-zinc-700 hover:bg-zinc-900/30"
      }`}
    >
      <div className="flex items-center gap-2">
        <div
          className={`h-3 w-3 rounded-full border-2 ${
            selected ? "border-zinc-100 bg-zinc-100" : "border-zinc-700"
          }`}
        />
        <span className="text-[13px] font-medium text-zinc-200">{label}</span>
      </div>
      <p className="mt-1 pl-5 text-[11px] text-zinc-500">{description}</p>
    </button>
  );
}
