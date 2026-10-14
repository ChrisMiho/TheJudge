import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import {
  getUrlFromRequest,
  installMemoryLocalStorage,
  installMemorySessionStorage,
  jsonResponse,
  navigateToPath,
  uninstallMemoryLocalStorage,
  uninstallMemorySessionStorage
} from "./test/appTestHelpers";

type User = ReturnType<typeof userEvent.setup>;

async function tapTitle(user: User, times: number): Promise<void> {
  const title = screen.getByRole("button", { name: "TheJudge" });
  for (let i = 0; i < times; i++) {
    await user.click(title);
  }
}

async function openFromMenu(user: User, label: string): Promise<void> {
  await user.click(screen.getByRole("button", { name: "Switch feature" }));
  await user.click(screen.getByRole("menuitem", { name: label }));
}

const catPicture = (): HTMLElement | null => screen.queryByRole("img", { name: "Cat wizard" });

describe("Frontend - Portal", () => {
  describe("REQ-203 cat-wizard Easter egg across screens", () => {
    beforeEach(() => {
      installMemoryLocalStorage();
      installMemorySessionStorage();
      window.history.replaceState(null, "", "/quick-lookup");
      vi.stubGlobal(
        "fetch",
        vi.fn(async (input: RequestInfo | URL): Promise<Response> => {
          if (getUrlFromRequest(input) === "/data/cardMetadata.json") {
            return jsonResponse([]);
          }
          return jsonResponse({ error: "not found" }, 404);
        })
      );
    });

    afterEach(() => {
      uninstallMemorySessionStorage();
      uninstallMemoryLocalStorage();
      vi.unstubAllGlobals();
    });

    it("A5: nine taps show nothing; the tenth shows the picture", async () => {
      const user = userEvent.setup();
      render(<App />);
      expect(await screen.findByRole("heading", { name: "Ask a Question" })).toBeVisible();

      await tapTitle(user, 9);
      expect(catPicture()).not.toBeInTheDocument();
      await tapTitle(user, 1);
      expect(catPicture()).toHaveAttribute("src", "/assets/cats-homescreen.png");
    });

    it("A1: the count adds up across two different screens", async () => {
      const user = userEvent.setup();
      render(<App />);
      expect(await screen.findByRole("heading", { name: "Ask a Question" })).toBeVisible();

      await tapTitle(user, 4);
      await openFromMenu(user, "Trade Balancer");
      expect(await screen.findByRole("heading", { name: "Trade Balancer" })).toBeVisible();
      await tapTitle(user, 5);
      expect(catPicture()).not.toBeInTheDocument();
      await tapTitle(user, 1);
      expect(catPicture()).toBeInTheDocument();
    });

    it("A2: the reveal holds after a destination switch, including In-depth and Life Tracker rules (A4)", async () => {
      const user = userEvent.setup();
      render(<App />);
      expect(await screen.findByRole("heading", { name: "Ask a Question" })).toBeVisible();
      await tapTitle(user, 10);
      expect(catPicture()).toBeInTheDocument();

      await openFromMenu(user, "Trade Balancer");
      expect(await screen.findByRole("heading", { name: "Trade Balancer" })).toBeVisible();
      expect(catPicture()).toBeInTheDocument();

      await navigateToPath("/in-depth");
      expect(await screen.findByRole("heading", { name: "Game context" })).toBeVisible();
      expect(catPicture()).toBeInTheDocument();

      // A4: Life Tracker keeps a plain title - no tap target, no picture.
      await openFromMenu(user, "Life Tracker");
      await waitFor(() => expect(screen.getByRole("heading", { name: "TheJudge" })).toBeVisible());
      expect(screen.queryByRole("button", { name: "TheJudge" })).not.toBeInTheDocument();
      expect(catPicture()).not.toBeInTheDocument();
    });

    it("A4: taps never count on Life Tracker", async () => {
      const user = userEvent.setup();
      render(<App />);
      expect(await screen.findByRole("heading", { name: "Ask a Question" })).toBeVisible();
      await tapTitle(user, 9);

      await openFromMenu(user, "Life Tracker");
      const title = await screen.findByRole("heading", { name: "TheJudge" });
      for (let i = 0; i < 3; i++) {
        await user.click(title);
      }
      await openFromMenu(user, "Ask a Question");
      expect(catPicture()).not.toBeInTheDocument();
      await tapTitle(user, 1);
      expect(catPicture()).toBeInTheDocument();
    });

    it("A3: a fresh mount (reload) starts hidden", async () => {
      const user = userEvent.setup();
      const first = render(<App />);
      expect(await screen.findByRole("heading", { name: "Ask a Question" })).toBeVisible();
      await tapTitle(user, 10);
      expect(catPicture()).toBeInTheDocument();
      first.unmount();

      render(<App />);
      expect(await screen.findByRole("heading", { name: "Ask a Question" })).toBeVisible();
      expect(catPicture()).not.toBeInTheDocument();
    });

    it("A6: the picture follows the banner header and precedes the page content", async () => {
      const user = userEvent.setup();
      render(<App />);
      expect(await screen.findByRole("heading", { name: "Ask a Question" })).toBeVisible();
      await tapTitle(user, 10);

      const expectPlacement = (): void => {
        const cat = catPicture() as HTMLElement;
        const shell = cat.closest("main") as HTMLElement;
        const header = shell.querySelector("header.app-header") as HTMLElement;
        const content = shell.querySelector(".page-content") as HTMLElement;
        expect(header.compareDocumentPosition(cat) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
        expect(cat.compareDocumentPosition(content) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      };
      expectPlacement();

      await openFromMenu(user, "Trade Balancer");
      expect(await screen.findByRole("heading", { name: "Trade Balancer" })).toBeVisible();
      expectPlacement();
    });
  });
});
