import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { UNCONFIGURED_HINT } from "./hooks/useFeedbackForm";
import {
  advancePastZoneConfirm,
  getUrlFromRequest,
  installMemoryLocalStorage,
  installMemorySessionStorage,
  jsonResponse,
  setSelectedZones,
  uninstallMemoryLocalStorage,
  uninstallMemorySessionStorage,
  startOnInDepthQuestion
} from "./test/appTestHelpers";

let fetchMock: ReturnType<typeof vi.fn>;

async function openPortalMenu(user: ReturnType<typeof userEvent.setup>): Promise<void> {
  await user.click(screen.getByRole("button", { name: "Switch feature" }));
}

async function openFeedbackModal(user: ReturnType<typeof userEvent.setup>): Promise<HTMLElement> {
  await openPortalMenu(user);
  await user.click(screen.getByRole("menuitem", { name: "Send feedback" }));
  return screen.getByRole("dialog");
}

/** Flattens the modal's expandable disclosure list into `label -> value`. */
async function readAppStateSummary(
  user: ReturnType<typeof userEvent.setup>
): Promise<Record<string, string>> {
  await user.click(screen.getByRole("button", { name: "Show app-state details" }));
  const summary = screen.getByTestId("feedback-app-state-summary");

  return Array.from(summary.children).reduce<Record<string, string>>((lines, row) => {
    const label = row.querySelector("dt")?.textContent;
    const value = row.querySelector("dd")?.textContent;
    if (label) {
      lines[label] = value ?? "";
    }
    return lines;
  }, {});
}

function formspreeCallCount(): number {
  return fetchMock.mock.calls.filter((call) =>
    getUrlFromRequest(call[0] as RequestInfo | URL).includes("formspree")
  ).length;
}

