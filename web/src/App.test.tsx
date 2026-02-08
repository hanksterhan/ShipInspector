import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { handService } from "@/services";
import { MemoryRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import AuthGuard from "./app/AuthGuard";
import AppLayout from "./app/AppLayout";
import {
  SignInPage,
  EquityCalculatorPage,
  HandRecorderPage,
  HandLibraryPage,
  HandReplayerPage,
} from "./pages";

// Mock Clerk hooks
const mockUseAuth = vi.fn();
const mockUseClerk = vi.fn();
vi.mock("@clerk/clerk-react", () => ({
  useAuth: () => mockUseAuth(),
  useClerk: () => mockUseClerk(),
  SignIn: () => <div>Clerk Sign In</div>,
  ClerkProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock handService (HandReplayerPage needs getHand; other pages may use listHands, etc.)
vi.mock("@/services", () => ({
  handService: {
    getHand: vi.fn(),
    listHands: vi.fn().mockResolvedValue({ hands: [], nextCursor: null }),
    createHand: vi.fn(),
    deleteHand: vi.fn(),
  },
  httpClient: {},
  pokerService: {},
  authService: {},
}));

// Mock hand-replayer components to avoid Radix/Zustand selector issues in routing tests
vi.mock("@/components/hand-replayer", async () => {
  const React = await import("react");
  return {
    ReplayPlayer: () => null,
    ReplayBoardCards: () => null,
    ReplayControls: () => null,
    ReplayTable: ({ hand }: { hand: { hand: { id: string } } }) =>
      React.createElement("div", { "data-testid": "replay-table" }, "Replay table for ", hand.hand.id),
  };
});

function LegacyReplayRedirect() {
  const { handId } = useParams<{ handId: string }>();
  return <Navigate to={`/hands/replay/${handId}`} replace />;
}

function renderWithRouter(initialEntries: string[]) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path="/" element={<SignInPage />} />
        <Route path="/signin" element={<SignInPage />} />
        <Route element={<AuthGuard />}>
          <Route element={<AppLayout />}>
            <Route path="/equity-calculator" element={<EquityCalculatorPage />} />
            <Route path="/hands/record" element={<HandRecorderPage />} />
            <Route path="/hands/library" element={<HandLibraryPage />} />
            <Route path="/hands/replay/:handId?" element={<HandReplayerPage />} />
          </Route>
        </Route>
        <Route path="/hand-replayer" element={<Navigate to="/hands/record" replace />} />
        <Route path="/hand-library" element={<Navigate to="/hands/library" replace />} />
        <Route path="/replay/:handId" element={<LegacyReplayRedirect />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("Routing (authenticated)", () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({ isLoaded: true, isSignedIn: true });
    mockUseClerk.mockReturnValue({ signOut: vi.fn() });
  });

  it("renders EquityCalculatorPage at /equity-calculator", () => {
    renderWithRouter(["/equity-calculator"]);
    expect(screen.getByRole("heading", { name: "Equity Calculator" })).toBeInTheDocument();
  });

  it("renders HandRecorderPage at /hands/record", () => {
    renderWithRouter(["/hands/record"]);
    expect(screen.getByRole("heading", { name: "Record Hand" })).toBeInTheDocument();
  });

  it("renders HandLibraryPage at /hands/library", () => {
    renderWithRouter(["/hands/library"]);
    expect(screen.getByRole("heading", { name: "Hand Library" })).toBeInTheDocument();
  });

  it("renders HandReplayerPage with handId param", async () => {
    const mockHand = {
      hand: {
        id: "abc123",
        owner_user_id: "u1",
        table_size: 2,
        button_seat: 0,
        small_blind: 100,
        big_blind: 200,
        ante: 0,
        board_flop_1: null,
        board_flop_2: null,
        board_flop_3: null,
        board_turn: null,
        board_river: null,
        created_at: 0,
        updated_at: null,
        deleted_at: null,
      },
      players: [
        { id: "p1", hand_id: "abc123", seat_index: 0, display_name: "P1", stack_at_start: 10000, is_hero: true, showdown_card_1: null, showdown_card_2: null, created_at: 0, updated_at: null, deleted_at: null },
        { id: "p2", hand_id: "abc123", seat_index: 1, display_name: "P2", stack_at_start: 10000, is_hero: false, showdown_card_1: null, showdown_card_2: null, created_at: 0, updated_at: null, deleted_at: null },
      ],
      actions: [],
    };
    vi.mocked(handService.getHand).mockResolvedValue(mockHand);

    renderWithRouter(["/hands/replay/abc123"]);
    expect(await screen.findByTestId("replay-table")).toHaveTextContent("Replay table for abc123");
  });

  it("renders HandReplayerPage without handId", () => {
    renderWithRouter(["/hands/replay"]);
    expect(screen.getByText("Select a hand from the Hand Library to replay it.")).toBeInTheDocument();
  });

  it("renders AppLayout sidebar with nav links and sign out", () => {
    renderWithRouter(["/equity-calculator"]);
    expect(screen.getAllByText(/ShipInspector|SI/).length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: /Equity Calculator/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Record Hand/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Hand Library/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign Out" })).toBeInTheDocument();
  });

  it("redirects authenticated users from / to /equity-calculator", () => {
    renderWithRouter(["/"]);
    expect(screen.getByRole("heading", { name: "Equity Calculator" })).toBeInTheDocument();
  });
});

describe("Routing (unauthenticated)", () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({ isLoaded: true, isSignedIn: false });
    mockUseClerk.mockReturnValue({ signOut: vi.fn() });
  });

  it("shows sign-in at /", () => {
    renderWithRouter(["/"]);
    expect(screen.getByText("Clerk Sign In")).toBeInTheDocument();
  });

  it("shows sign-in at /signin", () => {
    renderWithRouter(["/signin"]);
    expect(screen.getByText("Clerk Sign In")).toBeInTheDocument();
  });

  it("redirects protected routes to / (sign-in)", () => {
    renderWithRouter(["/equity-calculator"]);
    expect(screen.getByText("Clerk Sign In")).toBeInTheDocument();
  });
});

