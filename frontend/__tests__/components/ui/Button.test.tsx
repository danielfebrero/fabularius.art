import React from "react";
import { render, screen, user, checkA11y } from "../../utils/test-utils";
import { Button } from "../../../src/components/ui/Button";

describe("Button", () => {
  it("renders with default props", () => {
    render(<Button>Click me</Button>);

    const button = screen.getByRole("button", { name: /click me/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass("bg-primary", "text-primary-foreground");
  });

  it("renders different variants correctly", () => {
    const { rerender } = render(<Button variant="primary">Primary</Button>);
    expect(screen.getByRole("button")).toHaveClass(
      "bg-primary",
      "text-primary-foreground"
    );

    rerender(<Button variant="secondary">Secondary</Button>);
    expect(screen.getByRole("button")).toHaveClass(
      "bg-secondary",
      "text-secondary-foreground"
    );

    rerender(<Button variant="destructive">Destructive</Button>);
    expect(screen.getByRole("button")).toHaveClass(
      "bg-destructive",
      "text-destructive-foreground"
    );
  });

  it("renders different sizes correctly", () => {
    const { rerender } = render(<Button size="sm">Small</Button>);
    expect(screen.getByRole("button")).toHaveClass("h-9", "px-3", "text-sm");

    rerender(<Button size="md">Medium</Button>);
    expect(screen.getByRole("button")).toHaveClass("h-10", "px-4", "py-2");

    rerender(<Button size="lg">Large</Button>);
    expect(screen.getByRole("button")).toHaveClass("h-11", "px-8", "text-lg");
  });

  it("shows loading spinner when loading prop is true", () => {
    render(<Button loading>Loading</Button>);

    expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("is disabled when disabled prop is true", () => {
    render(<Button disabled>Disabled</Button>);

    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    expect(button).toHaveClass(
      "disabled:pointer-events-none",
      "disabled:opacity-50"
    );
  });

  it("handles click events", async () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    const button = screen.getByRole("button");
    await user.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("does not trigger click when disabled", async () => {
    const handleClick = jest.fn();
    render(
      <Button onClick={handleClick} disabled>
        Disabled
      </Button>
    );

    const button = screen.getByRole("button");
    await user.click(button);

    expect(handleClick).not.toHaveBeenCalled();
  });

  it("does not trigger click when loading", async () => {
    const handleClick = jest.fn();
    render(
      <Button onClick={handleClick} loading>
        Loading
      </Button>
    );

    const button = screen.getByRole("button");
    await user.click(button);

    expect(handleClick).not.toHaveBeenCalled();
  });

  it("applies custom className", () => {
    render(<Button className="custom-class">Custom</Button>);

    expect(screen.getByRole("button")).toHaveClass("custom-class");
  });

  it("forwards ref correctly", () => {
    const ref = React.createRef<HTMLButtonElement>();
    render(<Button ref={ref}>Ref test</Button>);

    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    expect(ref.current).toBe(screen.getByRole("button"));
  });

  it("passes through HTML button attributes", () => {
    render(
      <Button
        type="submit"
        data-testid="submit-button"
        aria-label="Submit form"
      >
        Submit
      </Button>
    );

    const button = screen.getByTestId("submit-button");
    expect(button).toHaveAttribute("type", "submit");
    expect(button).toHaveAttribute("aria-label", "Submit form");
  });

  it("has proper focus styles", () => {
    render(<Button>Focus me</Button>);

    const button = screen.getByRole("button");
    expect(button).toHaveClass(
      "focus-visible:outline-none",
      "focus-visible:ring-2"
    );
  });

  it("is keyboard accessible", async () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Keyboard test</Button>);

    const button = screen.getByRole("button");
    button.focus();

    expect(button).toHaveFocus();

    await user.keyboard("{Enter}");
    expect(handleClick).toHaveBeenCalledTimes(1);

    await user.keyboard(" ");
    expect(handleClick).toHaveBeenCalledTimes(2);
  });

  it("meets accessibility standards", async () => {
    const { container } = render(<Button>Accessible button</Button>);
    await checkA11y(container);
  });

  it("has proper ARIA attributes when loading", () => {
    render(<Button loading>Loading</Button>);

    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("disabled");
  });

  it("maintains button semantics with different content", () => {
    render(
      <Button>
        <span>Icon</span>
        <span>Text</span>
      </Button>
    );

    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
    expect(button.querySelector("span")).toBeInTheDocument();
  });

  it("handles rapid clicks appropriately", async () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Rapid click</Button>);

    const button = screen.getByRole("button");

    // Simulate rapid clicks
    await user.click(button);
    await user.click(button);
    await user.click(button);

    expect(handleClick).toHaveBeenCalledTimes(3);
  });

  it("loading state takes precedence over disabled state", () => {
    render(
      <Button loading disabled>
        Loading and disabled
      </Button>
    );

    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
  });

  it("has consistent styling across variants", () => {
    const variants = ["primary", "secondary", "destructive"] as const;

    variants.forEach((variant) => {
      const { unmount } = render(<Button variant={variant}>Test</Button>);
      const button = screen.getByRole("button");

      // All variants should have base classes
      expect(button).toHaveClass(
        "inline-flex",
        "items-center",
        "justify-center",
        "rounded-md"
      );

      unmount();
    });
  });

  it("spinner has correct accessibility attributes", () => {
    render(<Button loading>Loading</Button>);

    const spinner = screen.getByTestId("loading-spinner");
    expect(spinner).toHaveAttribute("xmlns", "http://www.w3.org/2000/svg");
    expect(spinner).toHaveAttribute("fill", "none");
    expect(spinner).toHaveAttribute("viewBox", "0 0 24 24");
  });

  it("maintains proper spacing with loading spinner", () => {
    render(<Button loading>Loading text</Button>);

    const spinner = screen.getByTestId("loading-spinner");
    expect(spinner).toHaveClass("mr-2", "h-4", "w-4", "animate-spin");
  });
});