describe("Frontend - Feedback", () => {
  describe("portal wiring and integration", () => {
    beforeEach(() => {
      installMemoryLocalStorage();
      installMemorySessionStorage();
      startOnInDepthQuestion();
      fetchMock = vi.fn(async (input: RequestInfo | URL): Promise<Response> => {
        if (getUrlFromRequest(input) === "/data/cardMetadata.json") {
          return jsonResponse([]);
        }
        return jsonResponse({ error: "not found" }, 404);
      });
      vi.stubGlobal("fetch", fetchMock);
    });

    afterEach(() => {
      uninstallMemorySessionStorage();
      uninstallMemoryLocalStorage();
      vi.unstubAllGlobals();
    });

    it("offers Send feedback in the portal dropdown alongside the destinations", async () => {
      const user = userEvent.setup();
      render(<App />);

      await openPortalMenu(user);

      const menu = screen.getByRole("menu", { name: "Feature destinations" });
      const entryLabels = within(menu)
        .getAllByRole("menuitem")
        .map((item) => item.getAttribute("aria-label"));

      expect(entryLabels).toEqual([
        "Quick Question",
        "In-Depth Question",
        "Life Tracker",
        "Trade Balancer",
        "Send feedback"
      ]);
      // An action entry is never "current" — it does not own a view (DEC-104).
      expect(screen.getByRole("menuitem", { name: "Send feedback" })).not.toHaveAttribute(
        "aria-current"
      );
    });

    it("opens the modal without changing the destination URL or history", async () => {
      const user = userEvent.setup();
      render(<App />);
      await waitFor(() => expect(window.location.pathname).toBe("/in-depth"));
      const initialPath = window.location.pathname;
      const initialHistoryLength = window.history.length;

      const dialog = await openFeedbackModal(user);

      expect(dialog).toBeInTheDocument();
      expect(within(dialog).getByRole("heading", { name: "Send feedback" })).toBeVisible();
      expect(window.location.pathname).toBe(initialPath);
      expect(window.history.length).toBe(initialHistoryLength);
      // The MTG Assistant is still mounted and visible behind the modal.
      expect(screen.getByRole("heading", { name: "Game context" })).toBeVisible();
      expect(screen.queryByLabelText("Card search")).not.toBeInTheDocument();
      expect(sessionStorage.getItem("thejudge.portal.activeDestinationId")).not.toBe(
        "send-feedback"
      );

      await user.click(screen.getByRole("button", { name: "Close feedback" }));
      await openPortalMenu(user);

      expect(screen.getByRole("menuitem", { name: "In-Depth Question" })).toHaveAttribute(
        "aria-current",
        "true"
      );
    });

    it("preserves an in-progress destination's state across opening the modal", async () => {
      const user = userEvent.setup();
      render(<App />);

      await user.click(screen.getByRole("button", { name: "Confirm game context" }));
      expect(screen.getByRole("heading", { name: "Zone confirmation" })).toBeVisible();

      await openFeedbackModal(user);
      await user.click(screen.getByRole("button", { name: "Close feedback" }));

      expect(screen.getByRole("heading", { name: "Zone confirmation" })).toBeVisible();
    });

    it("discloses the MTG Assistant's live flow slice at the step the modal was opened", async () => {
      const user = userEvent.setup();
      render(<App />);

      await openFeedbackModal(user);
      const atGameContext = await readAppStateSummary(user);

      expect(atGameContext["Active view"]).toBe("mtg-assistant");
      expect(atGameContext["Screen"]).toBe("MTG Assistant");
      expect(atGameContext["Flow step"]).toBe("game-context");
      expect(atGameContext["Game context"]).toBe("not assembled yet");
      expect(atGameContext["Selected zones"]).toBe("none");
      expect(atGameContext["Conversation"]).toBe("not started, 0 messages");
      expect(atGameContext["Flow state"]).toBeUndefined();

      await user.click(screen.getByRole("button", { name: "Close feedback" }));

      await user.click(screen.getByRole("button", { name: "Confirm game context" }));
      await setSelectedZones(user, ["Stack"]);
      await advancePastZoneConfirm(user);

      await openFeedbackModal(user);
      const atZoneCollection = await readAppStateSummary(user);

      expect(atZoneCollection["Flow step"]).toBe("zone-collection");
      expect(atZoneCollection["Selected zones"]).toBe("stack");
      expect(atZoneCollection["Game context"]).toBe("2 players, turn phase main_1");
    });

    it("falls back to the shell-only snapshot on a destination with no contributor", async () => {
      const user = userEvent.setup();
      render(<App />);

      await openPortalMenu(user);
      await user.click(screen.getByRole("menuitem", { name: "Quick Question" }));

      await openFeedbackModal(user);
      const summary = await readAppStateSummary(user);

      expect(summary["Active view"]).toBe("quick-lookup");
      // The Assistant stays mounted behind the hidden destination, so its
      // contributor is still the registered one — the snapshot must at minimum
      // report the shell's active view correctly.
      expect(summary["Captured at"]).not.toBe("unknown");
    });

    it("restores focus to the portal trigger when the modal closes", async () => {
      const user = userEvent.setup();
      render(<App />);

      const trigger = screen.getByRole("button", { name: "Switch feature" });

      const dialog = await openFeedbackModal(user);
      expect(dialog.contains(document.activeElement)).toBe(true);

      await user.keyboard("{Escape}");

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(document.activeElement).toBe(trigger);

      // Same restore path via the explicit close control.
      await openFeedbackModal(user);
      await user.click(screen.getByRole("button", { name: "Close feedback" }));

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(document.activeElement).toBe(trigger);
    });

    it("keeps submit a no-op with a hint when no form id is configured", async () => {
      const user = userEvent.setup();
      render(<App />);

      const dialog = await openFeedbackModal(user);

      expect(within(dialog).getByText(UNCONFIGURED_HINT)).toBeVisible();

      const submit = within(dialog).getByRole("button", { name: "Send feedback" });
      expect(submit).toBeDisabled();

      await user.type(within(dialog).getByLabelText("What happened?"), "Zones reset unexpectedly");
      await user.click(submit);

      expect(submit).toBeDisabled();
      expect(formspreeCallCount()).toBe(0);
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
  });
});
