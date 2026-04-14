import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import type { Env, CreateSandboxBody, DestroySandboxBody } from "./types";
import { createSandbox, destroySandbox, proxyToOpenCode } from "./sandbox";
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
    allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Accept", "Cache-Control", "Last-Event-ID"],
    exposeHeaders: ["Content-Type"],
  })
);
app.use("*", logger());

app.get("/health", (c) => c.json({ ok: true, ts: Date.now() }));

app.post("/sandbox/create", async (c) => {
  const body = await c.req.json<CreateSandboxBody>();

  if (!body.repoUrl) {
    return c.json({ error: "repoUrl is required" }, 400);
  }

  try {
    const meta = await createSandbox(
      c.env,
      body.repoUrl,
      body.branch,
      body.env ?? {}
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

app.all("/oc/:sandboxId/*", async (c) => {
  const sandboxId = c.req.param("sandboxId");
  const fullPath = c.req.path;
  const prefix = `/oc/${sandboxId}`;
  const ocPath = fullPath.slice(prefix.length) || "/";

  const search = new URL(c.req.url).search;
  const pathWithQuery = ocPath + search;

  try {
    return await proxyToOpenCode(c.env, sandboxId, pathWithQuery, c.req.raw);
  } catch (err) {
    console.error("oc proxy error:", err);
    return c.json(
      { error: err instanceof Error ? err.message : "Proxy error" },
      502
    );
  }
});

export default app;
