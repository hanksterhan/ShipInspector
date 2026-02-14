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
import { calculateSPR, validateSPRInput } from "@/lib/poker/sprCalculator";

export default function SPRCalculatorPage() {
  const [effectiveStack, setEffectiveStack] = useState<string>("");
  const [potSize, setPotSize] = useState<string>("");

  // Calculate results in real-time
  const { result, error } = useMemo(() => {
    const stack = parseFloat(effectiveStack);
    const pot = parseFloat(potSize);

    if (!effectiveStack || !potSize || isNaN(stack) || isNaN(pot)) {
      return { result: null, error: null };
    }

    const validationError = validateSPRInput({
      effectiveStack: stack,
      potSize: pot,
    });
    if (validationError) {
      return { result: null, error: validationError };
    }

    const calculatedResult = calculateSPR({
      effectiveStack: stack,
      potSize: pot,
    });
    return { result: calculatedResult, error: null };
  }, [effectiveStack, potSize]);

  return (
    <main className="flex flex-1 flex-col overflow-y-auto p-4 md:p-6">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold md:text-3xl">SPR Calculator</h1>
        <p className="mt-2 text-sm text-muted-foreground md:text-base">
          Calculate Stack-to-Pot Ratio (SPR) to determine optimal playing
          strategy based on stack depth. SPR helps you understand how committed
          you are to the pot and guides your decision-making.
        </p>
      </div>

      {/* Content grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:max-w-6xl">
        {/* Input card */}
        <Card>
          <CardHeader>
            <CardTitle>Calculate SPR</CardTitle>
            <CardDescription>
              Enter effective stack and current pot size
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="effectiveStack">Effective Stack ($)</Label>
                <Input
                  id="effectiveStack"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={effectiveStack}
                  onChange={(e) => setEffectiveStack(e.target.value)}
                  placeholder="100"
                  className="mt-1"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Smallest stack in play
                </p>
              </div>
              <div>
                <Label htmlFor="potSize">Pot Size ($)</Label>
                <Input
                  id="potSize"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={potSize}
                  onChange={(e) => setPotSize(e.target.value)}
                  placeholder="20"
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
            <CardDescription>SPR and strategy guidance</CardDescription>
          </CardHeader>
          <CardContent>
            {result ? (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Stack-to-Pot Ratio
                  </p>
                  <p className="text-3xl font-bold">
                    {result.spr.toFixed(1)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Strategy</p>
                  <p className="text-lg font-semibold capitalize">
                    {result.strategy.replace("-", " ")}
                  </p>
                </div>
                <div className="mt-4 rounded-md bg-muted p-3">
                  <p className="text-sm text-muted-foreground">
                    {result.strategyDescription}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Enter effective stack and pot size to calculate SPR.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
