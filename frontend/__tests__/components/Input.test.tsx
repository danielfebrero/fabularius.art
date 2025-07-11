import React from "react";
import { render, screen, user } from "../utils/test-utils";
import { Input } from "../../src/components/ui/Input";

describe("Input Component", () => {
  it("renders basic input", () => {
    render(<Input placeholder="Enter text" />);

    const input = screen.getByPlaceholderText("Enter text");
    expect(input).toBeInTheDocument();
  });

  it("handles value changes", async () => {
    const handleChange = jest.fn();

    render(
      <Input
        placeholder="Enter text"
        value=""
        onChange={handleChange}
        data-testid="test-input"
      />
    );

    const input = screen.getByTestId("test-input");
    await user.type(input, "Hello World");

    expect(handleChange).toHaveBeenCalled();
  });

  it("displays error state", () => {
    render(
      <Input
        placeholder="Enter text"
        error="This field is required"
        data-testid="error-input"
      />
    );

    const input = screen.getByTestId("error-input");
    expect(input).toHaveClass("border-red-500");
    expect(screen.getByText("This field is required")).toBeInTheDocument();
  });

  it("renders with label", () => {
    render(
      <Input
        label="Email Address"
        placeholder="Enter email"
        data-testid="labeled-input"
      />
    );

    expect(screen.getByText("Email Address")).toBeInTheDocument();
    expect(screen.getByLabelText("Email Address")).toBeInTheDocument();
  });

  it("supports different sizes", () => {
    const { rerender } = render(<Input size="sm" data-testid="input" />);

    let input = screen.getByTestId("input");
    expect(input).toHaveClass("h-8");

    rerender(<Input size="lg" data-testid="input" />);

    input = screen.getByTestId("input");
    expect(input).toHaveClass("h-12");
  });

  it("supports different variants", () => {
    const { rerender } = render(
      <Input variant="default" data-testid="input" />
    );

    let input = screen.getByTestId("input");
    expect(input).toHaveClass("border-gray-700");

    rerender(<Input variant="filled" data-testid="input" />);

    input = screen.getByTestId("input");
    expect(input).toHaveClass("bg-gray-800");
  });

  it("handles disabled state", () => {
    render(
      <Input
        disabled
        placeholder="Disabled input"
        data-testid="disabled-input"
      />
    );

    const input = screen.getByTestId("disabled-input");
    expect(input).toBeDisabled();
    expect(input).toHaveClass("opacity-50");
  });

  it("supports required attribute", () => {
    render(
      <Input required label="Required Field" data-testid="required-input" />
    );

    const input = screen.getByTestId("required-input");
    expect(input).toBeRequired();
    expect(screen.getByText("Required Field *")).toBeInTheDocument();
  });

  it("handles focus and blur events", async () => {
    const handleFocus = jest.fn();
    const handleBlur = jest.fn();

    render(
      <Input
        onFocus={handleFocus}
        onBlur={handleBlur}
        data-testid="focus-input"
      />
    );

    const input = screen.getByTestId("focus-input");

    await user.click(input);
    expect(handleFocus).toHaveBeenCalledTimes(1);

    await user.tab();
    expect(handleBlur).toHaveBeenCalledTimes(1);
  });

  it("supports different input types", () => {
    const { rerender } = render(<Input type="email" data-testid="input" />);

    let input = screen.getByTestId("input");
    expect(input).toHaveAttribute("type", "email");

    rerender(<Input type="password" data-testid="input" />);

    input = screen.getByTestId("input");
    expect(input).toHaveAttribute("type", "password");
  });

  it("renders with helper text", () => {
    render(
      <Input
        label="Password"
        helperText="Must be at least 8 characters"
        data-testid="helper-input"
      />
    );

    expect(
      screen.getByText("Must be at least 8 characters")
    ).toBeInTheDocument();
  });

  it("has proper accessibility attributes", () => {
    render(
      <Input
        label="Email"
        error="Invalid email"
        helperText="Enter your email address"
        data-testid="accessible-input"
      />
    );

    const input = screen.getByTestId("accessible-input");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAttribute("aria-describedby");
  });

  it("supports custom className", () => {
    render(<Input className="custom-class" data-testid="custom-input" />);

    const input = screen.getByTestId("custom-input");
    expect(input).toHaveClass("custom-class");
  });
});
