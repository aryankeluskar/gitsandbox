import { useCallback, useRef, useState } from "react";
import {
  apiCreateSandbox,
  apiDestroySandbox,
  type CreateSandboxParams,
  type SandboxMeta,
} from "../lib/api";

type Status = "idle" | "creating" | "active" | "destroying" | "error";

export function useSandbox() {
  const [status, setStatus] = useState<Status>("idle");
  const [meta, setMeta] = useState<SandboxMeta | null>(null);
  const [error, setError] = useState<string | null>(null);
  const metaRef = useRef<SandboxMeta | null>(null);

  const create = useCallback(async (params: CreateSandboxParams) => {
    setStatus("creating");
    setError(null);
    try {
      const result = await apiCreateSandbox(params);
      metaRef.current = result;
      setMeta(result);
      setStatus("active");
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setError(msg);
      setStatus("error");
      throw err;
    }
  }, []);

  const destroy = useCallback(async () => {
    const current = metaRef.current;
    if (!current) return;
    setStatus("destroying");
    try {
      await apiDestroySandbox(current.sandboxId);
    } catch {
      // sandbox may already be gone
    }
    metaRef.current = null;
    setMeta(null);
    setStatus("idle");
  }, []);

  return { status, meta, error, create, destroy };
}
