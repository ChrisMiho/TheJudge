import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import App from "./App";
import {
  addCardToStack,
  baseCardMetadataFixture,
  clickDecryptStack,
  getUrlFromRequest,
  installMemoryLocalStorage,
  installMemorySessionStorage,
  jsonResponse,
  openStackBuilder,
  uninstallMemoryLocalStorage,
  uninstallMemorySessionStorage,
  startOnInDepthQuestion
} from "./test/appTestHelpers";

const legacyDensityKey = "thejudge.theme.layoutDensity";
const activeDestinationKey = "thejudge.portal.activeDestinationId";
const inDepthAnswer =
  "The stack resolves from the top down. This intentionally long answer verifies that the shared conversation surface retains readable, wrapped content without exposing the hidden fallback question.";
const quickAnswer =
  "Lightning Bolt can target any target permitted by its Oracle text. This intentionally long answer exercises the same shared workspace through Quick Question.";
const quickFollowUpAnswer = "Copying it creates another spell on the stack with independently chosen legal targets.";

const coreTopics = [
  {
    id: "stack-and-priority",
    title: "Stack and Priority",
    ruleNumbers: ["117.1", "405.1"],
    excerpt: "Players use priority to add spells and abilities to the stack."
  }
];

function selectDestination(
  user: ReturnType<typeof userEvent.setup>,
  destinationName: string
): Promise<void> {
  return user
    .click(screen.getByRole("button", { name: "Switch feature" }))
    .then(() => user.click(screen.getByRole("menuitem", { name: destinationName })));
}

