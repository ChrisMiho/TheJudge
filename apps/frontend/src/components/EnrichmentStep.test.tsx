import { act, cleanup, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ZoneCardItem } from "../types";
import {
  renderEnrichment,
  renderEnrichmentWithDuplicates,
  renderStatefulEnrichmentWithDuplicates
} from "../test/enrichmentStep";
import {
  getLastDictationInstance,
  installStubSpeechRecognition,
  makeDictationResultsEvent
} from "../test/stubSpeechRecognition";

afterEach(cleanup);

describe("Frontend - MTG Assistant", () => {
describe("EnrichmentStep Send Request label + ready copy (DEC-153)", () => {
  // Look-matching pass (slice N, review 1 fix — finding 3), requirement 9: this
  // composer is now `ComposerPill` — the same icon-only send control every other
  // `ComposerPill` in the app uses (no visible label at any width), retiring
  // DEC-153's visible "Send Request" label for this one composer specifically.
  it("renders the Decrypt Stack control icon-only, matching every other composer pill", async () => {
    const user = renderEnrichment();
    await user.click(screen.getByRole("button", { name: "OK — finish context" }));

    const button = screen.getByRole("button", { name: "Decrypt Stack" });
    expect(button.textContent?.trim()).toBe("");
  });

  it("keeps the Decrypt Stack accessible name distinct from the visible label", async () => {
    const user = renderEnrichment();
    await user.click(screen.getByRole("button", { name: "OK — finish context" }));

    const button = screen.getByRole("button", { name: "Decrypt Stack" });
    expect(button).not.toHaveTextContent("Decrypt Stack");
  });

  it("adds a concise send-button pointer to the ready-state copy when the question is blank", async () => {
    const user = renderEnrichment({ question: "" });

    await user.click(screen.getByRole("button", { name: "OK — finish context" }));

    expect(screen.getByText(/tap Send Request/i)).toBeInTheDocument();
  });

  it("omits the send-button pointer from the ready-state copy when the question is non-blank", async () => {
    const user = renderEnrichment({ question: "Does this resolve?" });

    await user.click(screen.getByRole("button", { name: "OK — finish context" }));

    expect(screen.queryByText(/tap Send Request/i)).not.toBeInTheDocument();
  });

  it("counts the raw bound question value rather than any composed string", async () => {
    const user = renderEnrichment({ question: "Does this resolve?" });
    await user.click(screen.getByRole("button", { name: "OK — finish context" }));

    expect(screen.getByRole("textbox", { name: "Optional question" })).toHaveValue(
      "Does this resolve?"
    );
    expect(screen.getByText("18/300")).toBeInTheDocument();
  });

  // Look-matching pass (slice N, review 1 fix — finding 3): `ComposerPill` hides
  // the count badge entirely at 0 characters (the same rule already shipped for
  // every other `ComposerPill` in the app, e.g. REQ-206's "ring's count is
  // hidden entirely" contract) rather than showing "0/300".
  it("shows no count badge when the bound question value is blank", async () => {
    const user = renderEnrichment({ question: "" });
    await user.click(screen.getByRole("button", { name: "OK — finish context" }));

    expect(screen.queryByText("0/300")).not.toBeInTheDocument();
  });
});

describe("EnrichmentStep compact sheet (REQ-017)", () => {
  it("shows one compact sheet, a counter, and a Skip to review control, with no view-mode toggle", () => {
    renderEnrichment();

    expect(screen.getByText("Card 1 of 1")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Skip to review" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "View all cards" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Card-by-card" })).not.toBeInTheDocument();
  });

  it("Skip to review jumps straight to the review list", async () => {
    const user = renderEnrichment();
    await user.click(screen.getByRole("button", { name: "Skip to review" }));

    expect(screen.getByText(/Review your question.s context\./)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Edit context for Opt" })).toBeInTheDocument();
  });

  it("✎ Edit on the review returns to that card's sheet", async () => {
    const user = renderEnrichment();
    await user.click(screen.getByRole("button", { name: "Skip to review" }));
    await user.click(screen.getByRole("button", { name: "Edit context for Opt" }));

    expect(screen.getByText("Card 1 of 1")).toBeInTheDocument();
  });
});

describe("EnrichmentStep per-instance identity", () => {
  it("editing contextNotes on one duplicate does not affect the other", async () => {
    const onZonesChange = vi.fn();
    const user = renderEnrichmentWithDuplicates(onZonesChange);

    await user.click(screen.getByRole("button", { name: "Add a note for Opt" }));
    await user.type(screen.getByLabelText("Context notes for Opt"), "a");

    const lastCallZones = onZonesChange.mock.calls[onZonesChange.mock.calls.length - 1][0] as {
      stack: ZoneCardItem[];
    };
    expect(lastCallZones.stack[0].instanceId).toBe("inst-1");
    expect(lastCallZones.stack[0].contextNotes).toBeTruthy();
    expect(lastCallZones.stack[1].instanceId).toBe("inst-2");
    expect(lastCallZones.stack[1].contextNotes).toBeUndefined();
  });

  it("the custom-target draft is tracked independently per duplicate card", async () => {
    const user = renderEnrichmentWithDuplicates();

    await user.selectOptions(screen.getByLabelText("Add a target for Opt"), "other:__custom__");
    await user.type(screen.getByLabelText("Describe the target for Opt"), "foo");
    expect(screen.getByLabelText("Describe the target for Opt")).toHaveValue("foo");

    await user.click(screen.getByRole("button", { name: "OK — next card" }));

    expect(screen.getByText("Card 2 of 2")).toBeInTheDocument();
    expect(screen.queryByLabelText("Describe the target for Opt")).not.toBeInTheDocument();
  });
});

describe("EnrichmentStep Targets picker (REQ-021)", () => {
  it("adds a player pick as a removable pill and resets the picker", async () => {
    const user = renderStatefulEnrichmentWithDuplicates();

    await user.selectOptions(screen.getByLabelText("Add a target for Opt"), "player:Player 2");

    expect(screen.getByText("Player: Player 2")).toBeInTheDocument();
    expect(screen.getByLabelText("Add a target for Opt")).toHaveValue("");
  });

  it("No target replaces every other pick", async () => {
    const user = renderStatefulEnrichmentWithDuplicates();

    await user.selectOptions(screen.getByLabelText("Add a target for Opt"), "player:Player 2");
    await user.selectOptions(screen.getByLabelText("Add a target for Opt"), "none");

    expect(screen.queryByText("Player: Player 2")).not.toBeInTheDocument();
    expect(screen.getByText("No specific target")).toBeInTheDocument();
  });

  it("naming every active player folds into All players", async () => {
    const user = renderStatefulEnrichmentWithDuplicates();

    await user.selectOptions(screen.getByLabelText("Add a target for Opt"), "player:Player 1");
    await user.selectOptions(screen.getByLabelText("Add a target for Opt"), "player:Player 2");

    expect(screen.getByText("Other: All players")).toBeInTheDocument();
    expect(screen.queryByText("Player: Player 1")).not.toBeInTheDocument();
  });
});

describe("EnrichmentStep More details — Copies on a Stack card (REQ-211)", () => {
  it("shows a More details row for a Stack card, opening a sheet with a 0-99 Copies stepper defaulting to 0", async () => {
    const user = renderEnrichment();

    const moreDetails = screen.getByRole("button", { name: "More details for Opt" });
    expect(moreDetails).toHaveTextContent("More details");
    expect(moreDetails).not.toHaveTextContent("copies");

    await user.click(moreDetails);

    expect(screen.getByRole("heading", { name: "More details" })).toBeInTheDocument();
    expect(screen.getByText("0")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Decrease copies for Opt" })).toBeDisabled();
  });

  it("increments Copies, labels the row +N copies, and Done closes the sheet", async () => {
    const user = renderStatefulEnrichmentWithDuplicates();

    await user.click(screen.getByRole("button", { name: "More details for Opt" }));
    await user.click(screen.getByRole("button", { name: "Increase copies for Opt" }));
    await user.click(screen.getByRole("button", { name: "Increase copies for Opt" }));
    await user.click(screen.getByRole("button", { name: "Increase copies for Opt" }));

    expect(screen.getByText("3")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Done" }));

    expect(screen.queryByRole("heading", { name: "More details" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "More details for Opt" })).toHaveTextContent(
      "More details · +3 copies"
    );
  });

  it("clamps Copies at 99 and disables the decrease button only at 0", async () => {
    const user = renderStatefulEnrichmentWithDuplicates();

    await user.click(screen.getByRole("button", { name: "More details for Opt" }));
    const increase = screen.getByRole("button", { name: "Increase copies for Opt" });
    const decrease = screen.getByRole("button", { name: "Decrease copies for Opt" });

    for (let i = 0; i < 99; i += 1) {
      await user.click(increase);
    }
    expect(screen.getByText("99")).toBeInTheDocument();
    expect(increase).toBeDisabled();

    await user.click(decrease);
    expect(screen.getByText("98")).toBeInTheDocument();
    expect(decrease).not.toBeDisabled();
  });
});

describe("EnrichmentStep Optional question dictation (REQ-212)", () => {
  let uninstall: () => void;

  beforeEach(() => {
    uninstall = installStubSpeechRecognition();
  });

  afterEach(() => {
    uninstall();
  });

  it("shows a mic control on the Optional question box and inserts recognised text", async () => {
    const onQuestionChange = vi.fn();
    const user = renderEnrichment({ question: "", onQuestionChange });
    await user.click(screen.getByRole("button", { name: "OK — finish context" }));

    const mic = screen.getByTestId("dictation-mic");
    expect(mic).toHaveAccessibleName("Dictate question");
    await user.click(mic);
    expect(getLastDictationInstance().start).toHaveBeenCalledTimes(1);

    act(() => {
      getLastDictationInstance().onresult!(makeDictationResultsEvent(["does trample help"]));
    });

    expect(onQuestionChange).toHaveBeenCalledWith("does trample help");
  });

  it("stops listening when Decrypt Stack is submitted mid-dictation", async () => {
    const user = renderEnrichment({ question: "already typed" });
    await user.click(screen.getByRole("button", { name: "OK — finish context" }));

    await user.click(screen.getByTestId("dictation-mic"));
    await user.click(screen.getByRole("button", { name: "Decrypt Stack" }));

    expect(getLastDictationInstance().stop).toHaveBeenCalledTimes(1);
  });
});
});
