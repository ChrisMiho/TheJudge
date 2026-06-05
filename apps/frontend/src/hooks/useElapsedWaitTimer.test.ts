import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useElapsedWaitTimer } from "./useElapsedWaitTimer";

describe("useElapsedWaitTimer", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns elapsed 0 and stage at threshold 0 when isSubmitting starts false", () => {
    const { result } = renderHook(() => useElapsedWaitTimer(false));
    expect(result.current.elapsed).toBe(0);
    expect(result.current.stage.threshold).toBe(0);
  });

  it("increments elapsed and updates stage after 3s when submitting", () => {
    const { result } = renderHook(() => useElapsedWaitTimer(true));
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(result.current.elapsed).toBe(3);
    expect(result.current.stage.threshold).toBe(3);
  });

  it("resets elapsed to 0 when isSubmitting becomes false", () => {
    const { result, rerender } = renderHook(({ isSubmitting }) => useElapsedWaitTimer(isSubmitting), {
      initialProps: { isSubmitting: true }
    });
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(result.current.elapsed).toBe(5);

    rerender({ isSubmitting: false });
    expect(result.current.elapsed).toBe(0);
  });

  it("clears interval on unmount while submitting (no leak)", () => {
    const clearIntervalSpy = vi.spyOn(globalThis, "clearInterval");
    const { unmount } = renderHook(() => useElapsedWaitTimer(true));
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    unmount();
    expect(clearIntervalSpy).toHaveBeenCalled();
  });

  it("does not tick when isSubmitting is false throughout", () => {
    const { result } = renderHook(() => useElapsedWaitTimer(false));
    act(() => {
      vi.advanceTimersByTime(10000);
    });
    expect(result.current.elapsed).toBe(0);
  });
});
