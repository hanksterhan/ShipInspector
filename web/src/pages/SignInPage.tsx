import { SignIn, useAuth } from "@clerk/clerk-react";
import { Navigate, useSearchParams } from "react-router-dom";
import { Sailboat, ArrowUpRight } from "lucide-react";
import LoadingSpinner from "../components/layout/LoadingSpinner";
import { PlayingCard } from "@/components/poker/PlayingCard";

export default function SignInPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const [params] = useSearchParams();
  const requested = params.get("returnTo") || "";
  const destination = /^\/tables\/[0-9a-f-]{36}$/i.test(requested)
    ? requested
    : "/equity-calculator";
  if (!isLoaded)
    return (
      <div className="auth-loading">
        <LoadingSpinner />
      </div>
    );
  if (isSignedIn) return <Navigate to={destination} replace />;
  return (
    <div className="signin-page">
      <section className="signin-intro">
        <div className="brand">
          <span className="brand-mark">
            <Sailboat size={27} />
          </span>
          ShipInspector<span className="brand-dot">.</span>
        </div>
        <div className="signin-message">
          <div className="eyebrow">WELCOME TO THE STUDY ROOM</div>
          <h1>
            Study the hand.
            <br />
            Know your equity.
          </h1>
          <div className="signin-cards" aria-label="Example poker hand">
            <PlayingCard card={{ rank: 14, suit: "s" }} label="Ace" />
            <PlayingCard card={{ rank: 13, suit: "h" }} label="King" />
          </div>
          <div className="signin-features">
            <span>
              Compare hands
              <ArrowUpRight size={16} />
            </span>
            <span>
              Explore every street
              <ArrowUpRight size={16} />
            </span>
            <span>
              Replay your decisions
              <ArrowUpRight size={16} />
            </span>
          </div>
        </div>
        <span className="signin-footer">
          TEXAS HOLD’EM · HAND STUDY & REVIEW
        </span>
      </section>
      <section className="signin-form" aria-label="Account sign in">
        <SignIn
          forceRedirectUrl={destination}
          routing="hash"
          appearance={{
            variables: {
              colorPrimary: "#5de4e8",
              colorTextOnPrimaryBackground: "#101b2b",
              colorBackground: "#191e35",
              colorInputBackground: "#101426",
              colorInputText: "#f5f1fa",
              colorText: "#f5f1fa",
              colorTextSecondary: "#b2bad2",
              borderRadius: "0.6rem",
              fontFamily: "Avenir Next, Segoe UI, sans-serif",
            },
            elements: {
              cardBox: { boxShadow: "none", border: "1px solid #3b4363" },
              footer: { background: "#202640" },
              socialButtonsBlockButton: {
                color: "#f5f1fa",
                background: "#2a304e",
                border: "1px solid #697392",
              },
              socialButtonsBlockButtonText: { color: "#f5f1fa" },
              formFieldInput: { border: "1px solid #697392" },
            },
          }}
        />
      </section>
    </div>
  );
}
