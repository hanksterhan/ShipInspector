import { SignIn, useAuth } from "@clerk/clerk-react";
import { Navigate } from "react-router-dom";
import LoadingSpinner from "../components/layout/LoadingSpinner";

export default function SignInPage() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return <LoadingSpinner />;
  }

  if (isSignedIn) {
    return <Navigate to="/equity-calculator" replace />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <SignIn routing="hash" />
    </div>
  );
}
