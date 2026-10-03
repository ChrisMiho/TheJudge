import { useLayoutEffect, useMemo, useRef, useState, type UIEvent } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { prefersReducedMotion } from "../lib/motionPreference";
import type { ConversationMessage } from "../types";

const CARD_CHIP_HREF_PREFIX = "#card:";

/** Escapes regex metacharacters so a card's own name is matched literally. */
function escapeForRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** REQ-206/REQ-075: a card name in the judge's message that exactly matches a card
 * attached to this conversation becomes a tappable chip. Rewritten as a markdown link to
 * a `#card:<id>` pseudo-href *before* parsing, so `markdownComponents.a` below can render
 * it as a chip button instead of an anchor — the one point in the pipeline that already
 * sees every rendered name, so there is no separate text-walking pass to keep in sync. */
function linkifyCardNames(content: string, cards: ReadonlyArray<{ cardId: string; name: string }>): string {
  let result = content;
  for (const card of cards) {
    if (!card.name.trim()) continue;
    const pattern = new RegExp(`\\b${escapeForRegExp(card.name)}\\b`, "g");
    result = result.replace(pattern, (match) => `[${match}](${CARD_CHIP_HREF_PREFIX}${card.cardId})`);
  }
  return result;
}

function buildMarkdownComponents(onCardChipActivate?: (cardId: string) => void): Components {
  return {
    a: ({ children, href, ...props }) => {
      if (href?.startsWith(CARD_CHIP_HREF_PREFIX)) {
        const cardId = href.slice(CARD_CHIP_HREF_PREFIX.length);
        return (
          <button
            type="button"
            data-testid={`conversation-card-chip-${cardId}`}
            onClick={() => onCardChipActivate?.(cardId)}
            className="conversation-card-chip ref"
          >
            {children}
          </button>
        );
      }
      return (
        <a {...props} href={href} target="_blank" rel="noopener noreferrer">
          {children}
        </a>
      );
    },
    table: ({ children, ...props }) => (
      <div className="conversation-markdown-table-scroll">
        <table {...props}>{children}</table>
      </div>
    )
  };
}

type ConversationThreadProps = {
  messages: ConversationMessage[];
  /** REQ-075/REQ-206: the conversation's attached cards — exact-name matches in an
   * assistant message become tappable chips. Omitted (or empty) when the conversation
   * has no attached cards; no chip rendering happens then. */
  cards?: ReadonlyArray<{ cardId: string; name: string }>;
  onCardChipActivate?: (cardId: string) => void;
};

type ReaderSnapshot = {
  scrollTop: number;
  nearBottom: boolean;
};

const NEAR_BOTTOM_THRESHOLD_PX = 64;

function readReaderSnapshot(container: HTMLDivElement): ReaderSnapshot {
  return {
    scrollTop: container.scrollTop,
    nearBottom: container.scrollHeight - container.scrollTop - container.clientHeight <= NEAR_BOTTOM_THRESHOLD_PX
  };
}

export function ConversationThread({ messages, cards, onCardChipActivate }: ConversationThreadProps): JSX.Element {
  const logRef = useRef<HTMLDivElement>(null);
  const markdownComponents = useMemo(() => buildMarkdownComponents(onCardChipActivate), [onCardChipActivate]);
  const hasCards = Boolean(cards && cards.length > 0);
  const previousMessageCountRef = useRef(0);
  const readerSnapshotRef = useRef<ReaderSnapshot | null>(null);
  const [animatedFromIndex, setAnimatedFromIndex] = useState(0);
  const [showNewResponse, setShowNewResponse] = useState(false);
  const latestAssistantIndex = useMemo(() => {
    for (let index = messages.length - 1; index >= 0; index -= 1) {
      if (messages[index]?.role === "assistant") return index;
    }

    return -1;
  }, [messages]);

  function scrollToLatest(container: HTMLDivElement): void {
    const behavior: ScrollBehavior = prefersReducedMotion() ? "auto" : "smooth";
    const top = container.scrollHeight;

    if (typeof container.scrollTo === "function") {
      container.scrollTo({ top, behavior });
    } else {
      container.scrollTop = top;
    }

    readerSnapshotRef.current = {
      scrollTop: Math.max(0, container.scrollHeight - container.clientHeight),
      nearBottom: true
    };
  }

  useLayoutEffect(() => {
    const container = logRef.current;
    if (!container) return;

    const previousMessageCount = previousMessageCountRef.current;

    if (messages.length === 0) {
      previousMessageCountRef.current = 0;
      readerSnapshotRef.current = null;
      setShowNewResponse(false);
      return;
    }

    if (previousMessageCount === 0) {
      setAnimatedFromIndex(0);
      scrollToLatest(container);
      setShowNewResponse(false);
    } else if (messages.length > previousMessageCount) {
      const readerSnapshot = readerSnapshotRef.current ?? readReaderSnapshot(container);
      setAnimatedFromIndex(previousMessageCount);

      if (readerSnapshot.nearBottom) {
        scrollToLatest(container);
        setShowNewResponse(false);
      } else {
        container.scrollTop = readerSnapshot.scrollTop;
        readerSnapshotRef.current = readerSnapshot;
        setShowNewResponse(true);
      }
    } else if (messages.length < previousMessageCount) {
      setAnimatedFromIndex(0);
      scrollToLatest(container);
      setShowNewResponse(false);
    }

    previousMessageCountRef.current = messages.length;
  }, [messages.length]);

  function handleScroll(event: UIEvent<HTMLDivElement>): void {
    const readerSnapshot = readReaderSnapshot(event.currentTarget);
    readerSnapshotRef.current = readerSnapshot;

    if (readerSnapshot.nearBottom) {
      setShowNewResponse(false);
    }
  }

  function handleNewResponse(): void {
    const container = logRef.current;
    if (!container) return;

    scrollToLatest(container);
    const newestAssistant = container.querySelector<HTMLElement>(
      `[data-conversation-message-index="${latestAssistantIndex}"]`
    );
    newestAssistant?.focus({ preventScroll: true });
    setShowNewResponse(false);
  }

  return (
    <>
      <div
        ref={logRef}
        role="log"
        aria-live="polite"
        aria-relevant="additions text"
        aria-atomic="false"
        onScroll={handleScroll}
        className="thread conversation-thread"
      >
        {messages.map((message, index) => {
          const entranceClassName = index >= animatedFromIndex ? " conversation-message-enter" : "";
          const isNewestAssistant = message.role === "assistant" && index === latestAssistantIndex;

          if (message.role === "assistant") {
            return (
              <div
                key={index}
                data-conversation-message-index={index}
                tabIndex={isNewestAssistant ? -1 : undefined}
                className={`conversation-message msg judge${entranceClassName}`}
              >
                <span className="seal" aria-hidden="true" />
                <div>
                  <span className="who">TheJudge</span>
                  <div className="conversation-markdown">
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                      {hasCards ? linkifyCardNames(message.content, cards!) : message.content}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            );
          }

          return (
            <div
              key={index}
              data-conversation-message-index={index}
              className={`conversation-message msg you${entranceClassName}`}
            >
              {message.content}
            </div>
          );
        })}
      </div>

      {showNewResponse && (
        <button
          type="button"
          onClick={handleNewResponse}
          className="conversation-new-response btn ambient-accent-surface ambient-accent-interactive"
        >
          New response
        </button>
      )}
    </>
  );
}
