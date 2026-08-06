import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useRef, useState, type CSSProperties } from "react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { useAutoGrowTextarea } from "./useAutoGrowTextarea";

afterEach(cleanup);

const scrollHeightByValue = new Map<string, number>();
let boundingTop = 100;
let originalScrollHeight: PropertyDescriptor | undefined;
let originalGetBoundingClientRect: PropertyDescriptor | undefined;
let originalInnerHeight: PropertyDescriptor | undefined;
let originalResizeObserver: PropertyDescriptor | undefined;

function setScrollHeight(value: string, height: number): void {
  scrollHeightByValue.set(value, height);
}

function Harness({
  initialValue = "",
  style
}: {
  initialValue?: string;
  style?: CSSProperties;
}): JSX.Element {
  const [value, setValue] = useState(initialValue);
  const ref = useRef<HTMLTextAreaElement>(null);
  useAutoGrowTextarea(value, ref);

  return (
    <textarea
      aria-label="Grow test field"
      ref={ref}
      style={style}
      value={value}
      onChange={(e) => setValue(e.target.value)}
    />
  );
}

/**
 * jsdom ships no `ResizeObserver`. This stand-in records live observers so a test can
 * fire them explicitly, standing in for the browser notifying the hook that a
 * previously unrendered field just regained a layout box.
 */
const liveResizeObserverCallbacks = new Set<() => void>();

function triggerResizeObservers(): void {
  liveResizeObserverCallbacks.forEach((callback) => callback());
}

class StubResizeObserver {
  constructor(private readonly callback: () => void) {}

  observe(): void {
    liveResizeObserverCallbacks.add(this.callback);
  }

  unobserve(): void {
    liveResizeObserverCallbacks.delete(this.callback);
  }

  disconnect(): void {
    liveResizeObserverCallbacks.delete(this.callback);
  }
}

