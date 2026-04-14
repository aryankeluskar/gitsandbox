import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import type { Env, CreateSandboxBody, DestroySandboxBody } from "./types";
import { createSandbox, destroySandbox, getTerminalResponse } from "./sandbox";
import { InvalidRepoUrlError } from "./repo";

export { Sandbox } from "@cloudflare/sandbox";

const app = new Hono<{ Bindings: Env }>();

app.use(
  "*",
  cors({
    origin: [
      "https://github.soy.run",
      "https://gitsandbox-web.pages.dev",
      "http://localhost:3000",
    ],
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type"],
  })
);
app.use("*", logger());

app.get("/health", (c) => c.json({ ok: true, ts: Date.now() }));

app.post("/sandbox/create", async (c) => {
  const body = await c.req.json<CreateSandboxBody>();

  if (!body.repoUrl) {
    return c.json({ error: "repoUrl is required" }, 400);
  }
  if (!body.agent || !["opencode", "pi"].includes(body.agent)) {
    return c.json({ error: "agent must be 'opencode' or 'pi'" }, 400);
  }

  const envVars = body.env ?? {};
  const hasApiKey = Object.keys(envVars).some(
    (k) =>
      k.includes("API_KEY") ||
      k.includes("ANTHROPIC") ||
      k.includes("OPENAI") ||
      k.includes("GOOGLE")
  );
  if (!hasApiKey) {
    return c.json(
      { error: "At least one LLM provider API key is required in env" },
      400
    );
  }

  try {
    const meta = await createSandbox(
      c.env,
      body.repoUrl,
      body.branch,
      body.agent,
      envVars
    );
    return c.json(meta, 200);
  } catch (err) {
    if (err instanceof InvalidRepoUrlError) {
      return c.json({ error: err.message }, 400);
    }
    console.error("sandbox/create error:", err);
    return c.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      500
    );
  }
});

app.post("/sandbox/destroy", async (c) => {
  const body = await c.req.json<DestroySandboxBody>();

  if (!body.sandboxId) {
    return c.json({ error: "sandboxId is required" }, 400);
  }

  try {
    await destroySandbox(c.env, body.sandboxId);
    return c.json({ ok: true });
  } catch (err) {
    console.error("sandbox/destroy error:", err);
    return c.json({ error: "Sandbox not found or already destroyed" }, 404);
  }
});

app.get("/ws/terminal", async (c) => {
  const sandboxId = c.req.query("id");
  if (!sandboxId) {
    return c.json({ error: "id query parameter is required" }, 400);
  }

  if (c.req.header("Upgrade")?.toLowerCase() !== "websocket") {
    return c.json({ error: "WebSocket upgrade required" }, 426);
  }

  try {
    return await getTerminalResponse(c.env, sandboxId, c.req.raw);
  } catch (err) {
    console.error("ws/terminal error:", err);
    return c.json({ error: "Sandbox not found" }, 404);
  }
});

export default app;
