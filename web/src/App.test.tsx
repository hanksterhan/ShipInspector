import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
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

  it("renders HandReplayerPage with handId param", () => {
    renderWithRouter(["/hands/replay/abc123"]);
    expect(screen.getByText("Replaying hand: abc123")).toBeInTheDocument();
  });

  it("renders HandReplayerPage without handId", () => {
    renderWithRouter(["/hands/replay"]);
    expect(screen.getByText("Select a hand to replay")).toBeInTheDocument();
  });

  it("renders AppLayout sidebar with nav links and sign out", () => {
    renderWithRouter(["/equity-calculator"]);
    expect(screen.getByText("ShipInspector")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Equity Calculator" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Record Hand" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Hand Library" })).toBeInTheDocument();
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

  it("redirects /replay/:handId to /hands/replay/:handId", () => {
    renderWithRouter(["/replay/xyz789"]);
    expect(screen.getByText("Replaying hand: xyz789")).toBeInTheDocument();
  });

  it("redirects unknown routes to /", () => {
    renderWithRouter(["/some/unknown/path"]);
    // Authenticated, so / redirects to equity-calculator
    expect(screen.getByRole("heading", { name: "Equity Calculator" })).toBeInTheDocument();
  });
});
