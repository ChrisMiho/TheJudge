import { cleanup, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ZoneCardItem } from "../types";
import {
  renderEnrichment,
  renderEnrichmentWithDuplicates,
  renderStatefulEnrichmentWithDuplicates
} from "../test/enrichmentStep";

afterEach(cleanup);

describe("Frontend - MTG Assistant", () => {
describe("EnrichmentStep Send Request label + ready copy (DEC-153)", () => {
  it("shows a visible 'Send Request' label on the initial decrypt submit control", async () => {
    const user = renderEnrichment();
    await user.click(screen.getByRole("button", { name: "OK — finish context" }));

    const button = screen.getByRole("button", { name: "Decrypt Stack" });
    expect(button).toHaveTextContent("Send Request");
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

  it("shows an empty count when the bound question value is blank", async () => {
    const user = renderEnrichment({ question: "" });
    await user.click(screen.getByRole("button", { name: "OK — finish context" }));

    expect(screen.getByText("0/300")).toBeInTheDocument();
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
});
