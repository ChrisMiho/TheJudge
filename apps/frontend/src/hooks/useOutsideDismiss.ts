import { useEffect, useRef, type RefObject } from "react";

/**
 * Every currently enabled adopter, in the order it became enabled. Only the last entry — the
 * surface the user opened most recently, and therefore the one painting on top — handles an
 * outside interaction. Without this, a nested overlay (card detail opened from inside View
 * Context) puts its own full-viewport scrim over the host surface, so one mousedown reads as
 * "outside" for both hooks and collapses two layers at once. Module scope is the right home:
 * the ordering is a property of the document's overlay stack, not of any React subtree.
 */
const dismissStack: symbol[] = [];

/**
 * The overlay family's sole outside-dismiss implementation (REQ-143). Closes on any
 * `mousedown` whose target falls outside every ref in `containerRefs`, while `enabled` is
 * true and this adopter is the topmost enabled surface. Each adopter keeps its own
 * Escape/close-button paths — this hook only covers the outside/scrim interaction.
 *
 * `mousedown`, not `click`, matters for two reasons pointing the same direction:
 * - Many adopters open via a `click` on a trigger that lives outside `containerRefs` (e.g.
 *   History's rail button vs. its portaled drawer). `mousedown` fires and is handled *before*
 *   that opening `click`, so the interaction that opens a surface can never also be read by
 *   this hook as the click that dismisses it — listening on `click` self-dismisses the
 *   surface the instant it opens, since React flushes the open state and this effect
 *   synchronously enough that the very same `click` event still reaches `document`.
 * - A `mousedown` on a non-focusable scrim carries a browser default action that blurs the
 *   currently focused element to `<body>`. `preventDefault()` below suppresses exactly that
 *   default action for a dismissing mousedown, so a synchronous focus-restore reflex the
 *   dismiss triggers is never stomped by it.
 */
export function useOutsideDismiss(
  containerRefs: ReadonlyArray<RefObject<HTMLElement>>,
  onDismiss: () => void,
  enabled: boolean
): void {
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;
  const idRef = useRef<symbol | null>(null);
  idRef.current ??= Symbol("outside-dismiss");

  useEffect(() => {
    if (!enabled) return;

    const id = idRef.current as symbol;
    dismissStack.push(id);

    function handlePointerDown(event: MouseEvent): void {
      if (dismissStack[dismissStack.length - 1] !== id) return;

      const target = event.target as Node;
      const isInside = containerRefs.some((ref) => ref.current?.contains(target) ?? false);
      if (!isInside) {
        event.preventDefault();
        onDismissRef.current();
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      const index = dismissStack.lastIndexOf(id);
      if (index !== -1) dismissStack.splice(index, 1);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- containerRefs is a fresh array literal at most call sites but holds stable ref objects read live via `.current`; onDismiss is always read through onDismissRef. Only `enabled` should re-attach the listener.
  }, [enabled]);
}
