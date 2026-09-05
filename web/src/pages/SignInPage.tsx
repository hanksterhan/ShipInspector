import { SignIn, useAuth } from "@clerk/clerk-react";
import { Navigate } from "react-router-dom";
import { Ship, ArrowUpRight } from "lucide-react";
import LoadingSpinner from "../components/layout/LoadingSpinner";
import { PlayingCard } from "@/components/poker/PlayingCard";

export default function SignInPage() {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded)
    return (
      <div className="auth-loading">
        <LoadingSpinner />
      </div>
    );
  if (isSignedIn) return <Navigate to="/equity-calculator" replace />;
  return (
    <div className="signin-page">
      <section className="signin-intro">
        <div className="brand">
          <span className="brand-mark">
            <Ship size={27} />
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
          routing="hash"
          appearance={{
            variables: {
              colorPrimary: "#b5d49b",
              colorTextOnPrimaryBackground: "#182617",
              colorBackground: "#17201c",
              colorInputBackground: "#101715",
              colorInputText: "#ecf1ed",
              colorText: "#ecf1ed",
              colorTextSecondary: "#a6b8aa",
              borderRadius: "0.6rem",
              fontFamily: "Avenir Next, Segoe UI, sans-serif",
            },
            elements: {
              cardBox: { boxShadow: "none", border: "1px solid #344137" },
              footer: { background: "#1b281f" },
              socialButtonsBlockButton: {
                color: "#ecf1ed",
                background: "#243329",
                border: "1px solid #4b5a4c",
              },
              socialButtonsBlockButtonText: { color: "#ecf1ed" },
              formFieldInput: { border: "1px solid #455345" },
            },
          }}
        />
      </section>
    </div>
  );
}
