import { useState, useEffect } from "react";
import { useSettings, type AgentChoice } from "../hooks/useSettings";
import { getAllCredentials, setCredential, deleteCredential } from "../db/credentials";

interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
}

const CREDENTIAL_KEYS = [
  { key: "ANTHROPIC_API_KEY", label: "Anthropic API Key" },
  { key: "OPENAI_API_KEY", label: "OpenAI API Key" },
  { key: "GOOGLE_API_KEY", label: "Google AI API Key" },
  { key: "GITHUB_TOKEN", label: "GitHub Token (private repos)" },
];

export function SettingsPanel({ open, onClose }: SettingsPanelProps) {
  const settings = useSettings();
  const [creds, setCreds] = useState<Record<string, string>>({});
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      getAllCredentials().then((c) => {
        setCreds(c);
        setDrafts(c);
      });
    }
  }, [open]);

  if (!open) return null;

  async function saveCred(key: string) {
    const val = drafts[key] ?? "";
    if (val) {
      await setCredential(key, val);
      setCreds((prev) => ({ ...prev, [key]: val }));
    } else {
      await deleteCredential(key);
      setCreds((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-100">Settings</h2>
          <button
            onClick={onClose}
            className="text-zinc-400 transition hover:text-zinc-200"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M15 5L5 15M5 5l10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="mb-6">
          <h3 className="mb-3 text-sm font-medium text-zinc-300">Agent</h3>
          <div className="flex gap-2">
            {(["opencode", "pi"] as const).map((a) => (
              <button
                key={a}
                onClick={() => settings.set("agent", a)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                  settings.get("agent") === a
                    ? "bg-blue-600 text-white"
                    : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                }`}
              >
                {a === "opencode" ? "OpenCode" : "Pi"}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-medium text-zinc-300">API Keys</h3>
          {CREDENTIAL_KEYS.map(({ key, label }) => (
            <div key={key}>
              <label className="mb-1 block text-xs text-zinc-500">
                {label}
              </label>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={drafts[key] ?? ""}
                  onChange={(e) =>
                    setDrafts((d) => ({ ...d, [key]: e.target.value }))
                  }
                  placeholder={creds[key] ? "••••••••" : "Not set"}
                  className="flex-1 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:border-blue-500"
                />
                <button
                  onClick={() => saveCred(key)}
                  className="rounded-md bg-zinc-800 px-3 py-2 text-xs text-zinc-300 transition hover:bg-zinc-700"
                >
                  Save
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-lg bg-zinc-800 px-4 py-2 text-sm text-zinc-300 transition hover:bg-zinc-700"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
