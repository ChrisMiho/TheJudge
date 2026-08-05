import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useRef, useState } from "react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { useAutoGrowTextarea } from "./useAutoGrowTextarea";

afterEach(cleanup);

const scrollHeightByValue = new Map<string, number>();
let boundingTop = 100;
let originalScrollHeight: PropertyDescriptor | undefined;
let originalGetBoundingClientRect: PropertyDescriptor | undefined;
let originalInnerHeight: PropertyDescriptor | undefined;

function setScrollHeight(value: string, height: number): void {
  scrollHeightByValue.set(value, height);
}

function Harness({ initialValue = "" }: { initialValue?: string }): JSX.Element {
  const [value, setValue] = useState(initialValue);
  const ref = useRef<HTMLTextAreaElement>(null);
  useAutoGrowTextarea(value, ref);

  return (
    <textarea aria-label="Grow test field" ref={ref} value={value} onChange={(e) => setValue(e.target.value)} />
  );
}

describe("Frontend - Shared", () => {
  describe("useAutoGrowTextarea", () => {
    beforeEach(() => {
      scrollHeightByValue.clear();
      boundingTop = 100;

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
  });
});
