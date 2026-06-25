import type { ConversationMessage } from "../types";

type ConversationThreadProps = {
  messages: ConversationMessage[];
};

export function ConversationThread({ messages }: ConversationThreadProps): JSX.Element {
  return (
    <div className="flex max-h-96 flex-col gap-3 overflow-y-auto rounded-2xl border border-zinc-700/70 bg-zinc-900/55 p-4">
      {messages.map((message, index) => (
        <div
          key={index}
          className={
            message.role === "assistant"
              ? "max-w-[85%] self-start rounded-2xl rounded-tl-sm bg-zinc-800/80 px-4 py-3 text-sm text-zinc-100"
              : "max-w-[85%] self-end rounded-2xl rounded-tr-sm border border-accent-strong/30 bg-accent-strong/30 px-4 py-3 text-sm text-zinc-100"
          }
        >
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>
      ))}
    </div>
  );
}
