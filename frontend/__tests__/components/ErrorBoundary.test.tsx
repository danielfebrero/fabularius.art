import React from "react";
import { render, screen, user } from "../utils/test-utils";
import { ErrorBoundary } from "../../src/components/ErrorBoundary";

// Component that throws an error for testing
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error("Test error");
  }
  return <div>No error</div>;
};

// Mock console.error to avoid noise in test output
const originalError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalError;
});

describe("ErrorBoundary Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders children when there is no error", () => {
    render(
      <ErrorBoundary>
        <div>Test content</div>
      </ErrorBoundary>
    );

    expect(screen.getByText("Test content")).toBeInTheDocument();
  });

  it("renders error UI when child component throws", () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(screen.getByText("Test error")).toBeInTheDocument();
  });

  it("renders custom error message when provided", () => {
    render(
      <ErrorBoundary fallback={<div>Custom error message</div>}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText("Custom error message")).toBeInTheDocument();
  });

  it("renders error with retry button", () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText("Try again")).toBeInTheDocument();
  });

  it("resets error state when retry button is clicked", async () => {
    const { rerender } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Error should be displayed
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();

    // Click retry button
    const retryButton = screen.getByText("Try again");
    await user.click(retryButton);

    // Re-render with no error
    rerender(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText("No error")).toBeInTheDocument();
  });

  it("logs error to console", () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(console.error).toHaveBeenCalled();
  });

  it("calls onError callback when provided", () => {
    const onError = jest.fn();

    render(
      <ErrorBoundary onError={onError}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String),
      })
    );
  });

  it("renders different UI for different error types", () => {
    const NetworkError = () => {
      const error = new Error("Network error");
      error.name = "NetworkError";
      throw error;
    };

    render(
      <ErrorBoundary>
        <NetworkError />
      </ErrorBoundary>
    );

    expect(screen.getByText("Network error")).toBeInTheDocument();
    expect(
      screen.getByText("Check your internet connection")
    ).toBeInTheDocument();
  });

  it("handles errors in event handlers gracefully", () => {
    const ErrorButton = () => {
      const handleClick = () => {
        throw new Error("Event handler error");
      };

      return <button onClick={handleClick}>Click me</button>;
    };

    render(
      <ErrorBoundary>
        <ErrorButton />
      </ErrorBoundary>
    );

    // Error boundary doesn't catch errors in event handlers
    // Component should still render normally
    expect(screen.getByText("Click me")).toBeInTheDocument();
  });

  it("provides error details in development mode", () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText("Error Details")).toBeInTheDocument();
    expect(screen.getByText(/componentStack/)).toBeInTheDocument();

    process.env.NODE_ENV = originalEnv;
  });

  it("hides error details in production mode", () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.queryByText("Error Details")).not.toBeInTheDocument();

    process.env.NODE_ENV = originalEnv;
  });

  it("renders with proper accessibility attributes", () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const errorContainer = screen.getByRole("alert");
    expect(errorContainer).toBeInTheDocument();
    expect(errorContainer).toHaveAttribute("aria-live", "assertive");
  });

  it("supports custom error reporting", () => {
    const reportError = jest.fn();

    render(
      <ErrorBoundary onError={reportError}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(reportError).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Test error",
      }),
      expect.any(Object)
    );
  });

  it("resets when key prop changes", () => {
    const { rerender } = render(
      <ErrorBoundary resetKeys={["key1"]}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Error should be displayed
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();

    // Change reset key
    rerender(
      <ErrorBoundary resetKeys={["key2"]}>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    // Error should be reset
    expect(screen.getByText("No error")).toBeInTheDocument();
  });
});