describe("Routing (loading)", () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({ isLoaded: false, isSignedIn: false });
    mockUseClerk.mockReturnValue({ signOut: vi.fn() });
  });

  it("shows loading spinner while auth initializes on protected route", () => {
    renderWithRouter(["/equity-calculator"]);
    // LoadingSpinner renders a spinning div
    expect(document.querySelector(".animate-spin")).toBeInTheDocument();
  });
});

describe("Legacy redirects", () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({ isLoaded: true, isSignedIn: true });
    mockUseClerk.mockReturnValue({ signOut: vi.fn() });
  });

  it("redirects /hand-replayer to /hands/record", () => {
    renderWithRouter(["/hand-replayer"]);
    expect(screen.getByRole("heading", { name: "Record Hand" })).toBeInTheDocument();
  });

  it("redirects /hand-library to /hands/library", () => {
    renderWithRouter(["/hand-library"]);
    expect(screen.getByRole("heading", { name: "Hand Library" })).toBeInTheDocument();
  });

  it("redirects /replay/:handId to /hands/replay/:handId", async () => {
    const mockHand = {
      hand: {
        id: "xyz789",
        owner_user_id: "u1",
        table_size: 2,
        button_seat: 0,
        small_blind: 100,
        big_blind: 200,
        ante: 0,
        board_flop_1: null,
        board_flop_2: null,
        board_flop_3: null,
        board_turn: null,
        board_river: null,
        created_at: 0,
        updated_at: null,
        deleted_at: null,
      },
      players: [
        { id: "p1", hand_id: "xyz789", seat_index: 0, display_name: "P1", stack_at_start: 10000, is_hero: true, showdown_card_1: null, showdown_card_2: null, created_at: 0, updated_at: null, deleted_at: null },
        { id: "p2", hand_id: "xyz789", seat_index: 1, display_name: "P2", stack_at_start: 10000, is_hero: false, showdown_card_1: null, showdown_card_2: null, created_at: 0, updated_at: null, deleted_at: null },
      ],
      actions: [],
    };
    vi.mocked(handService.getHand).mockResolvedValue(mockHand);

    renderWithRouter(["/replay/xyz789"]);
    expect(await screen.findByTestId("replay-table")).toHaveTextContent("Replay table for xyz789");
  });

  it("redirects unknown routes to /", () => {
    renderWithRouter(["/some/unknown/path"]);
    // Authenticated, so / redirects to equity-calculator
    expect(screen.getByRole("heading", { name: "Equity Calculator" })).toBeInTheDocument();
  });
});
