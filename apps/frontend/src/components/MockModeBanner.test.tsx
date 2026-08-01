import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { MockModeBanner } from "./MockModeBanner";

const EXACT_COPY = "⚖️ MOCK MODE · the real Judge is off duty — these rulings are pretend";

vi.mock("../lib/env", () => ({
  get isMockProvider() {
    return mockProviderValue;
  }
}));

let mockProviderValue = false;

afterEach(() => {
  mockProviderValue = false;
});

describe("Frontend - MTG Assistant", () => {
describe("MockModeBanner", () => {
  it("renders the exact banner copy when the mock provider is active", () => {
    mockProviderValue = true;
    render(<MockModeBanner />);

    const banner = screen.getByRole("status");
    expect(banner).toHaveTextContent(EXACT_COPY);
  });

  it("is non-dismissible — exposes no close/toggle control", () => {
    mockProviderValue = true;
    render(<MockModeBanner />);

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("renders nothing when the mock provider is inactive", () => {
    mockProviderValue = false;
    const { container } = render(<MockModeBanner />);

    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
});
