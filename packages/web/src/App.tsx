import { useState, useCallback, useEffect, useRef } from "react";
import { RepoInput } from "./components/RepoInput";
import { TerminalView } from "./components/TerminalView";
import { SessionSidebar } from "./components/SessionSidebar";
import { SettingsPanel } from "./components/SettingsPanel";
import { UsageBadge } from "./components/UsageBadge";
import { useSandbox } from "./hooks/useSandbox";
import { useSettings } from "./hooks/useSettings";
import { getAllCredentials } from "./db/credentials";
import { createSession, touchSession } from "./db/sessions";
import { extractRepoFromPath, buildGitHubUrl } from "./lib/urlRepo";
import type { AgentChoice } from "./hooks/useSettings";

const SUGGESTED_REPOS = [
  { owner: "expressjs", repo: "express", label: "expressjs/express" },
  { owner: "denoland", repo: "deno", label: "denoland/deno" },
  { owner: "vercel", repo: "next.js", label: "vercel/next.js" },
  { owner: "anthropics", repo: "claude-code", label: "anthropics/claude-code" },
];

export default function App() {
  const sandbox = useSandbox();
  const settings = useSettings();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<number | undefined>();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const autoStarted = useRef(false);

  const handleStart = useCallback(
    async (repoUrl: string, branch: string) => {
      const creds = await getAllCredentials();
      const agent = (settings.get("agent") as AgentChoice) || "opencode";

      try {
        const meta = await sandbox.create({
          repoUrl,
          branch,
          agent,
          env: creds,
        });

        const session = await createSession({
          repoUrl: meta.repoUrl,
          agent: meta.agent,
          sandboxId: meta.sandboxId,
        });
        setActiveSessionId(session.id);
      } catch {
        // error is already in sandbox.error
      }
    },
    [sandbox, settings]
  );

  useEffect(() => {
    if (autoStarted.current || !settings.ready) return;
    const info = extractRepoFromPath(window.location.pathname);
    if (!info) return;

    autoStarted.current = true;
    const repoUrl = buildGitHubUrl(info.owner, info.repo);
    handleStart(repoUrl, info.branch);
  }, [settings.ready, handleStart]);

  const handleSessionSelect = useCallback(
    (_sessionId: number, _sandboxId: string) => {
      setActiveSessionId(_sessionId);
      touchSession(_sessionId);
    },
    []
  );

  function handleNewSession() {
    window.history.pushState({}, "", "/");
    window.location.reload();
  }

  const urlRepo = extractRepoFromPath(window.location.pathname);
  const isTerminalVisible = sandbox.status === "active" && sandbox.meta;

  return (
    <div className="flex h-screen bg-black text-zinc-100">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-[220px] border-r border-zinc-800/60 bg-black transition-transform md:static md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Sidebar brand */}
        <div className="flex h-12 items-center px-4">
          <a href="/" className="flex items-center gap-1.5 text-[14px] font-semibold tracking-tight text-zinc-200">
            <span className="text-emerald-400">git</span>sandbox
          </a>
        </div>

        <SessionSidebar
          activeSessionId={activeSessionId}
          onSelect={handleSessionSelect}
          onNewSession={handleNewSession}
        />
      </aside>

      {/* Main */}
      <main className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-12 shrink-0 items-center justify-between border-b border-zinc-800/40 px-4">
          <div className="flex items-center gap-3">
            {/* Mobile hamburger */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="rounded-md p-1 text-zinc-500 transition hover:text-zinc-300 md:hidden"
            >
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
                <path d="M2 4h12M2 8h12M2 12h12" />
              </svg>
            </button>

            {/* Breadcrumb when repo is active */}
            {sandbox.meta && (
              <div className="hidden items-center gap-1.5 text-[13px] md:flex">
                <span className="text-zinc-600">/</span>
                <a
                  href={sandbox.meta.repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-zinc-400 transition hover:text-zinc-200"
                >
                  {(() => {
                    try {
                      return new URL(sandbox.meta.repoUrl).pathname.slice(1);
                    } catch {
                      return sandbox.meta.repoUrl;
                    }
                  })()}
                </a>
                <span className="rounded bg-zinc-800/80 px-1.5 py-0.5 font-mono text-[10px] uppercase text-zinc-500">
                  {sandbox.meta.agent}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <UsageBadge sessionId={activeSessionId} />

            {sandbox.status === "active" && (
              <button
                onClick={sandbox.destroy}
                className="rounded-lg px-3 py-1.5 text-[12px] font-medium text-red-400 transition hover:bg-red-950/40"
              >
                Stop
              </button>
            )}

            <button
              onClick={() => setSettingsOpen(true)}
              className="rounded-lg p-2 text-zinc-600 transition hover:bg-zinc-900 hover:text-zinc-400"
              title="Settings"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M6.5 1.5h3l.5 2 1.5.8 2-.7 2.1 2.1-.7 2 .8 1.5 2 .5v3l-2 .5-1 1.5.7 2-2.1 2.1-2-.7-1.5.8-.5 2h-3l-.5-2-1.5-.8-2 .7L.4 13.6l.7-2-.8-1.5-2-.5v-3l2-.5.8-1.5-.7-2L2.5 .4l2 .7L6 .3l.5-2z"
                  stroke="currentColor"
                  strokeWidth="1.1"
                />
                <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.1" />
              </svg>
            </button>
          </div>
        </header>

        {/* Content */}
        {isTerminalVisible ? (
          <div className="flex-1">
            <TerminalView sandboxId={sandbox.meta!.sandboxId} />
          </div>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center px-6">
            <div className="animate-fade-in w-full max-w-xl">
              {/* Hero */}
              <div className="mb-10 text-center">
                <h2 className="mb-3 text-2xl font-semibold tracking-tight text-zinc-100">
                  Let's build
                </h2>
                <p className="mx-auto max-w-sm text-[14px] leading-relaxed text-zinc-500">
                  Replace{" "}
                  <code className="rounded bg-zinc-900 px-1.5 py-0.5 text-[13px] text-zinc-400">
                    github.com
                  </code>{" "}
                  with{" "}
                  <code className="rounded bg-zinc-900 px-1.5 py-0.5 text-[13px] text-emerald-400">
                    github.soy.run
                  </code>{" "}
                  in any GitHub URL
                </p>
              </div>

              {/* Input */}
              <RepoInput
                onSubmit={handleStart}
                disabled={sandbox.status === "creating"}
                initialValue={
                  urlRepo
                    ? `https://github.com/${urlRepo.owner}/${urlRepo.repo}`
                    : undefined
                }
              />

              {/* Loading state */}
              {sandbox.status === "creating" && (
                <div className="mt-6 flex items-center justify-center gap-2 text-[13px] text-zinc-500">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-20" />
                    <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                  Cloning repo and starting agent...
                </div>
              )}

              {/* Error */}
              {sandbox.error && (
                <p className="mt-4 text-center text-[13px] text-red-400">
                  {sandbox.error}
                </p>
              )}

              {/* Suggested repos */}
              {!urlRepo && (
                <div className="mt-10">
                  <p className="mb-3 text-center text-[12px] font-medium uppercase tracking-widest text-zinc-700">
                    Try a repo
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {SUGGESTED_REPOS.map((r) => (
                      <a
                        key={r.label}
                        href={`/${r.owner}/${r.repo}`}
                        className="rounded-lg border border-zinc-800/60 px-3 py-1.5 text-[13px] text-zinc-500 transition hover:border-zinc-700 hover:bg-zinc-900/50 hover:text-zinc-300"
                      >
                        {r.label}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Privacy note */}
              <p className="mt-12 text-center text-[11px] leading-relaxed text-zinc-700">
                API keys stored only in this browser. Nothing leaves your machine until you start a session.
              </p>
            </div>
          </div>
        )}
      </main>

      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
