import { describe, expect, it, vi } from "vitest";

import { submitFeedback } from "./submitFeedback";
import type { FeedbackSubmissionPayload } from "./submitFeedback";

const basePayload: FeedbackSubmissionPayload = {
  category: "bug",
  message: "The stack order looked wrong after I responded.",
  appState: '{"screen":"answered"}',
};

function mockFetch(response: Partial<Response>): typeof fetch {
  return vi.fn().mockResolvedValue(response as Response) as unknown as typeof fetch;
}

describe("Frontend - Feedback", () => {
  describe("submitFeedback", () => {
    it("no-ops without any network call when no form id is configured", async () => {
      const fetchImpl = mockFetch({ ok: true, status: 200 });

      const result = await submitFeedback(basePayload, { formspreeId: null, fetchImpl });

      expect(result).toEqual({ status: "unconfigured" });
      expect(fetchImpl).toHaveBeenCalledTimes(0);
    });

    it("posts a JSON payload to the configured formspree endpoint", async () => {
      const fetchImpl = mockFetch({ ok: true, status: 200 });

      const result = await submitFeedback(
        { ...basePayload, email: "player@example.com" },
        { formspreeId: "abcd1234", fetchImpl }
      );

      expect(result).toEqual({ status: "success" });
      expect(fetchImpl).toHaveBeenCalledTimes(1);

      const [url, init] = (fetchImpl as unknown as ReturnType<typeof vi.fn>).mock.calls[0] as [
        string,
        RequestInit,
      ];
      expect(url).toBe("https://formspree.io/f/abcd1234");
      expect(init.method).toBe("POST");
      expect(init.headers).toMatchObject({
        Accept: "application/json",
        "Content-Type": "application/json",
      });
      expect(JSON.parse(init.body as string)).toEqual({
        category: "bug",
        message: basePayload.message,
        email: "player@example.com",
        appState: '{"screen":"answered"}',
      });
    });

    it("omits email from the body when not supplied or blank", async () => {
      const fetchImpl = mockFetch({ ok: true, status: 200 });

      await submitFeedback(basePayload, { formspreeId: "abcd1234", fetchImpl });
      await submitFeedback(
        { ...basePayload, email: "   " },
        { formspreeId: "abcd1234", fetchImpl }
      );

      const calls = (fetchImpl as unknown as ReturnType<typeof vi.fn>).mock.calls;
      for (const [, init] of calls as Array<[string, RequestInit]>) {
        expect(JSON.parse(init.body as string)).not.toHaveProperty("email");
      }
    });

    it("keeps the serialized app state as an opaque string", async () => {
      const fetchImpl = mockFetch({ ok: true, status: 200 });

      await submitFeedback(
        { ...basePayload, appState: '{"nested":{"a":1}}' },
        { formspreeId: "abcd1234", fetchImpl }
      );

      const [, init] = (fetchImpl as unknown as ReturnType<typeof vi.fn>).mock.calls[0] as [
        string,
        RequestInit,
      ];
      const parsed = JSON.parse(init.body as string) as { appState: unknown };
      expect(typeof parsed.appState).toBe("string");
      expect(parsed.appState).toBe('{"nested":{"a":1}}');
    });

    it("reports rate-limit for HTTP 429", async () => {
      const fetchImpl = mockFetch({ ok: false, status: 429 });

      await expect(submitFeedback(basePayload, { formspreeId: "abcd1234", fetchImpl })).resolves.toEqual(
        { status: "rate-limit" }
      );
    });

    it("reports network-error for other non-ok responses", async () => {
      const fetchImpl = mockFetch({ ok: false, status: 500 });

      await expect(submitFeedback(basePayload, { formspreeId: "abcd1234", fetchImpl })).resolves.toEqual(
        { status: "network-error" }
      );
    });

    it("reports network-error when fetch rejects, and never throws", async () => {
      const fetchImpl = vi
        .fn()
        .mockRejectedValue(new Error("offline")) as unknown as typeof fetch;

      await expect(submitFeedback(basePayload, { formspreeId: "abcd1234", fetchImpl })).resolves.toEqual(
        { status: "network-error" }
      );
    });
  });
});
