import { useState, useCallback } from "react";
import { RepoInput } from "./components/RepoInput";
import { TerminalView } from "./components/TerminalView";
import { SessionSidebar } from "./components/SessionSidebar";
import { SettingsPanel } from "./components/SettingsPanel";
import { UsageBadge } from "./components/UsageBadge";
import { useSandbox } from "./hooks/useSandbox";
import { useSettings } from "./hooks/useSettings";
import { getAllCredentials } from "./db/credentials";
import { createSession, touchSession } from "./db/sessions";
import type { AgentChoice } from "./hooks/useSettings";

export default function App() {
  const sandbox = useSandbox();
  const settings = useSettings();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<number | undefined>();

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

  const handleSessionSelect = useCallback(
    (_sessionId: number, sandboxId: string) => {
      setActiveSessionId(_sessionId);
      touchSession(_sessionId);
    },
    []
  );

  const isTerminalVisible = sandbox.status === "active" && sandbox.meta;

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100">
      {/* Sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-zinc-800 bg-zinc-950 md:block">
        <div className="flex h-14 items-center border-b border-zinc-800 px-4">
          <h1 className="text-sm font-bold tracking-tight">
            <span className="text-blue-400">Git</span>Sandbox
          </h1>
        </div>
        <SessionSidebar
          activeSessionId={activeSessionId}
          onSelect={handleSessionSelect}
        />
      </aside>

      {/* Main */}
      <main className="flex flex-1 flex-col">
        {/* Header */}
        <header className="flex h-14 items-center justify-between border-b border-zinc-800 px-4">
          <div className="flex items-center gap-3">
            <h1 className="text-sm font-bold tracking-tight md:hidden">
              <span className="text-blue-400">Git</span>Sandbox
            </h1>
            {sandbox.meta && (
              <span className="hidden text-sm text-zinc-400 md:inline">
                {sandbox.meta.repoUrl}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <UsageBadge sessionId={activeSessionId} />
            {sandbox.status === "active" && (
              <button
                onClick={sandbox.destroy}
                className="rounded-md bg-red-900/30 px-3 py-1.5 text-xs text-red-400 transition hover:bg-red-900/50"
              >
                Stop
              </button>
            )}
            <button
              onClick={() => setSettingsOpen(true)}
              className="rounded-md bg-zinc-800 p-2 text-zinc-400 transition hover:bg-zinc-700 hover:text-zinc-200"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M6.5 1.5h3l.5 2 1.5.8 2-.7 2.1 2.1-.7 2 .8 1.5 2 .5v3l-2 .5-1 1.5.7 2-2.1 2.1-2-.7-1.5.8-.5 2h-3l-.5-2-1.5-.8-2 .7L.4 13.6l.7-2-.8-1.5-2-.5v-3l2-.5.8-1.5-.7-2L2.5 .4l2 .7L6 .3l.5-2z"
                  stroke="currentColor"
                  strokeWidth="1.2"
                />
                <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.2" />
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
          <div className="flex flex-1 flex-col items-center justify-center gap-8 p-8">
            <div className="text-center">
              <h2 className="mb-2 text-3xl font-bold tracking-tight">
                Ask Any GitHub Repo
              </h2>
              <p className="text-zinc-400">
                Enter a repository URL to start an AI-powered coding session
              </p>
            </div>
            <RepoInput
              onSubmit={handleStart}
              disabled={sandbox.status === "creating"}
            />
            {sandbox.status === "creating" && (
              <div className="flex items-center gap-2 text-sm text-zinc-400">
                <svg
                  className="h-4 w-4 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="3"
                    className="opacity-25"
                  />
                  <path
                    d="M4 12a8 8 0 018-8"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </svg>
                Cloning repo and starting agent...
              </div>
            )}
            {sandbox.error && (
              <p className="text-sm text-red-400">{sandbox.error}</p>
            )}
          </div>
        )}
      </main>

      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