describe("Frontend - Shared", () => {
  describe("useAutoGrowTextarea", () => {
    beforeEach(() => {
      scrollHeightByValue.clear();
      liveResizeObserverCallbacks.clear();
      boundingTop = 100;

      originalResizeObserver = Object.getOwnPropertyDescriptor(window, "ResizeObserver");
      Object.defineProperty(window, "ResizeObserver", {
        configurable: true,
        writable: true,
        value: StubResizeObserver
      });

      originalScrollHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "scrollHeight");
      originalGetBoundingClientRect = Object.getOwnPropertyDescriptor(
        HTMLElement.prototype,
        "getBoundingClientRect"
      );
      originalInnerHeight = Object.getOwnPropertyDescriptor(window, "innerHeight");

      Object.defineProperty(HTMLElement.prototype, "scrollHeight", {
        configurable: true,
        get(this: HTMLElement) {
          if (this instanceof HTMLTextAreaElement) {
            return scrollHeightByValue.get(this.value) ?? 20;
          }
          return 0;
        }
      });
      Object.defineProperty(HTMLElement.prototype, "getBoundingClientRect", {
        configurable: true,
        value: () => ({
          top: boundingTop,
          bottom: boundingTop,
          left: 0,
          right: 0,
          width: 0,
          height: 0,
          x: 0,
          y: boundingTop,
          toJSON: () => ({})
        })
      });
      Object.defineProperty(window, "innerHeight", { configurable: true, value: 800 });
    });

    afterEach(() => {
      if (originalScrollHeight) {
        Object.defineProperty(HTMLElement.prototype, "scrollHeight", originalScrollHeight);
      }
      if (originalGetBoundingClientRect) {
        Object.defineProperty(HTMLElement.prototype, "getBoundingClientRect", originalGetBoundingClientRect);
      }
      if (originalInnerHeight) {
        Object.defineProperty(window, "innerHeight", originalInnerHeight);
      }
      if (originalResizeObserver) {
        Object.defineProperty(window, "ResizeObserver", originalResizeObserver);
      } else {
        Reflect.deleteProperty(window, "ResizeObserver");
      }
      liveResizeObserverCallbacks.clear();
    });

    it("sizes the field to its scrollHeight when well within the viewport ceiling", () => {
      setScrollHeight("", 20);
      render(<Harness />);

      const field = screen.getByLabelText("Grow test field") as HTMLTextAreaElement;
      expect(field.style.height).toBe("20px");
    });

    it("grows with typed content up to scrollHeight", () => {
      setScrollHeight("", 20);
      setScrollHeight("line one\nline two\nline three", 72);
      render(<Harness />);

      const field = screen.getByLabelText("Grow test field") as HTMLTextAreaElement;
      fireEvent.change(field, { target: { value: "line one\nline two\nline three" } });

      expect(field.style.height).toBe("72px");
    });

    it("shrinks back down when content is removed", () => {
      setScrollHeight("", 20);
      setScrollHeight("a lot of content here", 96);
      render(<Harness initialValue="a lot of content here" />);

      const field = screen.getByLabelText("Grow test field") as HTMLTextAreaElement;
      expect(field.style.height).toBe("96px");

      fireEvent.change(field, { target: { value: "" } });
      expect(field.style.height).toBe("20px");
    });

    it("caps growth at the viewport ceiling instead of scrollHeight, so it never forces a page scroll", () => {
      // Field top sits at 700px in an 800px-tall viewport, leaving room for well under the
      // field's full requested scrollHeight once the bottom margin is subtracted.
      boundingTop = 700;
      setScrollHeight("", 20);
      setScrollHeight("very long content that wants a lot of vertical space", 500);
      render(<Harness />);

      const field = screen.getByLabelText("Grow test field") as HTMLTextAreaElement;
      fireEvent.change(field, {
        target: { value: "very long content that wants a lot of vertical space" }
      });

      // Ceiling = innerHeight(800) - top(700) - margin(24) = 76px, well under the requested 500px.
      expect(field.style.height).toBe("76px");
    });

    it("recalculates on window resize", () => {
      setScrollHeight("some content", 300);
      render(<Harness initialValue="some content" />);
      const field = screen.getByLabelText("Grow test field") as HTMLTextAreaElement;
      expect(field.style.height).toBe("300px");

      boundingTop = 750;
      act(() => {
        fireEvent(window, new Event("resize"));
      });

      // Ceiling = 800 - 750 - 24 = 26px, below the 300px scrollHeight.
      expect(field.style.height).toBe("26px");
    });

    it("keeps the last visible height when a resize fires while the field is unrendered", () => {
      // A field whose destination is inactive has no layout box, so it reports
      // scrollHeight 0. Sizing from that measurement pinned `height: 0px` and clipped
      // the field's content once the destination was shown again (REQ-120).
      setScrollHeight("some content", 300);
      render(<Harness initialValue="some content" />);
      const field = screen.getByLabelText("Grow test field") as HTMLTextAreaElement;
      expect(field.style.height).toBe("300px");

      setScrollHeight("some content", 0);
      act(() => {
        fireEvent(window, new Event("resize"));
      });

      expect(field.style.height).toBe("300px");
    });

    it("re-measures when the field regains a layout box after being unrendered", () => {
      setScrollHeight("some content", 300);
      render(<Harness initialValue="some content" />);
      const field = screen.getByLabelText("Grow test field") as HTMLTextAreaElement;

      setScrollHeight("some content", 0);
      act(() => {
        fireEvent(window, new Event("resize"));
      });

      // Destination becomes active again: the element regains a box, and the
      // observer recomputes without waiting for a value change or another resize.
      setScrollHeight("some content", 120);
      act(() => {
        triggerResizeObservers();
      });

      expect(field.style.height).toBe("120px");
    });

    it("never sizes the field below a single line of its own text", () => {
      // Ceiling maths can bottom out at 0 when the field sits near the viewport
      // bottom; a zero-height field is never a valid resting state (REQ-120).
      boundingTop = 795;
      setScrollHeight("some content", 300);
      render(<Harness initialValue="some content" style={{ lineHeight: "20px", paddingTop: "6px", paddingBottom: "6px" }} />);

      const field = screen.getByLabelText("Grow test field") as HTMLTextAreaElement;

      // Ceiling = 800 - 795 - 24, clamped to 0; the single-line floor wins instead.
      expect(Number.parseFloat(field.style.height)).toBeGreaterThanOrEqual(20);
    });
  });
});
