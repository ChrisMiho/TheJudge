import { cleanup, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ZoneCardItem } from "../types";
import { card1, card2, renderEnrichment, renderEnrichmentWithDuplicates } from "../test/enrichmentStep";

afterEach(cleanup);

describe("Frontend - MTG Assistant", () => {
describe("EnrichmentStep Send Request label + ready copy (DEC-153)", () => {
  it("shows a visible 'Send Request' label on the initial decrypt submit control", async () => {
    const user = renderEnrichment();
    await user.click(screen.getByRole("button", { name: "OK — finish enrichment" }));

    const button = screen.getByRole("button", { name: "Decrypt Stack" });
    expect(button).toHaveTextContent("Send Request");
  });

  it("keeps the Decrypt Stack accessible name distinct from the visible label", async () => {
    const user = renderEnrichment();
    await user.click(screen.getByRole("button", { name: "OK — finish enrichment" }));

    const button = screen.getByRole("button", { name: "Decrypt Stack" });
    expect(button).not.toHaveTextContent("Decrypt Stack");
  });

  it("adds a concise send-button pointer to the ready-state copy when the question is blank", async () => {
    const user = renderEnrichment({ question: "" });

    await user.click(screen.getByRole("button", { name: "OK — finish enrichment" }));

    expect(screen.getByText("Ready to decrypt.")).toBeInTheDocument();
    expect(screen.getByText(/tap Send Request/i)).toBeInTheDocument();
  });

  it("omits the send-button pointer from the ready-state copy when the question is non-blank", async () => {
    const user = renderEnrichment({ question: "Does this resolve?" });

    await user.click(screen.getByRole("button", { name: "OK — finish enrichment" }));

    expect(screen.getByText("Ready to decrypt.")).toBeInTheDocument();
    expect(screen.queryByText(/tap Send Request/i)).not.toBeInTheDocument();
  });

  it("counts the raw bound question value rather than any composed string", async () => {
    const user = renderEnrichment({ question: "Does this resolve?" });
    await user.click(screen.getByRole("button", { name: "OK — finish enrichment" }));

    expect(screen.getByRole("textbox", { name: "Optional question" })).toHaveValue(
      "Does this resolve?"
    );
    expect(screen.getByText("18/300")).toBeInTheDocument();
  });

  it("shows an empty count when the bound question value is blank", async () => {
    const user = renderEnrichment({ question: "" });
    await user.click(screen.getByRole("button", { name: "OK — finish enrichment" }));

    expect(screen.getByText("0/300")).toBeInTheDocument();
  });
});

describe("EnrichmentStep per-instance identity", () => {
  it("removing one duplicate card calls onZonesChange with only the other remaining", async () => {
    const onZonesChange = vi.fn();
    const user = renderEnrichmentWithDuplicates(onZonesChange);

    await user.click(screen.getByRole("button", { name: "View all cards" }));

    const removeButtons = screen.getAllByRole("button", { name: "Remove Opt" });
    expect(removeButtons).toHaveLength(2);

    await user.click(removeButtons[0]);

    expect(onZonesChange).toHaveBeenCalledWith({ stack: [card2] });
  });

  it("removing the second duplicate leaves the first intact", async () => {
    const onZonesChange = vi.fn();
    const user = renderEnrichmentWithDuplicates(onZonesChange);

    await user.click(screen.getByRole("button", { name: "View all cards" }));

    const removeButtons = screen.getAllByRole("button", { name: "Remove Opt" });
    await user.click(removeButtons[1]);

    expect(onZonesChange).toHaveBeenCalledWith({ stack: [card1] });
  });

  it("editing contextNotes on one duplicate does not affect the other", async () => {
    const onZonesChange = vi.fn();
    const user = renderEnrichmentWithDuplicates(onZonesChange);

    await user.click(screen.getByRole("button", { name: "View all cards" }));

    const notesTextareas = screen.getAllByLabelText("Context notes for Opt");
    expect(notesTextareas).toHaveLength(2);

    await user.type(notesTextareas[0], "a");

    const lastCallZones = onZonesChange.mock.calls[onZonesChange.mock.calls.length - 1][0] as {
      stack: ZoneCardItem[];
    };
    expect(lastCallZones.stack[0].instanceId).toBe("inst-1");
    expect(lastCallZones.stack[0].contextNotes).toBeTruthy();
    expect(lastCallZones.stack[1].instanceId).toBe("inst-2");
    expect(lastCallZones.stack[1].contextNotes).toBeUndefined();
  });

  it("pending-target kind state is tracked independently per duplicate row", async () => {
    const user = renderEnrichmentWithDuplicates();

    await user.click(screen.getByRole("button", { name: "View all cards" }));

    const targetKindSelects = screen.getAllByLabelText("Target kind for Opt");
    expect(targetKindSelects).toHaveLength(2);

    await user.selectOptions(targetKindSelects[0], "none");

    expect(targetKindSelects[1]).toHaveValue("player");
  });
});
});
