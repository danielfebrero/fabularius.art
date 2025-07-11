import React from "react";
import { render, screen, user } from "../utils/test-utils";
import { Card } from "../../src/components/ui/Card";

describe("Card Component", () => {
  it("renders basic card with content", () => {
    render(
      <Card>
        <div>Card content</div>
      </Card>
    );

    expect(screen.getByText("Card content")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    render(
      <Card className="custom-class">
        <div>Content</div>
      </Card>
    );

    const card = screen.getByText("Content").parentElement;
    expect(card).toHaveClass("custom-class");
  });

  it("renders clickable card with onClick handler", async () => {
    const handleClick = jest.fn();

    render(
      <Card onClick={handleClick} data-testid="clickable-card">
        <div>Clickable content</div>
      </Card>
    );

    const card = screen.getByTestId("clickable-card");
    await user.click(card);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("supports keyboard navigation when clickable", async () => {
    const handleClick = jest.fn();

    render(
      <Card onClick={handleClick} data-testid="clickable-card">
        <div>Clickable content</div>
      </Card>
    );

    const card = screen.getByTestId("clickable-card");
    card.focus();
    await user.keyboard("{Enter}");

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("has proper accessibility attributes when clickable", () => {
    render(
      <Card onClick={() => {}} data-testid="clickable-card">
        <div>Clickable content</div>
      </Card>
    );

    const card = screen.getByTestId("clickable-card");
    expect(card).toHaveAttribute("role", "button");
    expect(card).toHaveAttribute("tabIndex", "0");
  });

  it("renders with different variants", () => {
    const { rerender } = render(
      <Card variant="default" data-testid="card">
        <div>Content</div>
      </Card>
    );

    let card = screen.getByTestId("card");
    expect(card).toHaveClass("bg-gray-900");

    rerender(
      <Card variant="outlined" data-testid="card">
        <div>Content</div>
      </Card>
    );

    card = screen.getByTestId("card");
    expect(card).toHaveClass("border-gray-700");
  });

  it("renders with different sizes", () => {
    const { rerender } = render(
      <Card size="sm" data-testid="card">
        <div>Content</div>
      </Card>
    );

    let card = screen.getByTestId("card");
    expect(card).toHaveClass("p-3");

    rerender(
      <Card size="lg" data-testid="card">
        <div>Content</div>
      </Card>
    );

    card = screen.getByTestId("card");
    expect(card).toHaveClass("p-8");
  });

  it("handles hover states correctly", async () => {
    render(
      <Card onClick={() => {}} data-testid="hoverable-card">
        <div>Hoverable content</div>
      </Card>
    );

    const card = screen.getByTestId("hoverable-card");
    await user.hover(card);

    expect(card).toHaveClass("hover:bg-gray-800");
  });

  it("passes through data attributes", () => {
    render(
      <Card data-testid="test-card" data-custom="value">
        <div>Content</div>
      </Card>
    );

    const card = screen.getByTestId("test-card");
    expect(card).toHaveAttribute("data-custom", "value");
  });
});
