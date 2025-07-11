import { render, screen, checkA11y } from "../utils/test-utils";
import RootLayout from "../../src/app/layout";

// Mock Next.js metadata
jest.mock("../../src/app/layout", () => {
  const OriginalLayout = jest.requireActual("../../src/app/layout").default;
  return {
    __esModule: true,
    default: OriginalLayout,
    metadata: {
      title: "Fabularius.art - Minimalist Gallery",
      description:
        "A beautiful, minimalist gallery for showcasing art and photography",
    },
  };
});

describe("RootLayout", () => {
  const renderLayout = (
    children: React.ReactNode = <div>Test Content</div>
  ) => {
    return render(<RootLayout>{children}</RootLayout>);
  };

  it("renders the layout with correct structure", () => {
    renderLayout();

    // Check for main structural elements
    expect(screen.getByRole("banner")).toBeInTheDocument(); // header
    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(screen.getByRole("contentinfo")).toBeInTheDocument(); // footer
  });

  it("displays the site title", () => {
    renderLayout();

    expect(
      screen.getByRole("heading", { name: /fabularius\.art/i })
    ).toBeInTheDocument();
  });

  it("displays navigation buttons", () => {
    renderLayout();

    expect(screen.getByRole("button", { name: /albums/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /upload/i })).toBeInTheDocument();
  });

  it("displays footer content", () => {
    renderLayout();

    expect(
      screen.getByText(/© 2024 fabularius\.art\. all rights reserved\./i)
    ).toBeInTheDocument();
  });

  it("renders children content", () => {
    const testContent = "Custom test content";
    renderLayout(<div>{testContent}</div>);

    expect(screen.getByText(testContent)).toBeInTheDocument();
  });

  it("applies dark theme class", () => {
    const { container } = renderLayout();
    const htmlElement = container.querySelector("html");

    expect(htmlElement).toHaveClass("dark");
  });

  it("applies correct font classes", () => {
    const { container } = renderLayout();
    const bodyElement = container.querySelector("body");

    expect(bodyElement).toHaveClass("font-sans", "antialiased");
  });

  it("has proper semantic structure", () => {
    renderLayout();

    // Check for proper heading hierarchy
    const mainHeading = screen.getByRole("heading", { level: 1 });
    expect(mainHeading).toHaveTextContent("Fabularius.art");
  });

  it("navigation buttons have correct styling classes", () => {
    renderLayout();

    const albumsButton = screen.getByRole("button", { name: /albums/i });
    const uploadButton = screen.getByRole("button", { name: /upload/i });

    expect(albumsButton).toHaveClass("btn-secondary");
    expect(uploadButton).toHaveClass("btn-primary");
  });

  it("has responsive container classes", () => {
    const { container } = renderLayout();

    // Check header container
    const headerContainer = container.querySelector("header .container");
    expect(headerContainer).toHaveClass("mx-auto", "px-4", "py-4");

    // Check main container
    const mainContainer = container.querySelector("main");
    expect(mainContainer).toHaveClass("container", "mx-auto", "px-4", "py-8");

    // Check footer container
    const footerContainer = container.querySelector("footer .container");
    expect(footerContainer).toHaveClass("mx-auto", "px-4", "py-8");
  });

  it("has proper border styling", () => {
    const { container } = renderLayout();

    const header = container.querySelector("header");
    const footer = container.querySelector("footer");

    expect(header).toHaveClass("border-b", "border-border");
    expect(footer).toHaveClass("border-t", "border-border");
  });

  it("meets accessibility standards", async () => {
    const { container } = renderLayout();
    await checkA11y(container);
  });

  it("has proper landmark roles", () => {
    renderLayout();

    // Check that all major landmarks are present
    expect(screen.getByRole("banner")).toBeInTheDocument(); // header
    expect(screen.getByRole("navigation")).toBeInTheDocument(); // nav
    expect(screen.getByRole("main")).toBeInTheDocument(); // main
    expect(screen.getByRole("contentinfo")).toBeInTheDocument(); // footer
  });

  it("navigation is keyboard accessible", async () => {
    renderLayout();

    const albumsButton = screen.getByRole("button", { name: /albums/i });
    const uploadButton = screen.getByRole("button", { name: /upload/i });

    // Test tab navigation
    albumsButton.focus();
    expect(albumsButton).toHaveFocus();

    // Simulate tab to next element
    uploadButton.focus();
    expect(uploadButton).toHaveFocus();
  });

  it("handles missing children gracefully", () => {
    expect(() => renderLayout(null)).not.toThrow();
    expect(() => renderLayout(undefined)).not.toThrow();
  });

  it("maintains layout structure with different content", () => {
    const complexContent = (
      <div>
        <h2>Page Title</h2>
        <p>Some content</p>
        <button>Action Button</button>
      </div>
    );

    renderLayout(complexContent);

    // Layout structure should remain intact
    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();

    // Custom content should be rendered
    expect(
      screen.getByRole("heading", { name: /page title/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/some content/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /action button/i })
    ).toBeInTheDocument();
  });

  it("has correct text color classes", () => {
    const { container } = renderLayout();

    const title = screen.getByRole("heading", { name: /fabularius\.art/i });
    const footer = container.querySelector("footer p");

    expect(title).toHaveClass("text-foreground");
    expect(footer).toHaveClass("text-muted-foreground");
  });

  it("has proper spacing classes", () => {
    const { container } = renderLayout();

    const nav = container.querySelector("nav");
    const navItems = container.querySelector("nav .flex:last-child");
    const footer = container.querySelector("footer");

    expect(nav).toHaveClass("flex", "items-center", "justify-between");
    expect(navItems).toHaveClass("space-x-4");
    expect(footer).toHaveClass("mt-16");
  });
});
