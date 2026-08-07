import { renderHook } from "@testing-library/react";
import { act } from "@testing-library/react";
import { useRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useOutsideDismiss } from "./useOutsideDismiss";

afterEach(() => {
  document.body.innerHTML = "";
});

function mousedownOn(node: Element): void {
  const event = new MouseEvent("mousedown", { bubbles: true, cancelable: true });
  node.dispatchEvent(event);
}

describe("Frontend - Shared", () => {
  describe("useOutsideDismiss", () => {
    it("calls onDismiss for a mousedown outside every container ref", () => {
      const inside = document.createElement("div");
      const outside = document.createElement("div");
      document.body.append(inside, outside);
      const onDismiss = vi.fn();

      renderHook(() => {
        const ref = useRef<HTMLElement>(inside);
        useOutsideDismiss([ref], onDismiss, true);
      });

      act(() => mousedownOn(outside));
      expect(onDismiss).toHaveBeenCalledTimes(1);
    });

    it("prevents the outside mousedown's default action, so it cannot blur focus a dismiss reflex just set", () => {
      const inside = document.createElement("div");
      const outside = document.createElement("div");
      document.body.append(inside, outside);

      renderHook(() => {
        const ref = useRef<HTMLElement>(inside);
        useOutsideDismiss([ref], vi.fn(), true);
      });

      const event = new MouseEvent("mousedown", { bubbles: true, cancelable: true });
      act(() => {
        outside.dispatchEvent(event);
      });
      expect(event.defaultPrevented).toBe(true);
    });

    it("does not call onDismiss for a mousedown inside any container ref", () => {
      const inside = document.createElement("div");
      const child = document.createElement("span");
      inside.append(child);
      document.body.append(inside);
      const onDismiss = vi.fn();

      renderHook(() => {
        const ref = useRef<HTMLElement>(inside);
        useOutsideDismiss([ref], onDismiss, true);
      });

      act(() => mousedownOn(child));
      expect(onDismiss).not.toHaveBeenCalled();
    });

    it("treats a mousedown inside any of several container refs as inside", () => {
      const first = document.createElement("div");
      const second = document.createElement("div");
      document.body.append(first, second);
      const onDismiss = vi.fn();

      renderHook(() => {
        const firstRef = useRef<HTMLElement>(first);
        const secondRef = useRef<HTMLElement>(second);
        useOutsideDismiss([firstRef, secondRef], onDismiss, true);
      });

      act(() => mousedownOn(second));
      expect(onDismiss).not.toHaveBeenCalled();
    });

    it("does not listen while disabled", () => {
      const outside = document.createElement("div");
      document.body.append(outside);
      const onDismiss = vi.fn();

      renderHook(() => {
        const ref = useRef<HTMLElement>(document.createElement("div"));
        useOutsideDismiss([ref], onDismiss, false);
      });

      act(() => mousedownOn(outside));
      expect(onDismiss).not.toHaveBeenCalled();
    });

    it("stops listening after unmount", () => {
      const outside = document.createElement("div");
      document.body.append(outside);
      const onDismiss = vi.fn();

      const { unmount } = renderHook(() => {
        const ref = useRef<HTMLElement>(document.createElement("div"));
        useOutsideDismiss([ref], onDismiss, true);
      });

      unmount();
      act(() => mousedownOn(outside));
      expect(onDismiss).not.toHaveBeenCalled();
    });

    it("dismisses only the most recently opened surface when overlays are nested", () => {
      const outerSurface = document.createElement("div");
      const innerSurface = document.createElement("div");
      const outside = document.createElement("div");
      document.body.append(outerSurface, innerSurface, outside);
      const dismissOuter = vi.fn();
      const dismissInner = vi.fn();

      renderHook(() => {
        const outerRef = useRef<HTMLElement>(outerSurface);
        useOutsideDismiss([outerRef], dismissOuter, true);
      });
      const inner = renderHook(() => {
        const innerRef = useRef<HTMLElement>(innerSurface);
        useOutsideDismiss([innerRef], dismissInner, true);
      });

      // The inner surface's own scrim covers the outer one, so a single outside mousedown
      // must not collapse both layers at once (card detail opened from inside View Context).
      act(() => mousedownOn(outside));
      expect(dismissInner).toHaveBeenCalledTimes(1);
      expect(dismissOuter).not.toHaveBeenCalled();

      inner.unmount();
      act(() => mousedownOn(outside));
      expect(dismissOuter).toHaveBeenCalledTimes(1);
    });

    it("hands dismissal back to the surface below when the top surface is disabled rather than unmounted", () => {
      const outerSurface = document.createElement("div");
      const innerSurface = document.createElement("div");
      const outside = document.createElement("div");
      document.body.append(outerSurface, innerSurface, outside);
      const dismissOuter = vi.fn();
      const dismissInner = vi.fn();

      renderHook(() => {
        const outerRef = useRef<HTMLElement>(outerSurface);
        useOutsideDismiss([outerRef], dismissOuter, true);
      });
      const inner = renderHook(
        ({ enabled }: { enabled: boolean }) => {
          const innerRef = useRef<HTMLElement>(innerSurface);
          useOutsideDismiss([innerRef], dismissInner, enabled);
        },
        { initialProps: { enabled: true } }
      );

      inner.rerender({ enabled: false });
      act(() => mousedownOn(outside));

      expect(dismissInner).not.toHaveBeenCalled();
      expect(dismissOuter).toHaveBeenCalledTimes(1);
    });

    it("always calls the latest onDismiss without re-attaching the listener", () => {
      const outside = document.createElement("div");
      document.body.append(outside);
      const firstOnDismiss = vi.fn();
      const secondOnDismiss = vi.fn();

      const { rerender } = renderHook(
        ({ onDismiss }: { onDismiss: () => void }) => {
          const ref = useRef<HTMLElement>(document.createElement("div"));
          useOutsideDismiss([ref], onDismiss, true);
        },
        { initialProps: { onDismiss: firstOnDismiss } }
      );

      rerender({ onDismiss: secondOnDismiss });
      act(() => mousedownOn(outside));

      expect(firstOnDismiss).not.toHaveBeenCalled();
      expect(secondOnDismiss).toHaveBeenCalledTimes(1);
    });
  });
});
