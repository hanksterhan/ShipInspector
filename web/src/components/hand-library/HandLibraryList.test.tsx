import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { HandLibraryList } from "./HandLibraryList";
import { useHandLibraryStore } from "@/stores";
import type { HandListItem } from "@/services/handService";

function createMockHand(id: string): HandListItem {
  return {
    id,
    table_size: 6,
    button_seat: 0,
    small_blind: 50,
    big_blind: 100,
    ante: 0,
    board_flop_1: "14h",
    board_flop_2: "13h",
    board_flop_3: "12h",
    board_turn: "11h",
    board_river: "10h",
    created_at: Date.now(),
  };
}

const renderWithRouter = (component: React.ReactElement) => {
  return render(<MemoryRouter>{component}</MemoryRouter>);
};

describe("HandLibraryList", () => {
  beforeEach(() => {
    useHandLibraryStore.setState({
      hands: [],
      nextCursor: null,
      isLoading: false,
      error: null,
      filters: {},
      selectedHandId: null,
    });
  });

  it("shows loading skeleton when isLoading is true and no hands", () => {
    useHandLibraryStore.setState({
      isLoading: true,
      hands: [],
    });

    const { container } = renderWithRouter(<HandLibraryList />);

    const skeletonElements = container.querySelectorAll(".animate-pulse");
    expect(skeletonElements.length).toBeGreaterThan(0);
  });

  it("shows error message with retry button when error exists and no hands", () => {
    const fetchHands = vi.fn();
    const originalFetchHands = useHandLibraryStore.getState().fetchHands;

    useHandLibraryStore.setState({
      error: "Failed to load hands",
      hands: [],
      isLoading: false,
      fetchHands,
    });

    renderWithRouter(<HandLibraryList />);

    expect(screen.getByText("Failed to load hands")).toBeInTheDocument();

    const retryButton = screen.getByRole("button", { name: /retry/i });
    expect(retryButton).toBeInTheDocument();

    fireEvent.click(retryButton);
    expect(fetchHands).toHaveBeenCalled();

    useHandLibraryStore.setState({ fetchHands: originalFetchHands });
  });

  it("shows empty state message when hands is empty and not loading", () => {
    useHandLibraryStore.setState({
      hands: [],
      isLoading: false,
      error: null,
    });

    renderWithRouter(<HandLibraryList />);

    expect(
      screen.getByText("No hands saved yet. Record a hand to see it here."),
    ).toBeInTheDocument();
  });

  it("renders hand rows when hands exist", () => {
    const mockHands = [createMockHand("hand-1"), createMockHand("hand-2")];

    useHandLibraryStore.setState({
      hands: mockHands,
      isLoading: false,
      error: null,
    });

    renderWithRouter(<HandLibraryList />);

    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByText("Date")).toBeInTheDocument();
    expect(screen.getByText("Stakes")).toBeInTheDocument();
    expect(screen.getByText("Table Size")).toBeInTheDocument();
    expect(screen.getByText("Board")).toBeInTheDocument();
    expect(screen.getByText("Actions")).toBeInTheDocument();

    const rows = screen.getAllByRole("row");
    expect(rows.length).toBeGreaterThan(2);
  });

  it("shows Load more button when nextCursor is present", () => {
    const mockHands = [createMockHand("hand-1")];
    const loadMore = vi.fn();
    const originalLoadMore = useHandLibraryStore.getState().loadMore;

    useHandLibraryStore.setState({
      hands: mockHands,
      nextCursor: "cursor-123",
      isLoading: false,
      error: null,
      loadMore,
    });

    renderWithRouter(<HandLibraryList />);

    const loadMoreButton = screen.getByRole("button", { name: /load more/i });
    expect(loadMoreButton).toBeInTheDocument();

    fireEvent.click(loadMoreButton);
    expect(loadMore).toHaveBeenCalled();

    useHandLibraryStore.setState({ loadMore: originalLoadMore });
  });

  it("does not show Load more button when nextCursor is null", () => {
    const mockHands = [createMockHand("hand-1")];

    useHandLibraryStore.setState({
      hands: mockHands,
      nextCursor: null,
      isLoading: false,
      error: null,
    });

    renderWithRouter(<HandLibraryList />);

    expect(
      screen.queryByRole("button", { name: /load more/i }),
    ).not.toBeInTheDocument();
  });

  it("Load more button is disabled when loading", () => {
    const mockHands = [createMockHand("hand-1")];

    useHandLibraryStore.setState({
      hands: mockHands,
      nextCursor: "cursor-123",
      isLoading: true,
      error: null,
    });

    renderWithRouter(<HandLibraryList />);

    const loadMoreButton = screen.getByRole("button", { name: /loading/i });
    expect(loadMoreButton).toBeDisabled();
  });

  it("displays error banner when error exists but hands are present", () => {
    const mockHands = [createMockHand("hand-1")];

    useHandLibraryStore.setState({
      hands: mockHands,
      error: "Failed to load more hands",
      isLoading: false,
    });

    renderWithRouter(<HandLibraryList />);

    expect(screen.getByText("Failed to load more hands")).toBeInTheDocument();
    expect(screen.getByRole("table")).toBeInTheDocument();
  });

  it("renders delete button for each hand row", () => {
    const mockHands = [createMockHand("hand-1")];

    useHandLibraryStore.setState({
      hands: mockHands,
      isLoading: false,
      error: null,
    });

    renderWithRouter(<HandLibraryList />);

    const deleteButton = screen.getByLabelText("Delete hand");
    expect(deleteButton).toBeInTheDocument();
  });

  it("opens delete confirmation dialog when delete button is clicked", () => {
    const mockHands = [createMockHand("hand-1")];

    useHandLibraryStore.setState({
      hands: mockHands,
      isLoading: false,
      error: null,
    });

    renderWithRouter(<HandLibraryList />);

    const deleteButton = screen.getByLabelText("Delete hand");
    fireEvent.click(deleteButton);

    expect(screen.getByText("Delete hand?")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^delete$/i })).toBeInTheDocument();
  });

  it("calls deleteHand when delete is confirmed", () => {
    const mockHands = [createMockHand("hand-1")];
    const deleteHand = vi.fn();
    const originalDeleteHand = useHandLibraryStore.getState().deleteHand;

    useHandLibraryStore.setState({
      hands: mockHands,
      isLoading: false,
      error: null,
      deleteHand,
    });

    renderWithRouter(<HandLibraryList />);

    const deleteButton = screen.getByLabelText("Delete hand");
    fireEvent.click(deleteButton);

    const confirmButton = screen.getByRole("button", { name: /^delete$/i });
    fireEvent.click(confirmButton);

    expect(deleteHand).toHaveBeenCalledWith("hand-1");

    useHandLibraryStore.setState({ deleteHand: originalDeleteHand });
  });
});
