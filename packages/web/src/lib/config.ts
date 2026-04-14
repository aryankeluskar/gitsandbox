const isDev = import.meta.env.DEV;

export const WORKER_ORIGIN = isDev
  ? ""
  : "https://gitsandbox-worker.soyrun.workers.dev";

export function getApiBase(): string {
  return WORKER_ORIGIN;
}

export function getWsOrigin(): string {
  if (isDev) {
    const proto = location.protocol === "https:" ? "wss:" : "ws:";
    return `${proto}//${location.host}`;
  }
  return "wss://gitsandbox-worker.soyrun.workers.dev";
}
