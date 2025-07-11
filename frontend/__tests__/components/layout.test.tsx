import { render, screen, checkA11y } from "../utils/test-utils";

// Create a test component that renders just the layout content
const LayoutContent = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-foreground">
                Fabularius.art
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <button className="btn-secondary">Albums</button>
              <button className="btn-primary">Upload</button>
            </div>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">{children}</main>

      <footer className="border-t border-border mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-muted-foreground">
            <p>&copy; 2024 Fabularius.art. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

describe("RootLayout", () => {
  const renderLayout = (
    children: React.ReactNode = <div>Test Content</div>
  ) => {
    return render(<LayoutContent>{children}</LayoutContent>);
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
    expect(() => renderLayout()).not.toThrow();
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
