import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { ZoneCardItem } from "../types";
import { card, renderEnrichment } from "../test/enrichmentStep";
import { CardSelectionPreview } from "./CardSelectionPreview";

afterEach(cleanup);

describe("Frontend - MTG Assistant", () => {
describe("Card state motion cues", () => {
  it("animates a newly selected card preview", () => {
    render(
      <CardSelectionPreview
        card={card as Required<ZoneCardItem>}
        contextTitle="Stack card"
        contextContent={null}
      />
    );

    expect(screen.getByRole("article")).toHaveClass("motion-enter");
  });

  it("adds entrance and remove-exit hooks to enrichment rows", () => {
    renderEnrichment();

    fireEvent.click(screen.getByRole("button", { name: "View all cards" }));
    const removeButton = screen.getByRole("button", { name: "Remove Opt" });
    expect(removeButton.closest(".enrichment-card-row")).toHaveClass(
      "enrichment-card-enter",
      "card-state-remove"
    );
    expect(removeButton).toHaveClass("card-state-remove-trigger");
  });

  it("cues existing success and error messages without changing their content", () => {
    renderEnrichment({ error: "Request failed", statusMessage: "Context saved" });

    expect(screen.getByText("Request failed").parentElement).toHaveClass("motion-error");
    expect(screen.getByText("Context saved")).toHaveClass("motion-success");
  });

  it("uses shared tokens for remove feedback and suppresses it under reduced motion", () => {
    const css = readFileSync(resolve(process.cwd(), "src/index.css"), "utf8");

    expect(css).toMatch(
      /\.card-state-remove:has\(\.card-state-remove-trigger:active\)[^{]*\{[^}]*animation:\s*motion-exit var\(--motion-fast\) var\(--motion-ease-out\) both/
    );
    const reducedMotion = css.slice(css.indexOf("@media (prefers-reduced-motion: reduce)"));
    expect(reducedMotion).toContain(".card-state-remove");
  });
});
});
