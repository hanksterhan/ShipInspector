import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Layers } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { calculateSPR, validateSPRInput } from "@/lib/poker/sprCalculator";

export default function SPRCalculatorPage() {
  const [effectiveStack, setEffectiveStack] = useState("");
  const [potSize, setPotSize] = useState("");
  const { result, error } = useMemo(() => {
    if (!effectiveStack || !potSize) return { result: null, error: null };
    const input = {
      effectiveStack: Number(effectiveStack),
      potSize: Number(potSize),
    };
    const error = validateSPRInput(input);
    return { error, result: error ? null : calculateSPR(input) };
  }, [effectiveStack, potSize]);
  return (
    <div className="utility-page">
      <div className="page-title-row">
        <div>
          <div className="eyebrow">QUICK TOOLS / 02</div>
          <h1>SPR Calculator</h1>
        </div>
      </div>
      <div className="utility-grid">
        <section className="utility-inputs" aria-label="Stack-to-pot inputs">
          <div className="utility-section-label">
            <Layers size={17} />
            <h2>Stack and pot</h2>
          </div>
          <div className="utility-field">
            <Label htmlFor="effectiveStack">Effective stack (chips)</Label>
            <Input
              id="effectiveStack"
              type="number"
              min="0.01"
              step="any"
              placeholder="100"
              value={effectiveStack}
              onChange={(e) => setEffectiveStack(e.target.value)}
              aria-describedby="stack-definition"
            />
            <p id="stack-definition">
              The smaller remaining stack in a heads-up hand.
            </p>
          </div>
          <div className="utility-field">
            <Label htmlFor="potSize">Current pot (chips)</Label>
            <Input
              id="potSize"
              type="number"
              min="0.01"
              step="any"
              placeholder="20"
              value={potSize}
              onChange={(e) => setPotSize(e.target.value)}
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
                setEffectiveStack("100");
                setPotSize("20");
              }}
            >
              Try 100 into 20
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setEffectiveStack("");
                setPotSize("");
              }}
            >
              Reset
            </Button>
          </div>
        </section>
        <section
          className="utility-result"
          aria-label="Stack-to-pot result"
          aria-live="polite"
        >
          <span className="eyebrow">STACK-TO-POT RATIO</span>
          <div className="utility-number">
            {result ? result.spr.toFixed(1) : "—"}
          </div>
          <dl>
            <div>
              <dt>Effective stack</dt>
              <dd>
                {effectiveStack
                  ? `${Number(effectiveStack).toLocaleString()} chips`
                  : "—"}
              </dd>
            </div>
            <div>
              <dt>Current pot</dt>
              <dd>
                {potSize ? `${Number(potSize).toLocaleString()} chips` : "—"}
              </dd>
            </div>
          </dl>
          <p>
            Effective stack ÷ pot. This ratio alone does not determine whether
            to bet, call, or fold.
          </p>
        </section>
      </div>
      <Link className="utility-next" to="/utilities/pot-odds">
        <span>Check the price of a call</span>
        <ArrowRight size={19} />
      </Link>
    </div>
  );
}
