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
  branch: _branch,
  agent: _agent,
  onAgentChange: _onAgentChange,
  credentialStatus,
  onOpenSettings,
  onStart,
  loading,
  error,
}: RepoLandingProps) {
  const repoPath = `${owner}/${repo}`;

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6">
      <div className="animate-fade-in w-full max-w-lg text-center">
        {/* Big repo identity */}
        <img
          src={`https://github.com/${owner}.png?size=80`}
          alt={owner}
          className="mx-auto mb-5 h-16 w-16 rounded-2xl bg-zinc-800"
        />
        <h2 className="mb-1 text-xl font-semibold tracking-tight">
          {repoPath}
        </h2>
        <p className="mb-8 text-[13px] text-zinc-500">
          Open a sandbox with an AI coding agent
        </p>

        {/* Key status + main CTA */}
        {credentialStatus.hasAnyKey ? (
          <div>
            <button
              onClick={onStart}
              disabled={loading}
              className="inline-flex items-center gap-2.5 rounded-xl bg-zinc-100 px-8 py-3 text-[14px] font-semibold text-zinc-900 transition hover:bg-white disabled:opacity-60"
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

            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              {credentialStatus.providers
                .filter((p) => p.configured)
                .map((p) => (
                  <span
                    key={p.key}
                    className="inline-flex items-center gap-1.5 text-[11px] text-zinc-500"
                  >
                    <span className="h-1 w-1 rounded-full bg-emerald-500" />
                    {p.label}
                  </span>
                ))}
              <span className="text-zinc-800">|</span>
              <button
                onClick={onOpenSettings}
                className="text-[11px] text-zinc-600 transition hover:text-zinc-400"
              >
                Settings
              </button>
            </div>
          </div>
        ) : (
          <div>
            <button
              onClick={onOpenSettings}
              className="inline-flex items-center gap-2.5 rounded-xl bg-zinc-100 px-8 py-3 text-[14px] font-semibold text-zinc-900 transition hover:bg-white"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M8 2v12M14 8H2" />
              </svg>
              Add an API key to start
            </button>
            <p className="mt-3 text-[12px] text-zinc-600">
              Anthropic, OpenAI, or Google AI -- stored only in this browser
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <p className="mt-4 text-[13px] text-red-400">{error}</p>
        )}

        {/* Switch link */}
        <div className="mt-10">
          <a href="/" className="text-[12px] text-zinc-700 transition hover:text-zinc-400">
            Switch to a different repository
          </a>
        </div>
      </div>
    </div>
  );
}
