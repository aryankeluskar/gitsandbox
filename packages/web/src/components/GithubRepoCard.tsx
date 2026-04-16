import { useEffect, useState } from "react";

interface GithubRepoCardProps {
  owner: string;
  repo?: string;
  href: string;
  /** Optional branch badge shown next to the repo name. */
  branch?: string;
}

interface RepoMeta {
  language: string | null;
  stars: number;
}

interface AccountMeta {
  publicRepos: number;
  followers: number;
  kind: "user" | "organization";
}

type MetaState<T> =
  | { status: "loading" }
  | { status: "ok"; data: T }
  | { status: "error" };

const LANGUAGE_DOT: Record<string, string> = {
  TypeScript: "#3178c6",
  JavaScript: "#f1e05a",
  Rust: "#dea584",
  Go: "#00add8",
  Python: "#3572a5",
  Java: "#b07219",
  "C++": "#f34b7d",
  "C#": "#178600",
  C: "#555555",
  Ruby: "#701516",
  Swift: "#f05138",
  Kotlin: "#a97bff",
  HTML: "#e34c26",
  CSS: "#563d7c",
  Shell: "#89e051",
  Vue: "#41b883",
  Astro: "#ff5a03",
  Svelte: "#ff3e00",
  PHP: "#4f5d95",
  Zig: "#ec915c",
  Lua: "#000080",
  Elixir: "#6e4a7e",
};

function formatCount(n: number): string {
  if (n >= 1_000_000) {
    const v = n / 1_000_000;
    return `${v >= 10 ? v.toFixed(0) : v.toFixed(1).replace(/\.0$/, "")}M`;
  }
  if (n >= 1_000) {
    const v = n / 1_000;
    return `${v >= 10 ? v.toFixed(0) : v.toFixed(1).replace(/\.0$/, "")}k`;
  }
  return String(n);
}

/** Shared in-memory cache to avoid refetches when re-mounting. */
const REPO_CACHE = new Map<string, RepoMeta>();
const ACCOUNT_CACHE = new Map<string, AccountMeta>();

function useRepoMeta(owner: string, repo: string): MetaState<RepoMeta> {
  const key = `${owner}/${repo}`;
  const [state, setState] = useState<MetaState<RepoMeta>>(() => {
    const cached = REPO_CACHE.get(key);
    return cached ? { status: "ok", data: cached } : { status: "loading" };
  });

  useEffect(() => {
    const cached = REPO_CACHE.get(key);
    if (cached) {
      setState({ status: "ok", data: cached });
      return;
    }
    const ac = new AbortController();
    setState({ status: "loading" });
    (async () => {
      try {
        const res = await fetch(
          `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`,
          { signal: ac.signal }
        );
        if (!res.ok) {
          setState({ status: "error" });
          return;
        }
        const data = (await res.json()) as {
          language: string | null;
          stargazers_count: number;
        };
        const meta: RepoMeta = {
          language: data.language,
          stars: data.stargazers_count,
        };
        REPO_CACHE.set(key, meta);
        setState({ status: "ok", data: meta });
      } catch {
        if (!ac.signal.aborted) setState({ status: "error" });
      }
    })();
    return () => ac.abort();
  }, [key, owner, repo]);

  return state;
}

function useAccountMeta(owner: string): MetaState<AccountMeta> {
  const [state, setState] = useState<MetaState<AccountMeta>>(() => {
    const cached = ACCOUNT_CACHE.get(owner);
    return cached ? { status: "ok", data: cached } : { status: "loading" };
  });

  useEffect(() => {
    const cached = ACCOUNT_CACHE.get(owner);
    if (cached) {
      setState({ status: "ok", data: cached });
      return;
    }
    const ac = new AbortController();
    setState({ status: "loading" });
    (async () => {
      try {
        const res = await fetch(
          `https://api.github.com/users/${encodeURIComponent(owner)}`,
          { signal: ac.signal }
        );
        if (!res.ok) {
          setState({ status: "error" });
          return;
        }
        const data = (await res.json()) as {
          public_repos: number;
          followers: number;
          type: string;
        };
        const meta: AccountMeta = {
          publicRepos: data.public_repos,
          followers: data.followers,
          kind: data.type === "Organization" ? "organization" : "user",
        };
        ACCOUNT_CACHE.set(owner, meta);
        setState({ status: "ok", data: meta });
      } catch {
        if (!ac.signal.aborted) setState({ status: "error" });
      }
    })();
    return () => ac.abort();
  }, [owner]);

  return state;
}

