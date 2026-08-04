import { useLayoutEffect, useMemo, useRef, useState, type UIEvent } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { prefersReducedMotion } from "../lib/motionPreference";
import type { ConversationMessage } from "../types";

const markdownComponents: Components = {
  a: ({ children, ...props }) => (
    <a {...props} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  ),
  table: ({ children, ...props }) => (
    <div className="conversation-markdown-table-scroll">
      <table {...props}>{children}</table>
    </div>
  )
};

type ConversationThreadProps = {
  messages: ConversationMessage[];
};

type ReaderSnapshot = {
  scrollTop: number;
  nearBottom: boolean;
};

const NEAR_BOTTOM_THRESHOLD_PX = 64;

function readReaderSnapshot(container: HTMLDivElement): ReaderSnapshot {
  return {
    scrollTop: container.scrollTop,
    nearBottom:
      container.scrollHeight - container.scrollTop - container.clientHeight <=
      NEAR_BOTTOM_THRESHOLD_PX
  };
}

export function ConversationThread({ messages }: ConversationThreadProps): JSX.Element {
  const logRef = useRef<HTMLDivElement>(null);
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
      const readerSnapshot =
        readerSnapshotRef.current ?? readReaderSnapshot(container);
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
        className="conversation-thread flex max-h-96 flex-col gap-3 overflow-y-auto rounded-2xl border border-zinc-700/70 bg-zinc-900/55 p-4"
      >
        {messages.map((message, index) => {
          const roleClassName =
            message.role === "assistant"
              ? "max-w-[85%] self-start rounded-2xl rounded-tl-sm bg-zinc-800/80 px-4 py-3 text-sm text-zinc-100"
              : "max-w-[85%] self-end rounded-2xl rounded-tr-sm border border-accent-strong/30 bg-accent-strong/30 px-4 py-3 text-sm text-accent-contrast";
          const entranceClassName =
            index >= animatedFromIndex ? " conversation-message-enter" : "";
          const isNewestAssistant =
            message.role === "assistant" && index === latestAssistantIndex;

          return (
            <div
              key={index}
              data-conversation-message-index={index}
              tabIndex={isNewestAssistant ? -1 : undefined}
              className={`conversation-message ${roleClassName}${entranceClassName}`}
            >
              {message.role === "assistant" ? (
                <div className="conversation-markdown">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                    {message.content}
                  </ReactMarkdown>
                </div>
              ) : (
                <p className="whitespace-pre-wrap">{message.content}</p>
              )}
            </div>
          );
        })}
      </div>

      {showNewResponse && (
        <button
          type="button"
          onClick={handleNewResponse}
          className="conversation-new-response ambient-accent-surface ambient-accent-interactive rounded-xl border border-accent/40 bg-zinc-900/90 px-4 py-2.5 text-sm font-semibold text-accent-soft"
        >
          New response
        </button>
      )}
    </>
  );
}
