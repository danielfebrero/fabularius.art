import { render, screen, checkA11y } from "../utils/test-utils";
import HomePage from "../../src/app/page";

describe("HomePage", () => {
  beforeEach(() => {
    render(<HomePage />);
  });

  it("renders the main heading", () => {
    expect(
      screen.getByRole("heading", { name: /welcome to fabularius\.art/i })
    ).toBeInTheDocument();
  });

  it("displays the subtitle description", () => {
    expect(
      screen.getByText(
        /a minimalist gallery for showcasing your art and photography collections/i
      )
    ).toBeInTheDocument();
  });

  it("renders all feature cards", () => {
    expect(
      screen.getByRole("heading", { name: /create albums/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /upload media/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /share & showcase/i })
    ).toBeInTheDocument();
  });

  it("displays feature descriptions", () => {
    expect(
      screen.getByText(
        /organize your artwork into beautiful albums with custom titles and descriptions/i
      )
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        /upload high-quality images with automatic optimization and thumbnail generation/i
      )
    ).toBeInTheDocument();

    expect(
      screen.getByText(/share your albums publicly or keep them private/i)
    ).toBeInTheDocument();
  });

  it("renders the get started button", () => {
    expect(
      screen.getByRole("button", { name: /get started/i })
    ).toBeInTheDocument();
  });

  it("has proper heading hierarchy", () => {
    const mainHeading = screen.getByRole("heading", { level: 1 });
    const featureHeadings = screen.getAllByRole("heading", { level: 3 });

    expect(mainHeading).toHaveTextContent("Welcome to Fabularius.art");
    expect(featureHeadings).toHaveLength(3);
  });

  it("applies correct CSS classes for layout", () => {
    const { container } = render(<HomePage />);
    const mainContainer = container.firstChild;

    expect(mainContainer).toHaveClass("space-y-8");
  });

  it("has responsive grid layout for feature cards", () => {
    const { container } = render(<HomePage />);
    const gridContainer = container.querySelector(".grid");

    expect(gridContainer).toHaveClass(
      "grid",
      "grid-cols-1",
      "md:grid-cols-2",
      "lg:grid-cols-3",
      "gap-6"
    );
  });

  it("feature cards have proper structure", () => {
    const { container } = render(<HomePage />);
    const cards = container.querySelectorAll(".card");

    expect(cards).toHaveLength(3);

    cards.forEach((card) => {
      expect(card).toHaveClass("card");
      expect(card.querySelector(".card-header")).toBeInTheDocument();
      expect(card.querySelector(".card-content")).toBeInTheDocument();
    });
  });

  it("get started button has correct styling", () => {
    const button = screen.getByRole("button", { name: /get started/i });

    expect(button).toHaveClass("btn-primary", "text-lg", "px-8", "py-3");
  });

  it("has centered text alignment for intro and CTA sections", () => {
    const { container } = render(<HomePage />);
    const introSection = container.querySelector(".text-center");
    const ctaSection = container.querySelector(".text-center:last-child");

    expect(introSection).toBeInTheDocument();
    expect(ctaSection).toBeInTheDocument();
  });

  it("subtitle has proper text styling", () => {
    const subtitle = screen.getByText(
      /a minimalist gallery for showcasing your art and photography collections/i
    );

    expect(subtitle).toHaveClass(
      "text-xl",
      "text-muted-foreground",
      "max-w-2xl",
      "mx-auto"
    );
  });

  it("feature card descriptions have muted text color", () => {
    const { container } = render(<HomePage />);
    const descriptions = container.querySelectorAll(".card-content p");

    descriptions.forEach((description) => {
      expect(description).toHaveClass("text-muted-foreground");
    });
  });

  it("meets accessibility standards", async () => {
    const { container } = render(<HomePage />);
    await checkA11y(container);
  });

  it("has proper semantic structure", () => {
    // Main heading should be h1
    const mainHeading = screen.getByRole("heading", { level: 1 });
    expect(mainHeading).toBeInTheDocument();

    // Feature headings should be h3
    const featureHeadings = screen.getAllByRole("heading", { level: 3 });
    expect(featureHeadings).toHaveLength(3);
  });

  it("button is keyboard accessible", () => {
    const button = screen.getByRole("button", { name: /get started/i });

    button.focus();
    expect(button).toHaveFocus();
  });

  it("has proper spacing between sections", () => {
    const { container } = render(<HomePage />);
    const introSection = container.querySelector(".space-y-4");

    expect(introSection).toBeInTheDocument();
    expect(introSection).toHaveClass("space-y-4");
  });

  it("renders without crashing", () => {
    expect(() => render(<HomePage />)).not.toThrow();
  });

  it("contains all expected text content", () => {
    // Check for key phrases that should be present
    expect(screen.getByText(/minimalist gallery/i)).toBeInTheDocument();
    expect(screen.getByText(/create albums/i)).toBeInTheDocument();
    expect(screen.getByText(/upload media/i)).toBeInTheDocument();
    expect(screen.getByText(/share & showcase/i)).toBeInTheDocument();
    expect(screen.getByText(/get started/i)).toBeInTheDocument();
  });

  it("has proper contrast for text elements", () => {
    const mainHeading = screen.getByRole("heading", {
      name: /welcome to fabularius\.art/i,
    });
    const subtitle = screen.getByText(
      /a minimalist gallery for showcasing your art and photography collections/i
    );

    expect(mainHeading).toHaveClass("text-foreground");
    expect(subtitle).toHaveClass("text-muted-foreground");
  });

  it("feature cards have consistent structure", () => {
    const createAlbumsCard = screen
      .getByRole("heading", { name: /create albums/i })
      .closest(".card");
    const uploadMediaCard = screen
      .getByRole("heading", { name: /upload media/i })
      .closest(".card");
    const shareShowcaseCard = screen
      .getByRole("heading", { name: /share & showcase/i })
      .closest(".card");

    expect(createAlbumsCard).toBeInTheDocument();
    expect(uploadMediaCard).toBeInTheDocument();
    expect(shareShowcaseCard).toBeInTheDocument();

    // Each card should have header and content
    expect(createAlbumsCard?.querySelector(".card-header")).toBeInTheDocument();
    expect(
      createAlbumsCard?.querySelector(".card-content")
    ).toBeInTheDocument();
    expect(uploadMediaCard?.querySelector(".card-header")).toBeInTheDocument();
    expect(uploadMediaCard?.querySelector(".card-content")).toBeInTheDocument();
    expect(
      shareShowcaseCard?.querySelector(".card-header")
    ).toBeInTheDocument();
    expect(
      shareShowcaseCard?.querySelector(".card-content")
    ).toBeInTheDocument();
  });

  it("maintains layout integrity with different screen sizes", () => {
    const { container } = render(<HomePage />);
    const gridContainer = container.querySelector(".grid");

    // Should have responsive classes
    expect(gridContainer).toHaveClass("grid-cols-1"); // mobile
    expect(gridContainer).toHaveClass("md:grid-cols-2"); // tablet
    expect(gridContainer).toHaveClass("lg:grid-cols-3"); // desktop
  });
});
