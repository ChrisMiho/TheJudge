import { useLayoutEffect, useRef, type RefObject } from "react";

/**
 * Breathing room (px) kept between the growing field's bottom edge and the viewport's own
 * bottom edge, so growth never quite touches it — a small cushion rather than an exact
 * zero-margin ceiling (REQ-110).
 */
const VIEWPORT_BOTTOM_MARGIN_PX = 24;

/**
 * Grow-to-fit behavior shared by both pre-submit question composers (Enrichment's optional
 * question, Quick Question's question) — DEC-131 prefers one shared implementation over two
 * divergent per-field ones. Accepts the caller's own `<textarea>` ref (rather than returning
 * a new one) so a call site that already needs the element for something else — Quick
 * Question focuses it after a topic selection — doesn't have to merge two refs. The field
 * grows with its content and shrinks back down as content is removed, capped so it never
 * grows past the viewport's own bottom edge and forces a document/page scroll. The
 * character-count cap itself is unrelated and stays owned by each call site
 * (`maxLength`/`onChange` slicing).
 */
export function useAutoGrowTextarea(
  value: string,
  textareaRef: RefObject<HTMLTextAreaElement>
): void {
  const resizeRef = useRef<() => void>(() => undefined);

  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    function resize(): void {
      if (!textarea) return;

      // Reset before measuring: scrollHeight only reports growth potential correctly once
      // any previously-applied explicit height stops constraining it.
      textarea.style.height = "auto";

      const { top } = textarea.getBoundingClientRect();
      const viewportCeiling = Math.max(0, window.innerHeight - top - VIEWPORT_BOTTOM_MARGIN_PX);

      textarea.style.height = `${Math.min(textarea.scrollHeight, viewportCeiling)}px`;
    }

    resizeRef.current = resize;
    resize();
  }, [value, textareaRef]);

  useLayoutEffect(() => {
    function handleWindowResize(): void {
      resizeRef.current();
    }

    window.addEventListener("resize", handleWindowResize);
    return () => window.removeEventListener("resize", handleWindowResize);
  }, []);
}
