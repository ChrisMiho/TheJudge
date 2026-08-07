import { useEffect, useRef, type RefObject } from "react";

/**
 * The overlay family's sole outside-dismiss implementation (REQ-143). Closes on any
 * `mousedown` whose target falls outside every ref in `containerRefs`, while `enabled` is
 * true. Each adopter keeps its own Escape/close-button paths — this hook only covers the
 * outside/scrim interaction.
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

  useEffect(() => {
    if (!enabled) return;

    function handlePointerDown(event: MouseEvent): void {
      const target = event.target as Node;
      const isInside = containerRefs.some((ref) => ref.current?.contains(target) ?? false);
      if (!isInside) {
        event.preventDefault();
        onDismissRef.current();
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- containerRefs is a fresh array literal at most call sites but holds stable ref objects read live via `.current`; onDismiss is always read through onDismissRef. Only `enabled` should re-attach the listener.
  }, [enabled]);
}
