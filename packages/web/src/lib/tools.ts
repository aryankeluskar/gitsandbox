import { Type, type Static } from "@sinclair/typebox";
import type { AgentTool, AgentToolResult } from "@mariozechner/pi-agent-core";
import { execInRepo, type RepoRuntime } from "./repoRuntime";

const MAX_OUTPUT_BYTES = 64 * 1024;
const MAX_READ_LINES = 2000;

function truncateTail(text: string, limit = MAX_OUTPUT_BYTES): {
  text: string;
  truncated: boolean;
} {
  if (text.length <= limit) return { text, truncated: false };
  return { text: `...[truncated]...\n${text.slice(-limit)}`, truncated: true };
}

function truncateHead(text: string, limit = MAX_OUTPUT_BYTES): {
  text: string;
  truncated: boolean;
} {
  if (text.length <= limit) return { text, truncated: false };
  return { text: `${text.slice(0, limit)}\n...[truncated]...`, truncated: true };
}

function stripQuoted(cmd: string): string {
  let quote: string | null = null;
  let out = "";
  for (let i = 0; i < cmd.length; i += 1) {
    const ch = cmd[i];
    if (quote) {
      if (ch === quote) quote = null;
      out += " ";
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") {
      quote = ch;
      out += " ";
      continue;
    }
    out += ch;
  }
  return out;
}

function isSafeRedirect(target: string): boolean {
  return (
    target === "/dev/null" ||
    target === "/dev/stdout" ||
    target === "/dev/stderr" ||
    target === "-" ||
    /^&\d+$/.test(target) ||
    target === "&-"
  );
}

function hasWriteRedirect(cmd: string): boolean {
  const stripped = stripQuoted(cmd);
  const redirects = stripped.matchAll(/(?:\d+)?(>>?)\s*([^\s;|&()]+)/g);
  for (const m of redirects) {
    const target = m[2];
    if (target && !isSafeRedirect(target)) return true;
  }
  return false;
}

const BANNED_COMMANDS = [
  "npm",
  "pnpm",
  "yarn",
  "bun",
  "node",
  "python",
  "python3",
  "pip",
  "pip3",
  "git",
  "curl",
  "wget",
  "sqlite3",
  "ssh",
  "scp",
  "sudo",
  "apt",
  "apt-get",
  "brew",
];

function hasBannedCommand(cmd: string): string | null {
  const stripped = stripQuoted(cmd);
  const tokens = stripped.split(/[\s|;&()<>]+/).filter(Boolean);
  for (const t of tokens) {
    if (BANNED_COMMANDS.includes(t)) return t;
  }
  return null;
}

const bashSchema = Type.Object({
  command: Type.String({
    description:
      "Shell command. Read-only virtual shell over the GitHub repo snapshot. " +
      "Use builtins and text tools (cat, grep, sed, awk, find, head, tail, ls, wc, sort, uniq, jq). " +
      "No network, git, npm, node, python, sqlite, writes, or installs.",
  }),
});

export function createBashTool(
  runtime: RepoRuntime
): AgentTool<typeof bashSchema, { command: string; cwd: string; exitCode: number }> {
  return {
    name: "bash",
    label: "Bash",
    description:
      "Run a command in the repo's read-only virtual shell. " +
      "Banned: writes, network, git, node/npm/python/sqlite/curl. OK: pipes + grep/sed/awk/cat/head/tail/ls/find/wc/jq.",
    parameters: bashSchema,
    async execute(
      _toolCallId,
      params: Static<typeof bashSchema>,
      signal
    ): Promise<
      AgentToolResult<{ command: string; cwd: string; exitCode: number }>
    > {
      if (signal?.aborted) throw new Error("Aborted");

      if (hasWriteRedirect(params.command)) {
        throw new Error(
          "Read-only filesystem: redirects that write to the filesystem are not allowed."
        );
      }
      const banned = hasBannedCommand(params.command);
      if (banned) {
        throw new Error(
          `Command '${banned}' is not available. This is a read-only virtual shell.`
        );
      }

      const result = await execInRepo(runtime, params.command, signal);
      const combined = [result.stdout, result.stderr].filter(Boolean).join("\n");
      const { text, truncated } = truncateTail(combined || "(no output)");
      let output = text;
      if (truncated) output += "\n\n[Output truncated to tail.]";
      if (result.exitCode !== 0) {
        output += `\n\nExit code ${result.exitCode}`;
      }

      return {
        content: [{ type: "text", text: output }],
        details: {
          command: params.command,
          cwd: result.cwd,
          exitCode: result.exitCode,
        },
      };
    },
  };
}

const readSchema = Type.Object({
  path: Type.String({
    description: "Absolute path (leading /) of the file to read.",
  }),
  offset: Type.Optional(
    Type.Number({
      description: "1-indexed line number to start from.",
      minimum: 1,
    })
  ),
  limit: Type.Optional(
    Type.Number({ description: "Maximum number of lines to read.", minimum: 1 })
  ),
});

export function createReadTool(
  runtime: RepoRuntime
): AgentTool<typeof readSchema, { path: string; lines: number }> {
  return {
    name: "read",
    label: "Read",
    description:
      "Read a text file from the active repository snapshot. Binary files are rejected; use bash with `file` or `wc -c` for metadata.",
    parameters: readSchema,
    async execute(
      _toolCallId,
      params: Static<typeof readSchema>,
      signal
    ): Promise<AgentToolResult<{ path: string; lines: number }>> {
      if (signal?.aborted) throw new Error("Aborted");

      const abs = params.path.startsWith("/")
        ? params.path
        : runtime.fs.resolvePath(runtime.getCwd(), params.path);

      const content = await runtime.fs.readFile(abs);
      if (content.includes("\u0000")) {
        throw new Error("Binary file. Use bash for metadata inspection.");
      }

      const lines = content.split("\n");
      const start = params.offset ? Math.max(0, params.offset - 1) : 0;
      if (start >= lines.length && lines.length > 0) {
        throw new Error(
          `Offset ${params.offset} is past end of file (${lines.length} lines).`
        );
      }
      const limit = Math.min(params.limit ?? MAX_READ_LINES, MAX_READ_LINES);
      const selected = lines.slice(start, start + limit).join("\n");
      const { text, truncated } = truncateHead(selected);
      let output = text;
      if (truncated) output += `\n\n[File truncated to ${MAX_OUTPUT_BYTES} bytes.]`;
      else if (start + limit < lines.length) {
        output += `\n\n[More lines remain. Use offset=${start + limit + 1} to continue.]`;
      }
      return {
        content: [{ type: "text", text: output }],
        details: { path: abs, lines: Math.min(limit, lines.length - start) },
      };
    },
  };
}

export function createRepoTools(runtime: RepoRuntime) {
  return [createReadTool(runtime), createBashTool(runtime)];
}
