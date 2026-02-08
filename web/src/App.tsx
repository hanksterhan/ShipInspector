import { lazy, Suspense } from "react";
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
import LoadingSpinner from "./components/layout/LoadingSpinner";

const EquityCalculatorPage = lazy(() => import("./pages/EquityCalculatorPage"));
const HandRecorderPage = lazy(() => import("./pages/HandRecorderPage"));
const HandLibraryPage = lazy(() => import("./pages/HandLibraryPage"));
const HandReplayerPage = lazy(() => import("./pages/HandReplayerPage"));
const SignInPage = lazy(() => import("./pages/SignInPage"));

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
        <Suspense
          fallback={
            <div className="flex items-center justify-center h-screen">
              <LoadingSpinner />
            </div>
          }
        >
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
        </Suspense>
      </BrowserRouter>
    </ClerkProvider>
  );
}

export default App;
