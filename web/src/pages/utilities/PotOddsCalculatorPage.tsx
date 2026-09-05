import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Calculator } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  calculatePotOdds,
  validatePotOddsInput,
} from "@/lib/poker/potOddsCalculator";

export default function PotOddsCalculatorPage() {
  const [potSize, setPotSize] = useState("");
  const [betToCall, setBetToCall] = useState("");
  const { result, error } = useMemo(() => {
    if (!potSize || !betToCall) return { result: null, error: null };
    const input = { potSize: Number(potSize), betToCall: Number(betToCall) };
    const error = validatePotOddsInput(input);
    return { error, result: error ? null : calculatePotOdds(input) };
  }, [potSize, betToCall]);
  return (
    <div className="utility-page">
      <div className="page-title-row">
        <div>
          <div className="eyebrow">QUICK TOOLS / 01</div>
          <h1>Pot Odds & Equity Required</h1>
        </div>
      </div>
      <div className="utility-grid">
        <section className="utility-inputs" aria-label="Pot odds inputs">
          <div className="utility-section-label">
            <Calculator size={17} />
            <h2>Price of the call</h2>
          </div>
          <div className="utility-field">
            <Label htmlFor="potSize">
              Pot including opponent’s bet (chips)
            </Label>
            <Input
              id="potSize"
              type="number"
              min="0.01"
              step="any"
              placeholder="150"
              value={potSize}
              onChange={(e) => setPotSize(e.target.value)}
            />
          </div>
          <div className="utility-field">
            <Label htmlFor="betToCall">Amount to call (chips)</Label>
            <Input
              id="betToCall"
              type="number"
              min="0.01"
              step="any"
              placeholder="50"
              value={betToCall}
              onChange={(e) => setBetToCall(e.target.value)}
            />
          </div>
          {error && (
            <p className="inline-error" role="alert">
              {error}
            </p>
          )}
          <div className="utility-presets">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setPotSize("150");
                setBetToCall("50");
              }}
            >
              Half-pot bet
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setPotSize("200");
                setBetToCall("100");
              }}
            >
              Pot-sized bet
            </Button>
          </div>
        </section>
        <section
          className="utility-result"
          aria-label="Pot odds result"
          aria-live="polite"
        >
          <span className="eyebrow">BREAK-EVEN EQUITY</span>
          <div className="utility-number">
            {result ? result.requiredEquityPercent : "—"}
          </div>
          <dl>
            <div>
              <dt>Pot odds</dt>
              <dd>{result?.potOddsRatio ?? "—"}</dd>
            </div>
            <div>
              <dt>Pot after your call</dt>
              <dd>
                {result ? `${result.totalPot.toLocaleString()} chips` : "—"}
              </dd>
            </div>
          </dl>
          <p>Call ÷ (current pot + call). Assumes no rake or further bets.</p>
        </section>
      </div>
      <Link className="utility-next" to="/equity-calculator">
        <span>Compare your hand’s equity</span>
        <ArrowRight size={19} />
      </Link>
    </div>
  );
}
