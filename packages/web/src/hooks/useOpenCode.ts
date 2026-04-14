import { useState, useCallback, useRef, useEffect } from "react";
import {
  ocCreateSession,
  ocListMessages,
  ocSendMessage,
  ocAbortSession,
  ocEventsUrl,
  type OcMessage,
  type OcSession,
} from "../lib/api";

export type ChatStatus = "idle" | "loading" | "streaming" | "error";

export interface UseOpenCodeReturn {
  session: OcSession | null;
  messages: OcMessage[];
  status: ChatStatus;
  error: string | null;
  initSession: (sandboxId: string) => Promise<void>;
  sendMessage: (text: string) => Promise<void>;
  abort: () => void;
}

export function useOpenCode(sandboxId: string | null): UseOpenCodeReturn {
  const [session, setSession] = useState<OcSession | null>(null);
  const [messages, setMessages] = useState<OcMessage[]>([]);
  const [status, setStatus] = useState<ChatStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const sandboxIdRef = useRef<string | null>(null);

  const refreshMessages = useCallback(async () => {
    if (!sandboxIdRef.current || !sessionIdRef.current) return;
    try {
      const msgs = await ocListMessages(
        sandboxIdRef.current,
        sessionIdRef.current
      );
      setMessages(msgs);
    } catch {
      // ignore refresh errors during streaming
    }
  }, []);

  const connectSSE = useCallback(
    (sbId: string) => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      const es = new EventSource(ocEventsUrl(sbId));
      eventSourceRef.current = es;

      es.addEventListener("message", (ev) => {
        try {
          const data = JSON.parse(ev.data);
          const eventType = data?.type ?? "";

          if (
            eventType.startsWith("message.") ||
            eventType.startsWith("session.")
          ) {
            refreshMessages();
          }

          if (eventType === "message.completed" || eventType === "session.completed") {
            setStatus("idle");
          }
        } catch {
          // non-JSON event, ignore
        }
      });

      es.addEventListener("server.connected", () => {
        // connected
      });

      es.onerror = () => {
        // SSE reconnects automatically
      };
    },
    [refreshMessages]
  );

  const initSession = useCallback(
    async (sbId: string) => {
      sandboxIdRef.current = sbId;
      setStatus("loading");
      setError(null);

      try {
        const sess = await ocCreateSession(sbId);
        setSession(sess);
        sessionIdRef.current = sess.id;
        connectSSE(sbId);
        setStatus("idle");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to init session");
        setStatus("error");
      }
    },
    [connectSSE]
  );

  const sendMessage = useCallback(
    async (text: string) => {
      if (!sandboxIdRef.current || !sessionIdRef.current) return;

      setStatus("streaming");
      setError(null);

      const userMsg: OcMessage = {
        info: {
          id: `temp-${Date.now()}`,
          role: "user",
          createdAt: new Date().toISOString(),
        },
        parts: [{ type: "text", text }],
      };
      setMessages((prev) => [...prev, userMsg]);

      try {
        const response = await ocSendMessage(
          sandboxIdRef.current,
          sessionIdRef.current,
          text
        );

        setMessages((prev) => {
          const withoutTemp = prev.filter(
            (m) => m.info.id !== userMsg.info.id
          );
          return [...withoutTemp, { info: { ...userMsg.info, id: response.info.id.replace(/assistant/, "user") }, parts: userMsg.parts }, response];
        });

        await refreshMessages();
        setStatus("idle");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to send message");
        setStatus("error");
        await refreshMessages();
      }
    },
    [refreshMessages]
  );

  const abort = useCallback(() => {
    if (sandboxIdRef.current && sessionIdRef.current) {
      ocAbortSession(sandboxIdRef.current, sessionIdRef.current).catch(
        () => {}
      );
    }
    setStatus("idle");
  }, []);

  useEffect(() => {
    return () => {
      eventSourceRef.current?.close();
    };
  }, []);

  useEffect(() => {
    if (sandboxId && sandboxId !== sandboxIdRef.current) {
      initSession(sandboxId);
    }
  }, [sandboxId, initSession]);

  return { session, messages, status, error, initSession, sendMessage, abort };
}