describe("Frontend - UI flare chat motion integration", () => {
  let submittedRequests: unknown[];
  let resolveQuickFollowUp: ((response: Response) => void) | undefined;

  beforeEach(() => {
    installMemoryLocalStorage();
    installMemorySessionStorage();
    startOnInDepthQuestion();
    localStorage.setItem(legacyDensityKey, "slim");
    submittedRequests = [];
    resolveQuickFollowUp = undefined;

    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
        const url = getUrlFromRequest(input);

        if (url === "/data/cardMetadata.json") {
          return Promise.resolve(jsonResponse(baseCardMetadataFixture));
        }
        if (url === "/data/gameRulesCoreTopics.json") {
          return Promise.resolve(jsonResponse(coreTopics));
        }
        if (url.endsWith("/api/ask-ai") && init?.method === "POST") {
          const body = JSON.parse(String(init.body)) as Record<string, unknown>;
          submittedRequests.push(body);

          if (submittedRequests.length === 1) {
            return Promise.resolve(jsonResponse({ answer: inDepthAnswer }));
          }
          if (submittedRequests.length === 2) {
            return Promise.resolve(jsonResponse({ answer: quickAnswer }));
          }
          return new Promise<Response>((resolve) => {
            resolveQuickFollowUp = resolve;
          });
        }

        return Promise.resolve(jsonResponse({ error: "not found" }, 404));
      })
    );
  });

  afterEach(() => {
    uninstallMemoryLocalStorage();
    uninstallMemorySessionStorage();
    vi.unstubAllGlobals();
    delete document.documentElement.dataset.theme;
    delete document.documentElement.dataset.layoutDensity;
    document.documentElement.removeAttribute("style");
  });

  it("keeps both real answered flows mounted with their frozen context and orchestration state", async () => {
    const user = userEvent.setup();
    render(<App />);

    await openStackBuilder(user);
    await addCardToStack(user, "opt", "Opt");
    await clickDecryptStack(user);

    expect(await screen.findByText(inDepthAnswer)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "TheJudge" })).toBeInTheDocument();
    expect(screen.queryByText("Resolve the stack")).not.toBeInTheDocument();
    const inDepthTrigger = screen.getByRole("button", {
      name: "View context: Pre Combat Main Phase · 1 populated zone"
    });
    await user.click(inDepthTrigger);
    expect(screen.getByRole("dialog", { name: "Frozen game context" })).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(inDepthTrigger).toHaveFocus();

    await selectDestination(user, "Quick Question");
    expect(sessionStorage.getItem(activeDestinationKey)).toBe("quick-lookup");
    expect(screen.getByRole("heading", { name: "Quick Question" })).toBeInTheDocument();

    await user.type(screen.getByRole("textbox", { name: "Card search" }), "lig");
    await user.click(await screen.findByRole("button", { name: "Lightning Bolt" }));
    const initialQuickQuestion = "Can Lightning Bolt target a planeswalker?";
    await user.type(screen.getByRole("textbox", { name: "Magic question" }), initialQuickQuestion);
    await user.click(screen.getByRole("button", { name: "Ask TheJudge" }));

    expect(await screen.findByText(quickAnswer)).toBeInTheDocument();
    expect(screen.queryByText(initialQuickQuestion)).not.toBeInTheDocument();
    const quickTrigger = screen.getByRole("button", {
      name: "View context: Lightning Bolt"
    });
    await user.click(quickTrigger);
    const cardContextDialog = screen.getByRole("dialog", { name: "Card context" });
    expect(cardContextDialog).toBeInTheDocument();
    // Oracle text is not stacked under the image by default (DEC-151) — it is reached via
    // the suite-wide corner detail popup, including inside this read-only context dialog.
    await user.click(within(cardContextDialog).getByRole("button", { name: "Show details for Lightning Bolt" }));
    expect(cardContextDialog).toHaveTextContent("Lightning Bolt deals 3 damage to any target.");
    await user.click(screen.getByRole("button", { name: "Close card context" }));
    expect(quickTrigger).toHaveFocus();

    const quickWorkspace = screen.getByRole("heading", { name: "Quick Question" })
      .closest("main")
      ?.querySelector<HTMLElement>("[data-conversation-workspace='true']");
    expect(quickWorkspace).not.toBeNull();
    const quickComposer = within(quickWorkspace!).getByRole("textbox", {
      name: "Follow-up question"
    });
    await user.type(quickComposer, "What if I copy it?");
    await user.click(within(quickWorkspace!).getByRole("button", { name: "Send" }));

    await waitFor(() => {
      expect(quickComposer).toBeDisabled();
      expect(quickWorkspace!.querySelector(".send-spinner")).not.toBeNull();
      expect(within(quickWorkspace!).queryByText("Consulting the stack…")).not.toBeInTheDocument();
    });

    await act(async () => {
      resolveQuickFollowUp?.(jsonResponse({ answer: quickFollowUpAnswer }));
    });
    expect(await screen.findByText(quickFollowUpAnswer)).toBeInTheDocument();

    expect(submittedRequests[2]).toMatchObject({
      mode: "lookup",
      question: "What if I copy it?",
      conversationHistory: [
        { role: "user", content: initialQuickQuestion },
        { role: "assistant", content: quickAnswer }
      ]
    });

    await selectDestination(user, "In-Depth Question");
    expect(sessionStorage.getItem(activeDestinationKey)).toBe("mtg-assistant");
    expect(screen.getByText(inDepthAnswer)).toBeVisible();
    expect(screen.getByRole("button", { name: /View context: Pre Combat Main Phase/ })).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Start Over" }));
    expect(screen.getByRole("heading", { name: "Game context" })).toBeInTheDocument();

    await selectDestination(user, "Quick Question");
    expect(screen.getByText(quickFollowUpAnswer)).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Start Over" }));
    expect(screen.queryByRole("heading", { name: "Lightning Bolt" })).not.toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "General rules topics" })).toBeInTheDocument();

    expect(localStorage.getItem(legacyDensityKey)).toBe("slim");
    expect(document.documentElement).not.toHaveAttribute("data-layout-density");
    expect(screen.queryByText("Layout")).not.toBeInTheDocument();
  });
});
