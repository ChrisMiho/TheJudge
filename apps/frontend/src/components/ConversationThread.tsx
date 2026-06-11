import type { ConversationMessage } from "../types";

type ConversationThreadProps = {
  messages: ConversationMessage[];
};

export function ConversationThread({ messages }: ConversationThreadProps): JSX.Element {
  return (
    <div className="flex max-h-96 flex-col gap-3 overflow-y-auto rounded-2xl border border-slate-700/70 bg-slate-900/55 p-4">
      {messages.map((message, index) => (
        <div
          key={index}
          className={
            message.role === "assistant"
              ? "max-w-[85%] self-start rounded-2xl rounded-tl-sm bg-slate-800/80 px-4 py-3 text-sm text-slate-100"
              : "max-w-[85%] self-end rounded-2xl rounded-tr-sm border border-blue-500/30 bg-blue-600/30 px-4 py-3 text-sm text-slate-100"
          }
        >
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>
      ))}
    </div>
  );
}
