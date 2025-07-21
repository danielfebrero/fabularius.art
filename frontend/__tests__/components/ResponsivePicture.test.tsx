import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import ResponsivePicture from "../../src/components/ui/ResponsivePicture";
import { ThumbnailUrls } from "../../src/types/index";

describe("ResponsivePicture", () => {
  const mockThumbnailUrls: ThumbnailUrls = {
    cover: "https://example.com/cover.jpg",
    small: "https://example.com/small.jpg",
    medium: "https://example.com/medium.jpg",
    large: "https://example.com/large.jpg",
    xlarge: "https://example.com/xlarge.jpg",
  };

  const fallbackUrl = "https://example.com/fallback.jpg";

  it("renders picture element with mobile-first default", () => {
    render(
      <ResponsivePicture
        thumbnailUrls={mockThumbnailUrls}
        fallbackUrl={fallbackUrl}
        alt="Test image"
        context="discover"
      />
    );

    const picture = screen.getByRole("img").closest("picture");
    expect(picture).toBeInTheDocument();

    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("src", mockThumbnailUrls.xlarge); // Mobile-first default
    expect(img).toHaveAttribute("alt", "Test image");
  });

  it("generates correct sources for discover context", () => {
    render(
      <ResponsivePicture
        thumbnailUrls={mockThumbnailUrls}
        fallbackUrl={fallbackUrl}
        alt="Test image"
        context="discover"
      />
    );

    const sources = document.querySelectorAll("source");
    expect(sources).toHaveLength(2);

    // Very large screens get medium (300px)
    expect(sources[0]).toHaveAttribute("media", "(min-width: 1280px)");
    expect(sources[0]).toHaveAttribute("srcset", mockThumbnailUrls.medium);

    // Large screens get large (365px)
    expect(sources[1]).toHaveAttribute("media", "(min-width: 1024px)");
    expect(sources[1]).toHaveAttribute("srcset", mockThumbnailUrls.large);

    // Mobile/tablet gets xlarge (600px) as default img src
  });

  it("uses cover size for cover-selector context", () => {
    render(
      <ResponsivePicture
        thumbnailUrls={mockThumbnailUrls}
        fallbackUrl={fallbackUrl}
        alt="Cover selector"
        context="cover-selector"
      />
    );

    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("src", mockThumbnailUrls.cover);
  });

  it("adapts to admin context with appropriate sizes", () => {
    render(
      <ResponsivePicture
        thumbnailUrls={mockThumbnailUrls}
        fallbackUrl={fallbackUrl}
        alt="Admin image"
        context="admin"
      />
    );

    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("src", mockThumbnailUrls.large); // Admin mobile default
  });

  it("falls back to simple img when no responsive sources", () => {
    const limitedThumbnails = { cover: mockThumbnailUrls.cover };

    render(
      <ResponsivePicture
        thumbnailUrls={limitedThumbnails}
        fallbackUrl={fallbackUrl}
        alt="Limited sources"
        context="discover"
      />
    );

    const picture = screen.getByRole("img").closest("picture");
    expect(picture).toBeNull(); // Should render simple img, not picture

    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("src", limitedThumbnails.cover);
  });

  it("uses fallback URL when no thumbnails available", () => {
    render(
      <ResponsivePicture
        thumbnailUrls={undefined}
        fallbackUrl={fallbackUrl}
        alt="Fallback image"
        context="discover"
      />
    );

    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("src", fallbackUrl);
  });

  it("supports lazy loading", () => {
    render(
      <ResponsivePicture
        thumbnailUrls={mockThumbnailUrls}
        fallbackUrl={fallbackUrl}
        alt="Lazy image"
        loading="lazy"
      />
    );

    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("loading", "lazy");
  });

  it("handles albums context with column optimization", () => {
    render(
      <ResponsivePicture
        thumbnailUrls={mockThumbnailUrls}
        fallbackUrl={fallbackUrl}
        alt="Album grid"
        context="albums"
        columns={6}
      />
    );

    const sources = document.querySelectorAll("source");

    // For 6+ columns, should use small size on very large screens
    const firstSource = sources[0];
    expect(firstSource).toHaveAttribute("media", "(min-width: 1280px)");
    expect(firstSource).toHaveAttribute("srcset", mockThumbnailUrls.small);
  });

  it("applies custom className correctly", () => {
    render(
      <ResponsivePicture
        thumbnailUrls={mockThumbnailUrls}
        fallbackUrl={fallbackUrl}
        alt="Styled image"
        className="custom-class w-full h-full"
      />
    );

    const img = screen.getByRole("img");
    expect(img).toHaveClass("custom-class", "w-full", "h-full");
  });
});
