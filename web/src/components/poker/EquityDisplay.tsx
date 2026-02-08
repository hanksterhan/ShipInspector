import { useEquityCalculatorStore } from "@/stores";
import { Loader2 } from "@/assets/icons";

export function EquityDisplay() {
  const equityState = useEquityCalculatorStore((s) => s.equity);

  if (equityState.status === "loading") {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        <span>Calculating equity...</span>
      </div>
    );
  }

  if (equityState.status === "error") {
    return (
      <div className="text-sm text-destructive">
        {equityState.error || "Equity calculation failed"}
      </div>
    );
  }

  if (equityState.status === "success" && equityState.data) {
    return (
      <div className="text-xs text-muted-foreground">
        {equityState.data.samples.toLocaleString()} samples
      </div>
    );
  }

  return null;
}
