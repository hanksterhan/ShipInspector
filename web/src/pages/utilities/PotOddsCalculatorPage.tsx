import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function PotOddsCalculatorPage() {
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
            <p className="text-sm text-muted-foreground">
              Input form will be added in the next update.
            </p>
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
            <p className="text-sm text-muted-foreground">
              Results will appear here after calculation.
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
