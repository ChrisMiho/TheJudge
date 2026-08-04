import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  EMAIL_FORMAT_ERROR,
  MESSAGE_REQUIRED_ERROR,
  useFeedbackForm,
  type FeedbackSubmitFn
} from "./useFeedbackForm";
import type { FeedbackContext } from "../lib/feedback/types";

function createContext(): FeedbackContext {
  return {
    activeDestinationId: "mtg-assistant",
    providerMode: "mock",
    environment: {
      userAgent: "Mozilla/5.0 (Test Runner)",
      viewport: { width: 1280, height: 720 },
      route: "/",
      timestamp: 1_700_000_000_000,
      capturedAt: "2023-11-14T22:13:20.000Z",
      buildMode: "test",
      appVersion: "0.0.1"
    },
    flow: { screen: "MTG Assistant", flowStep: "enrichment" }
  };
}

function renderForm(overrides: {
  formspreeId?: string | null;
  submitImpl?: FeedbackSubmitFn;
  getFeedbackContext?: () => FeedbackContext;
} = {}) {
  const submitImpl =
    overrides.submitImpl ?? (vi.fn(async () => ({ status: "success" as const })) as FeedbackSubmitFn);
  const getFeedbackContext = overrides.getFeedbackContext ?? (() => createContext());

  const view = renderHook(() =>
    useFeedbackForm({
      getFeedbackContext,
      formspreeId: overrides.formspreeId === undefined ? "abc123" : overrides.formspreeId,
      submitImpl
    })
  );

  return { ...view, submitImpl };
}

describe("useFeedbackForm", () => {
  it("starts on the bug category with empty fields and no visible errors", () => {
    const { result } = renderForm();

    expect(result.current.category).toBe("bug");
    expect(result.current.message).toBe("");
    expect(result.current.email).toBe("");
    expect(result.current.status).toBe("idle");
    expect(result.current.messageError).toBeNull();
    expect(result.current.emailError).toBeNull();
  });

  it("blocks submit and surfaces an inline error for a whitespace-only message", async () => {
    const { result, submitImpl } = renderForm();

    act(() => result.current.setMessage("   \n  "));
    await act(async () => {
      await result.current.submit();
    });

    expect(submitImpl).not.toHaveBeenCalled();
    expect(result.current.messageError).toBe(MESSAGE_REQUIRED_ERROR);
    expect(result.current.status).toBe("idle");
  });

  it("blocks submit for a malformed email but allows a blank one", async () => {
    const { result, submitImpl } = renderForm();

    act(() => {
      result.current.setMessage("The stack resolved in the wrong order.");
      result.current.setEmail("not-an-email");
    });
    await act(async () => {
      await result.current.submit();
    });

    expect(submitImpl).not.toHaveBeenCalled();
    expect(result.current.emailError).toBe(EMAIL_FORMAT_ERROR);

    act(() => result.current.setEmail("   "));
    await act(async () => {
      await result.current.submit();
    });

    expect(submitImpl).toHaveBeenCalledTimes(1);
    expect(result.current.emailError).toBeNull();
  });

  it("sends a trimmed payload with the serialized snapshot and reaches success", async () => {
    const submitImpl = vi.fn(async () => ({ status: "success" as const })) as FeedbackSubmitFn;
    const { result } = renderForm({ submitImpl });

    act(() => {
      result.current.setCategory("suggestion");
      result.current.setMessage("  Add a dark mode toggle.  ");
      result.current.setEmail("  player@example.com  ");
    });

    const serialized = result.current.serializedAppState;

    await act(async () => {
      await result.current.submit();
    });

    expect(submitImpl).toHaveBeenCalledWith(
      {
        category: "suggestion",
        message: "Add a dark mode toggle.",
        email: "player@example.com",
        appState: serialized
      },
      { formspreeId: "abc123" }
    );
    expect(JSON.parse(serialized)).toEqual(createContext());
    await waitFor(() => expect(result.current.status).toBe("success"));
  });

  it("omits the email field entirely when it is blank", async () => {
    const submitImpl = vi.fn(async () => ({ status: "success" as const })) as FeedbackSubmitFn;
    const { result } = renderForm({ submitImpl });

    act(() => result.current.setMessage("Something broke."));
    await act(async () => {
      await result.current.submit();
    });

    expect(submitImpl).toHaveBeenCalledTimes(1);
    expect(vi.mocked(submitImpl).mock.calls[0]?.[0]).not.toHaveProperty("email");
  });

  it("moves through sending on the way to success", async () => {
    let resolveSubmit: ((result: { status: "success" }) => void) | undefined;
    const submitImpl = vi.fn(
      () =>
        new Promise<{ status: "success" }>((resolve) => {
          resolveSubmit = resolve;
        })
    ) as unknown as FeedbackSubmitFn;
    const { result } = renderForm({ submitImpl });

    act(() => result.current.setMessage("Something broke."));

    let pending: Promise<void> | undefined;
    act(() => {
      pending = result.current.submit();
    });

    await waitFor(() => expect(result.current.status).toBe("sending"));

    await act(async () => {
      resolveSubmit?.({ status: "success" });
      await pending;
    });

    expect(result.current.status).toBe("success");
  });

  it("preserves the draft and reports the failure when delivery fails", async () => {
    const submitImpl = vi.fn(async () => ({ status: "network-error" as const })) as FeedbackSubmitFn;
    const { result } = renderForm({ submitImpl });

    act(() => {
      result.current.setCategory("other");
      result.current.setMessage("Everything is on fire.");
      result.current.setEmail("player@example.com");
    });
    await act(async () => {
      await result.current.submit();
    });

    expect(result.current.status).toBe("error");
    expect(result.current.failureStatus).toBe("network-error");
    expect(result.current.category).toBe("other");
    expect(result.current.message).toBe("Everything is on fire.");
    expect(result.current.email).toBe("player@example.com");
    expect(result.current.canSubmit).toBe(true);
  });

  it("reports a rate-limit failure distinctly", async () => {
    const submitImpl = vi.fn(async () => ({ status: "rate-limit" as const })) as FeedbackSubmitFn;
    const { result } = renderForm({ submitImpl });

    act(() => result.current.setMessage("Too fast."));
    await act(async () => {
      await result.current.submit();
    });

    expect(result.current.failureStatus).toBe("rate-limit");
  });

  it("never invokes delivery when no form id is configured", async () => {
    const { result, submitImpl } = renderForm({ formspreeId: null });

    act(() => result.current.setMessage("Something broke."));
    await act(async () => {
      await result.current.submit();
    });

    expect(result.current.isUnconfigured).toBe(true);
    expect(result.current.canSubmit).toBe(false);
    expect(submitImpl).not.toHaveBeenCalled();
    expect(result.current.status).toBe("idle");
  });

  it("captures the snapshot once, so later app-state changes cannot desync summary and payload", () => {
    let callCount = 0;
    const getFeedbackContext = (): FeedbackContext => {
      callCount += 1;
      const context = createContext();
      context.activeDestinationId = `call-${callCount}`;
      return context;
    };

    const { result, rerender } = renderForm({ getFeedbackContext });
    const first = result.current.snapshot;

    rerender();
    act(() => result.current.setMessage("Something broke."));

    expect(callCount).toBe(1);
    expect(result.current.snapshot).toBe(first);
    expect(JSON.parse(result.current.serializedAppState)).toEqual(first);
  });
});
