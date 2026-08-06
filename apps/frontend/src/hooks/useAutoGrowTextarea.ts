import { useLayoutEffect, useRef, type RefObject } from "react";

/**
 * Breathing room (px) kept between the growing field's bottom edge and the boundary it's
 * measured against, so growth never quite touches it — a small cushion on top of the
 * below-field-chrome reserve computed below, rather than the sole ceiling factor (REQ-110).
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
/**
 * Height of one line of the field's own text, including padding under `border-box`.
 * Used as a floor so ceiling maths can never resolve to a field too short to show
 * the line the user is typing (REQ-120). Returns `0` when the environment reports
 * no usable `line-height`, which leaves the floor inert rather than guessing.
 */
function measureSingleLineHeight(textarea: HTMLTextAreaElement): number {
  const styles = window.getComputedStyle(textarea);
  const lineHeight = Number.parseFloat(styles.lineHeight);
  if (!Number.isFinite(lineHeight)) return 0;

  if (styles.boxSizing !== "border-box") return lineHeight;

  const paddingTop = Number.parseFloat(styles.paddingTop) || 0;
  const paddingBottom = Number.parseFloat(styles.paddingBottom) || 0;
  return lineHeight + paddingTop + paddingBottom;
}

export function useAutoGrowTextarea(
  value: string,
  textareaRef: RefObject<HTMLTextAreaElement>
): void {
  const resizeRef = useRef<() => void>(() => undefined);
  // Set when a measurement was skipped because the field had no layout box, so the
  // observer below knows a recompute is owed as soon as it gets one back.
  const remeasureWhenRenderedRef = useRef(false);

  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    function resize(): void {
      if (!textarea) return;

      const previousHeight = textarea.style.height;

      // Reset before measuring: scrollHeight only reports growth potential correctly once
      // any previously-applied explicit height stops constraining it.
      textarea.style.height = "auto";

      // A field belonging to an inactive portal destination is not rendered, so it
      // reports `scrollHeight: 0`. Sizing from that measurement pins the field to
      // padding-only height, and because this effect only re-runs on `value`, the
      // collapse survives re-activation and clips whatever the user had typed
      // (REQ-120). Keep the last height measured while visible and defer to the
      // observer below instead.
      if (textarea.scrollHeight === 0) {
        textarea.style.height = previousHeight;
        remeasureWhenRenderedRef.current = true;
        return;
      }

      remeasureWhenRenderedRef.current = false;

      const { top } = textarea.getBoundingClientRect();
      const viewportCeiling = Math.max(0, window.innerHeight - top - VIEWPORT_BOTTOM_MARGIN_PX);
      const ceiling = Math.max(viewportCeiling, measureSingleLineHeight(textarea));

      textarea.style.height = `${Math.min(textarea.scrollHeight, ceiling)}px`;
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

  // Re-activating a destination changes neither `value` nor the window size, so
  // without this the field would keep whatever height it held while hidden until the
  // user typed. Only a measurement this hook actually skipped triggers a recompute,
  // so the observer never reacts to the hook's own height writes.
  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea || typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(() => {
      if (!remeasureWhenRenderedRef.current) return;
      if (textarea.scrollHeight === 0) return;
      resizeRef.current();
    });

    observer.observe(textarea);
    return () => observer.disconnect();
  }, [textareaRef]);
}
