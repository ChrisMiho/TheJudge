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
  /** REQ-075/REQ-206: the conversation's attached cards, passed through to
   * `ConversationThread` so an exact name match in the judge's message renders as a
   * tappable chip. Omitted entirely by a workspace with no card-aware conversation
   * (In-depth details' own chat keeps its existing frozen-context trigger unchanged). */
  cards?: ReadonlyArray<{ cardId: string; name: string }>;
  onCardChipActivate?: (cardId: string) => void;
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
  cards,
  onCardChipActivate,
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

      <ConversationThread messages={messages} cards={cards} onCardChipActivate={onCardChipActivate} />

      {newResponseControl}

      {error && (
        <div className="motion-error aq-error">
          <p>{error}</p>
          <button
            type="button"
            className="btn"
            disabled={!canRetry}
            onClick={() => void onRetry()}
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
          className="conversation-start-over btn"
        >
          Start Over
        </button>
      )}

      {statusMessage && (
        <p className="motion-success aq-note">
          {statusMessage}
        </p>
      )}
    </section>
  );
}
