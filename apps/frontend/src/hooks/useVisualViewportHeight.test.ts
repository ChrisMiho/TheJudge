import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { useVisualViewportHeight } from "./useVisualViewportHeight";

type FakeViewport = EventTarget & { height: number };

function installViewport(height: number): FakeViewport {
  const viewport = Object.assign(new EventTarget(), { height }) as FakeViewport;
  Object.defineProperty(window, "visualViewport", { value: viewport, configurable: true });
  return viewport;
}

afterEach(() => {
  Object.defineProperty(window, "visualViewport", { value: undefined, configurable: true });
});

describe("Frontend - useVisualViewportHeight (REQ-218)", () => {
  it("returns null when visualViewport is unavailable", () => {
    Object.defineProperty(window, "visualViewport", { value: undefined, configurable: true });
    const { result } = renderHook(() => useVisualViewportHeight());
    expect(result.current).toBeNull();
  });

  it("tracks the visual viewport height as it resizes", () => {
    const viewport = installViewport(740);
    const { result } = renderHook(() => useVisualViewportHeight());
    expect(result.current).toBe(740);
    act(() => {
      viewport.height = 420;
      viewport.dispatchEvent(new Event("resize"));
    });
    expect(result.current).toBe(420);
  });

  it("removes its resize listener on unmount", () => {
    const viewport = installViewport(740);
    const { unmount } = renderHook(() => useVisualViewportHeight());
    let removed = 0;
    const original = viewport.removeEventListener.bind(viewport);
    viewport.removeEventListener = ((...args: Parameters<typeof original>) => {
      removed += 1;
      return original(...args);
    }) as typeof viewport.removeEventListener;
    unmount();
    expect(removed).toBe(1);
  });
});
