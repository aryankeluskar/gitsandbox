import { useState, useCallback } from "react";
import { RepoInput } from "./components/RepoInput";
import { RepoLanding } from "./components/RepoLanding";
import { TerminalView } from "./components/TerminalView";
import { SessionSidebar } from "./components/SessionSidebar";
import { SettingsPanel } from "./components/SettingsPanel";
import { UsageBadge } from "./components/UsageBadge";
import { useSandbox } from "./hooks/useSandbox";
import { useSettings } from "./hooks/useSettings";
import { useCredentialStatus } from "./hooks/useCredentialStatus";
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
  const credentialStatus = useCredentialStatus();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<number | undefined>();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleStart = useCallback(
    async (repoUrl: string, branch: string) => {
      const creds = await getAllCredentials();
      const agent = (settings.get("agent") as AgentChoice) || "opencode";

      try {
        const meta = await sandbox.create({ repoUrl, branch, agent, env: creds });
        const session = await createSession({
          repoUrl: meta.repoUrl,
          agent: meta.agent,
          sandboxId: meta.sandboxId,
        });
        setActiveSessionId(session.id);
      } catch {
        // error surfaced via sandbox.error
      }
    },
    [sandbox, settings]
  );

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
    <div className="flex h-screen flex-col bg-black text-zinc-100">
      {/* Sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/60" onClick={() => setSidebarOpen(false)} />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-[260px] border-r border-zinc-800/60 bg-black transition-transform ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-12 items-center justify-between px-4">
          <a href="/" className="text-[14px] font-semibold tracking-tight text-zinc-200">
            <span className="text-emerald-400">git</span>sandbox
          </a>
          <button onClick={() => setSidebarOpen(false)} className="rounded-md p-1 text-zinc-600 hover:text-zinc-300">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M15 5L5 15M5 5l10 10" />
            </svg>
          </button>
        </div>
        <SessionSidebar
          activeSessionId={activeSessionId}
          onSelect={(id, sid) => { handleSessionSelect(id, sid); setSidebarOpen(false); }}
          onNewSession={handleNewSession}
        />
      </aside>

      {/* Header */}
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-zinc-800/40 px-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-md p-1.5 text-zinc-600 transition hover:bg-zinc-900 hover:text-zinc-300"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
              <path d="M2 4h12M2 8h12M2 12h12" />
            </svg>
          </button>

          {/* Repo breadcrumb */}
          {(urlRepo || sandbox.meta) && (
            <RepoBreadcrumb
              owner={urlRepo?.owner ?? ""}
              repo={urlRepo?.repo ?? ""}
              branch={urlRepo?.branch ?? "main"}
              meta={sandbox.meta}
            />
          )}

          {!urlRepo && !sandbox.meta && (
            <a href="/" className="text-[14px] font-semibold tracking-tight text-zinc-300">
              <span className="text-emerald-400">git</span>sandbox
            </a>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <UsageBadge sessionId={activeSessionId} />

          {sandbox.status === "active" && (
            <button
              onClick={sandbox.destroy}
              className="rounded-lg px-3 py-1.5 text-[12px] font-medium text-red-400 transition hover:bg-red-950/40"
            >
              Stop
            </button>
          )}

          <a
            href="https://github.com/aryankeluskar/gitsandbox"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg p-2 text-zinc-600 transition hover:bg-zinc-900 hover:text-zinc-400"
            title="GitHub"
          >
            <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
            </svg>
          </a>

          <button
            onClick={() => setSettingsOpen(true)}
            className="rounded-lg p-2 text-zinc-600 transition hover:bg-zinc-900 hover:text-zinc-400"
            title="Settings"
          >
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
              <path d="M6.5 1.5h3l.5 2 1.5.8 2-.7 2.1 2.1-.7 2 .8 1.5 2 .5v3l-2 .5-1 1.5.7 2-2.1 2.1-2-.7-1.5.8-.5 2h-3l-.5-2-1.5-.8-2 .7L.4 13.6l.7-2-.8-1.5-2-.5v-3l2-.5.8-1.5-.7-2L2.5 .4l2 .7L6 .3l.5-2z" stroke="currentColor" strokeWidth="1.1" />
              <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.1" />
            </svg>
          </button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {isTerminalVisible ? (
          <div className="flex-1">
            <TerminalView sandboxId={sandbox.meta!.sandboxId} />
          </div>
        ) : urlRepo ? (
          <RepoLanding
            owner={urlRepo.owner}
            repo={urlRepo.repo}
            branch={urlRepo.branch}
            agent={(settings.get("agent") as AgentChoice) || "opencode"}
            onAgentChange={(a) => settings.set("agent", a)}
            credentialStatus={credentialStatus}
            onOpenSettings={() => setSettingsOpen(true)}
            onStart={() => handleStart(buildGitHubUrl(urlRepo.owner, urlRepo.repo), urlRepo.branch)}
            loading={sandbox.status === "creating"}
            error={sandbox.error}
          />
        ) : (
          <HomePage />
        )}
      </div>

      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}

function RepoBreadcrumb({
  owner,
  repo,
  branch,
  meta,
}: {
  owner: string;
  repo: string;
  branch: string;
  meta: { repoUrl: string; agent: string } | null;
}) {
  const displayOwner = meta ? (() => { try { return new URL(meta.repoUrl).pathname.split("/").filter(Boolean)[0]; } catch { return owner; } })() : owner;
  const displayRepo = meta ? (() => { try { return new URL(meta.repoUrl).pathname.split("/").filter(Boolean)[1]; } catch { return repo; } })() : repo;
  const githubUrl = meta?.repoUrl ?? `https://github.com/${owner}/${repo}`;

  return (
    <div className="flex items-center gap-2">
      <img
        src={`https://github.com/${displayOwner}.png?size=32`}
        alt=""
        className="h-5 w-5 rounded bg-zinc-800"
      />
      <a
        href={githubUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1 text-[13px] text-zinc-300 transition hover:text-zinc-100"
      >
        <span className="text-zinc-500">{displayOwner}</span>
        <span className="text-zinc-600">/</span>
        <span className="font-medium">{displayRepo}</span>
      </a>
      <span className="rounded bg-zinc-800/80 px-1.5 py-0.5 font-mono text-[10px] text-zinc-500">
        {meta?.agent ?? branch}
      </span>
    </div>
  );
}

function HomePage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6">
      <div className="animate-fade-in w-full max-w-xl">
        <div className="mb-10 text-center">
          <h2 className="mb-3 text-2xl font-semibold tracking-tight">
            Let's build
          </h2>
          <p className="mx-auto max-w-sm text-[14px] leading-relaxed text-zinc-500">
            Replace{" "}
            <code className="rounded bg-zinc-900 px-1.5 py-0.5 text-[13px] text-zinc-400">github.com</code>{" "}
            with{" "}
            <code className="rounded bg-zinc-900 px-1.5 py-0.5 text-[13px] text-emerald-400">github.soy.run</code>{" "}
            in any GitHub URL
          </p>
        </div>

        <RepoInput
          onSubmit={(_repoUrl) => {
            try {
              const url = new URL(_repoUrl);
              const parts = url.pathname.split("/").filter(Boolean);
              if (parts.length >= 2) { window.location.href = `/${parts[0]}/${parts[1]}`; return; }
            } catch { /* try as owner/repo */ }
            const segments = _repoUrl.split("/").filter(Boolean);
            if (segments.length >= 2) { window.location.href = `/${segments[0]}/${segments[1]}`; }
          }}
          disabled={false}
        />

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

        <p className="mt-12 text-center text-[11px] leading-relaxed text-zinc-700">
          API keys stored only in this browser. Nothing leaves your machine until you start a session.
        </p>
      </div>
    </div>
  );
}