export function GithubRepoCard({ owner, repo, href, branch }: GithubRepoCardProps) {
  const isRepo = Boolean(repo);
  const [avatarFailed, setAvatarFailed] = useState(false);

  return (
    <a
      href={href}
      className="press focus-ring group relative flex items-center gap-3 rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-2.5 pr-3 text-left shadow-inset-hair transition-[border-color,background-color,box-shadow,transform] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-px hover:border-emerald-700/50 hover:bg-zinc-900/80 hover:shadow-raise"
    >
      {/* Avatar */}
      <div
        className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-zinc-800 ring-1 ring-zinc-800 transition-[ring-color] group-hover:ring-zinc-700"
        aria-hidden
      >
        {avatarFailed ? (
          <div className="flex h-full w-full items-center justify-center text-zinc-500">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
            </svg>
          </div>
        ) : (
          <img
            src={`https://github.com/${owner}.png?size=72`}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
            decoding="async"
            onError={() => setAvatarFailed(true)}
            data-no-outline="true"
          />
        )}
      </div>

      {/* Name */}
      <div className="min-w-0 flex-1">
        <div className="truncate font-display text-[13.5px] leading-tight">
          <span className="text-zinc-500">{owner}</span>
          {isRepo ? (
            <>
              <span className="text-zinc-700">/</span>
              <span className="font-semibold text-zinc-100">{repo}</span>
            </>
          ) : null}
          {branch ? (
            <span className="ml-1.5 text-[11.5px] font-normal text-zinc-500">
              [{branch}]
            </span>
          ) : null}
        </div>
        <div className="mt-0.5 text-[11px] text-zinc-600">
          {isRepo ? <RepoMetaLine owner={owner} repo={repo!} /> : <AccountMetaLine owner={owner} />}
        </div>
      </div>

      {/* Arrow */}
      <svg
        width="14"
        height="14"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="shrink-0 text-zinc-600 transition-[color,transform] duration-200 group-hover:translate-x-0.5 group-hover:text-emerald-400"
      >
        <path d="M5 3l5 5-5 5" />
      </svg>
    </a>
  );
}

function RepoMetaLine({ owner, repo }: { owner: string; repo: string }) {
  const state = useRepoMeta(owner, repo);
  if (state.status === "loading") {
    return (
      <span className="inline-flex items-center gap-2">
        <span className="inline-block h-2 w-10 animate-pulse rounded bg-zinc-800" />
        <span className="inline-block h-2 w-6 animate-pulse rounded bg-zinc-800" />
      </span>
    );
  }
  if (state.status === "error") {
    return <span className="text-zinc-700">repository</span>;
  }
  const { language, stars } = state.data;
  const langColor = language ? LANGUAGE_DOT[language] : undefined;
  return (
    <span className="inline-flex items-center gap-2.5 tabular-nums">
      {language ? (
        <span className="inline-flex items-center gap-1">
          <span
            className="inline-block h-2 w-2 rounded-full ring-1 ring-black/30"
            style={{ backgroundColor: langColor ?? "#a1a1aa" }}
          />
          <span className="text-zinc-500">{language}</span>
        </span>
      ) : null}
      <span className="inline-flex items-center gap-1 text-zinc-500">
        <span className="relative inline-block h-3 w-3">
          <svg
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinejoin="round"
            className="absolute inset-0 h-3 w-3 text-zinc-500 transition-opacity duration-200 group-hover:opacity-0"
          >
            <path d="M8 1.5l1.8 4 4.4.5-3.3 3 .9 4.4L8 11.3l-3.8 2.1.9-4.4-3.3-3 4.4-.5L8 1.5z" />
          </svg>
          <svg
            viewBox="0 0 16 16"
            fill="currentColor"
            className="absolute inset-0 h-3 w-3 text-amber-400 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
          >
            <path d="M8 1.5l1.8 4 4.4.5-3.3 3 .9 4.4L8 11.3l-3.8 2.1.9-4.4-3.3-3 4.4-.5L8 1.5z" />
          </svg>
        </span>
        {formatCount(stars)}
      </span>
    </span>
  );
}

function AccountMetaLine({ owner }: { owner: string }) {
  const state = useAccountMeta(owner);
  if (state.status === "loading") {
    return (
      <span className="inline-flex items-center gap-2">
        <span className="inline-block h-2 w-14 animate-pulse rounded bg-zinc-800" />
      </span>
    );
  }
  if (state.status === "error") {
    return <span className="text-zinc-700">account</span>;
  }
  const { publicRepos, followers, kind } = state.data;
  return (
    <span className="inline-flex items-center gap-2.5 tabular-nums">
      <span className="rounded border border-zinc-800 bg-zinc-900/60 px-1.5 py-px text-[9.5px] font-medium uppercase tracking-wider text-zinc-500">
        {kind === "organization" ? "org" : "user"}
      </span>
      <span className="text-zinc-500">
        {formatCount(publicRepos)} <span className="text-zinc-600">repos</span>
      </span>
      <span className="text-zinc-500">
        {formatCount(followers)} <span className="text-zinc-600">followers</span>
      </span>
    </span>
  );
}
