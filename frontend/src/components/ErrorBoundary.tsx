import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "./ui/Button";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetKeys?: Array<string | number>;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  private resetTimeoutId: number | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });

    // Call the onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  componentDidUpdate(prevProps: Props) {
    const { resetKeys } = this.props;
    const { hasError } = this.state;

    // Reset error state if resetKeys have changed
    if (hasError && prevProps.resetKeys !== resetKeys) {
      if (resetKeys && prevProps.resetKeys) {
        const hasResetKeyChanged = resetKeys.some(
          (key, index) => key !== prevProps.resetKeys![index]
        );
        if (hasResetKeyChanged) {
          this.resetErrorBoundary();
        }
      }
    }
  }

  resetErrorBoundary = () => {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }

    this.resetTimeoutId = window.setTimeout(() => {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
      });
    }, 0);
  };

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  render() {
    const { hasError, error, errorInfo } = this.state;
    const { children, fallback } = this.props;

    if (hasError) {
      // Custom fallback UI
      if (fallback) {
        return fallback;
      }

      // Default error UI
      return (
        <div
          className="min-h-screen bg-gray-900 flex items-center justify-center p-4"
          role="alert"
          aria-live="assertive"
        >
          <div className="max-w-md w-full bg-gray-800 rounded-lg p-6 text-center">
            <div className="mb-4">
              <svg
                className="mx-auto h-12 w-12 text-red-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>

            <h2 className="text-xl font-semibold text-white mb-2">
              Something went wrong
            </h2>

            {error && (
              <p className="text-gray-300 mb-4">
                {this.getErrorMessage(error)}
              </p>
            )}

            {this.getErrorTypeMessage(error)}

            <Button
              onClick={this.resetErrorBoundary}
              variant="primary"
              className="mb-4"
            >
              Try again
            </Button>

            {/* Show error details in development */}
            {process.env.NODE_ENV === "development" && error && errorInfo && (
              <details className="mt-4 text-left">
                <summary className="text-sm text-gray-400 cursor-pointer mb-2">
                  Error Details
                </summary>
                <div className="bg-gray-900 rounded p-3 text-xs text-gray-300 overflow-auto max-h-40">
                  <div className="mb-2">
                    <strong>Error:</strong> {error.toString()}
                  </div>
                  <div>
                    <strong>Component Stack:</strong>
                    <pre className="whitespace-pre-wrap mt-1">
                      {errorInfo.componentStack}
                    </pre>
                  </div>
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return children;
  }

  private getErrorMessage(error: Error | null): string {
    if (!error) return "An unexpected error occurred";

    // Handle specific error types
    if (error.name === "ChunkLoadError") {
      return "Failed to load application resources. Please refresh the page.";
    }

    if (error.name === "NetworkError") {
      return error.message;
    }

    return error.message || "An unexpected error occurred";
  }

  private getErrorTypeMessage(error: Error | null) {
    if (!error) return null;

    if (error.name === "NetworkError") {
      return (
        <p className="text-sm text-gray-400 mb-4">
          Check your internet connection
        </p>
      );
    }

    if (error.name === "ChunkLoadError") {
      return (
        <p className="text-sm text-gray-400 mb-4">
          This usually happens after an app update. Refreshing should fix it.
        </p>
      );
    }

    return null;
  }
}
