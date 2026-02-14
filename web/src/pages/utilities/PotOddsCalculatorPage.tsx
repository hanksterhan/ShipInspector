import { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  calculatePotOdds,
  validatePotOddsInput,
} from "@/lib/poker/potOddsCalculator";
import { pokerService } from "@/services/pokerService";
import type { CalculateEquityResponse } from "@common/interfaces";

export default function PotOddsCalculatorPage() {
  const [potSize, setPotSize] = useState<string>("");
  const [betToCall, setBetToCall] = useState<string>("");

  // Board runout simulator state
  const [heroHand, setHeroHand] = useState<string>("");
  const [villainHand, setVillainHand] = useState<string>("");
  const [board, setBoard] = useState<string>("");
  const [equityResult, setEquityResult] = useState<CalculateEquityResponse | null>(null);
  const [equityError, setEquityError] = useState<string | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // Board runout equity calculation
  const handleCalculateEquity = async () => {
    setEquityError(null);
    setEquityResult(null);

    // Basic validation
    if (!heroHand.trim() || !villainHand.trim()) {
      setEquityError("Hero and villain hands are required");
      return;
    }

    setIsCalculating(true);

    try {
      const result = await pokerService.getHandEquity(
        [heroHand.trim(), villainHand.trim()],
        board.trim(),
      );
      setEquityResult(result);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to calculate equity";
      setEquityError(errorMessage);
    } finally {
      setIsCalculating(false);
    }
  };

  // Calculate results in real-time
  const { result, error } = useMemo(() => {
    const pot = parseFloat(potSize);
    const bet = parseFloat(betToCall);

    // If either input is empty or not a number, return null
    if (!potSize || !betToCall || isNaN(pot) || isNaN(bet)) {
      return { result: null, error: null };
    }

    // Validate inputs
    const validationError = validatePotOddsInput({
      potSize: pot,
      betToCall: bet,
    });
    if (validationError) {
      return { result: null, error: validationError };
    }

    // Calculate pot odds
    const calculatedResult = calculatePotOdds({ potSize: pot, betToCall: bet });
    return { result: calculatedResult, error: null };
  }, [potSize, betToCall]);

  return (
    <main className="flex flex-1 flex-col overflow-y-auto p-4 md:p-6">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold md:text-3xl">
          Pot Odds & Equity Required
        </h1>
        <p className="mt-2 text-sm text-muted-foreground md:text-base">
          Calculate the pot odds and minimum equity required to make a
          profitable call. Pot odds help you determine whether calling a bet is
          mathematically correct based on the size of the pot and the bet you
          need to call.
        </p>
      </div>

      {/* Content grid - stacked on mobile, side-by-side on desktop */}
      <div className="grid gap-6 md:grid-cols-2 lg:max-w-6xl">
        {/* Input card */}
        <Card>
          <CardHeader>
            <CardTitle>Calculate Pot Odds</CardTitle>
            <CardDescription>
              Enter pot size and bet amount to calculate pot odds
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="potSize">Pot Size ($)</Label>
                <Input
                  id="potSize"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={potSize}
                  onChange={(e) => setPotSize(e.target.value)}
                  placeholder="100"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="betToCall">Bet to Call ($)</Label>
                <Input
                  id="betToCall"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={betToCall}
                  onChange={(e) => setBetToCall(e.target.value)}
                  placeholder="50"
                  className="mt-1"
                />
              </div>
              {error && (
                <p className="text-sm text-destructive" role="alert">
                  {error}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Results card */}
        <Card>
          <CardHeader>
            <CardTitle>Results</CardTitle>
            <CardDescription>
              Pot odds and required equity will be displayed here
            </CardDescription>
          </CardHeader>
          <CardContent>
            {result ? (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Pot Odds</p>
                  <p className="text-3xl font-bold">{result.potOddsRatio}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Required Equity to Call
                  </p>
                  <p className="text-3xl font-bold">
                    {result.requiredEquityPercent}
                  </p>
                </div>
                <div className="mt-4 rounded-md bg-muted p-3">
                  <p className="text-xs text-muted-foreground">
                    You need to win at least {result.requiredEquityPercent} of
                    the time to make calling ${betToCall} profitable. The total
                    pot after your call will be ${result.totalPot.toFixed(2)}.
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Enter pot size and bet to calculate pot odds.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Board Runout Simulator - spans both columns on desktop */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Board Runout Simulator</CardTitle>
            <CardDescription>
              Calculate your equity against an opponent's hand on the current board
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <Label htmlFor="heroHand">Hero Hand</Label>
                  <Input
                    id="heroHand"
                    type="text"
                    value={heroHand}
                    onChange={(e) => setHeroHand(e.target.value.toUpperCase())}
                    placeholder="AhKh"
                    className="mt-1"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    e.g., AhKh, QdQc
                  </p>
                </div>
                <div>
                  <Label htmlFor="villainHand">Villain Hand</Label>
                  <Input
                    id="villainHand"
                    type="text"
                    value={villainHand}
                    onChange={(e) => setVillainHand(e.target.value.toUpperCase())}
                    placeholder="QdQc"
                    className="mt-1"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    e.g., JsTs, 9h8h
                  </p>
                </div>
                <div>
                  <Label htmlFor="board">Board (optional)</Label>
                  <Input
                    id="board"
                    type="text"
                    value={board}
                    onChange={(e) => setBoard(e.target.value.toUpperCase())}
                    placeholder="Ad2h3c"
                    className="mt-1"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    e.g., Ad2h3c, Ad2h3c4s
                  </p>
                </div>
              </div>

              <Button
                onClick={handleCalculateEquity}
                disabled={isCalculating}
                className="w-full md:w-auto"
              >
                {isCalculating ? "Calculating..." : "Calculate Equity"}
              </Button>

              {equityError && (
                <p className="text-sm text-destructive" role="alert">
                  {equityError}
                </p>
              )}

              {equityResult && (
                <div className="mt-4 space-y-4 rounded-md border p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Hero Equity</p>
                      <p className="text-3xl font-bold">
                        {(equityResult.equity.win[0] * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Villain Equity
                      </p>
                      <p className="text-3xl font-bold">
                        {(equityResult.equity.win[1] * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Win: {(equityResult.equity.win[0] * 100).toFixed(1)}% | Tie:{" "}
                    {(equityResult.equity.tie[0] * 100).toFixed(1)}% |
                    Simulations: {equityResult.equity.samples.toLocaleString()}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
