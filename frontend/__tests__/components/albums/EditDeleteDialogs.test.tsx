import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { EditAlbumDialog } from "@/components/albums/EditAlbumDialog";
import { DeleteAlbumDialog } from "@/components/albums/DeleteAlbumDialog";

const mockAlbum = {
  id: "album-123",
  title: "Test Album",
  tags: ["tag1", "tag2"],
  isPublic: false,
  coverImageUrl: "",
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
  mediaCount: 5,
};

describe("EditAlbumDialog", () => {
  const mockOnClose = jest.fn();
  const mockOnSave = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders when open", () => {
    render(
      <EditAlbumDialog
        album={mockAlbum}
        open={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    expect(screen.getByText("Edit Album")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Test Album")).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    render(
      <EditAlbumDialog
        album={mockAlbum}
        open={false}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    expect(screen.queryByText("Edit Album")).not.toBeInTheDocument();
  });

  it("calls onClose when cancel is clicked", () => {
    render(
      <EditAlbumDialog
        album={mockAlbum}
        open={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    fireEvent.click(screen.getByText("Cancel"));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});

describe("DeleteAlbumDialog", () => {
  const mockOnClose = jest.fn();
  const mockOnConfirm = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders when open", () => {
    render(
      <DeleteAlbumDialog
        albumTitle="Test Album"
        open={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    expect(screen.getByText("Delete Album")).toBeInTheDocument();
    expect(screen.getByText(/Test Album/)).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    render(
      <DeleteAlbumDialog
        albumTitle="Test Album"
        open={false}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    expect(screen.queryByText("Delete Album")).not.toBeInTheDocument();
  });

  it("calls onConfirm when delete is clicked", () => {
    render(
      <DeleteAlbumDialog
        albumTitle="Test Album"
        open={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /Delete Album/i }));
    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
  });
});
