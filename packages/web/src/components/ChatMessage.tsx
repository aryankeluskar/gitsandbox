import type { OcMessage, OcPart } from "../lib/api";
import { ToolCard } from "./ToolCard";
import { Reasoning } from "./Reasoning";

interface ChatMessageProps {
  message: OcMessage;
  allMessages: OcMessage[];
}

function findToolResult(
  toolCallId: string,
  allMessages: OcMessage[]
): OcPart | null {
  for (const m of allMessages) {
    for (const p of m.parts) {
      if (p.type === "tool-result" && p.toolCallId === toolCallId) return p;
    }
  }
  return null;
}

function renderMarkdown(text: string): string {
  return text
    .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre class="rounded bg-zinc-950/60 p-3 my-2 text-[12px] overflow-auto"><code>$2</code></pre>')
    .replace(/`([^`]+)`/g, '<code class="rounded bg-zinc-900 px-1 py-0.5 text-[12px] text-zinc-300">$1</code>')
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/\n/g, "<br />");
}

export function ChatMessage({ message, allMessages }: ChatMessageProps) {
  const { info, parts } = message;

  if (info.role === "tool") return null;

  if (info.role === "user") {
    const text = parts
      .filter((p) => p.type === "text")
      .map((p) => p.text || "")
      .join("\n");

    return (
      <div className="flex justify-end px-4 py-3">
        <div className="max-w-[85%] rounded-2xl bg-zinc-800 px-4 py-2.5 text-[14px] leading-relaxed text-zinc-100">
          {text}
        </div>
      </div>
    );
  }

  const thinkingParts = parts.filter(
    (p) => p.type === "reasoning" || p.type === "thinking"
  );
  const textParts = parts.filter((p) => p.type === "text");
  const toolCallParts = parts.filter((p) => p.type === "tool-call");

  return (
    <div className="px-4 py-3">
      <div className="max-w-[85%]">
        {thinkingParts.map((p, i) => (
          <Reasoning
            key={`think-${i}`}
            thinking={p.thinking || p.text || ""}
          />
        ))}

        {toolCallParts.map((p, i) => {
          const toolResult = p.toolCallId
            ? findToolResult(p.toolCallId, allMessages)
            : null;

          const isError = toolResult
            ? Boolean(
                (toolResult as Record<string, unknown>).isError ||
                (toolResult.result as Record<string, unknown>)?.exitCode
              )
            : false;

          return (
            <ToolCard
              key={`tool-${p.toolCallId || i}`}
              toolName={p.toolName || "tool"}
              args={p.args}
              result={toolResult?.result}
              isRunning={!toolResult}
              isError={isError}
            />
          );
        })}

        {textParts.map((p, i) => (
          <div
            key={`text-${i}`}
            className="prose prose-sm prose-invert max-w-none text-[14px] leading-relaxed text-zinc-300"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(p.text || "") }}
          />
        ))}
      </div>
    </div>
  );
}
