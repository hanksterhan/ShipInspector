import { ClerkProvider } from "@clerk/clerk-react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useParams,
} from "react-router-dom";
import AuthGuard from "./app/AuthGuard";
import AppLayout from "./app/AppLayout";
import TokenProviderInit from "./app/TokenProviderInit";
import {
  SignInPage,
  EquityCalculatorPage,
  HandRecorderPage,
  HandLibraryPage,
  HandReplayerPage,
} from "./pages";

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

function LegacyReplayRedirect() {
  const { handId } = useParams<{ handId: string }>();
  return <Navigate to={`/hands/replay/${handId}`} replace />;
}

function App() {
  if (!CLERK_PUBLISHABLE_KEY) {
    throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY environment variable");
  }

  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
      <TokenProviderInit />
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<SignInPage />} />
          <Route path="/signin" element={<SignInPage />} />

          {/* Protected routes */}
          <Route element={<AuthGuard />}>
            <Route element={<AppLayout />}>
              <Route
                path="/equity-calculator"
                element={<EquityCalculatorPage />}
              />
              <Route path="/hands/record" element={<HandRecorderPage />} />
              <Route path="/hands/library" element={<HandLibraryPage />} />
              <Route
                path="/hands/replay/:handId?"
                element={<HandReplayerPage />}
              />
            </Route>
          </Route>

          {/* Legacy redirects */}
          <Route
            path="/hand-replayer"
            element={<Navigate to="/hands/record" replace />}
          />
          <Route
            path="/hand-library"
            element={<Navigate to="/hands/library" replace />}
          />
          <Route path="/replay/:handId" element={<LegacyReplayRedirect />} />

          {/* 404 fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ClerkProvider>
  );
}

export default App;
