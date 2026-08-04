import type { ReactNode } from "react";
import type { ConversationMessage } from "../types";
import { AdaptiveContextDialog } from "./AdaptiveContextDialog";
import { ConversationThread } from "./ConversationThread";
import { FollowUpComposer } from "./FollowUpComposer";

export type ConversationContextDescriptor = {
  triggerLabel: string;
  dialogLabel: string;
  content: ReactNode;
};

export type ConversationHistoryTriggerDescriptor = {
  onOpen: () => void;
};

type ConversationWorkspaceProps = {
  messages: ConversationMessage[];
  context?: ConversationContextDescriptor;
  pendingFeedback?: ReactNode;
  error: string | null;
  canRetry: boolean;
  retryLabel: string;
  onRetry: () => Promise<void>;
  isFollowUpSubmitting: boolean;
  onFollowUp: (text: string) => Promise<void>;
  onStartOver: () => void;
  showStartOver: boolean;
  newResponseControl?: ReactNode;
  statusMessage?: string | null;
};

export function ConversationWorkspace({
  messages,
  context,
  pendingFeedback,
  error,
  canRetry,
  retryLabel,
  onRetry,
  isFollowUpSubmitting,
  onFollowUp,
  onStartOver,
  showStartOver,
  newResponseControl,
  statusMessage
}: ConversationWorkspaceProps): JSX.Element {
  return (
    <section
      aria-label="Conversation workspace"
      data-conversation-workspace="true"
      data-testid="conversation-workspace"
      className="conversation-workspace conversation-workspace-handoff"
    >
      {context && (
        <AdaptiveContextDialog
          triggerLabel={context.triggerLabel}
          dialogLabel={context.dialogLabel}
        >
          {context.content}
        </AdaptiveContextDialog>
      )}

      {pendingFeedback}

      <ConversationThread messages={messages} />

      {newResponseControl}

      {error && (
        <div className="motion-error space-y-2 rounded-2xl border border-rose-500/40 bg-rose-950/30 p-4">
          <p className="text-sm text-rose-300">{error}</p>
          <button
            type="button"
            disabled={!canRetry}
            onClick={() => void onRetry()}
            className="rounded-xl border border-rose-500/50 bg-rose-500/10 px-4 py-2 text-sm font-semibold text-rose-200 transition hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {retryLabel}
          </button>
        </div>
      )}

      <FollowUpComposer isSubmitting={isFollowUpSubmitting} onSubmit={onFollowUp} />

      {showStartOver && (
        <button
          type="button"
          onClick={onStartOver}
          className="rounded-xl border border-zinc-500 bg-zinc-800/70 px-4 py-2.5 text-sm font-semibold text-zinc-100 transition hover:bg-zinc-700/80"
        >
          Start Over
        </button>
      )}

      {statusMessage && (
        <p className="motion-success rounded-xl border border-accent/40 bg-accent/10 px-3 py-2 text-sm font-medium text-accent-soft">
          {statusMessage}
        </p>
      )}
    </section>
  );
}
