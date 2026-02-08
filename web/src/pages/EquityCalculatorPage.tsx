import { useEffect } from "react";
import { useEquityCalculatorStore } from "@/stores";
import { useOutsCalculation } from "@/hooks/useOutsCalculation";
import { PokerTable } from "@/components/poker/PokerTable";
import { CardPickerModal } from "@/components/poker/CardPickerModal";
import { EquityDisplay } from "@/components/poker/EquityDisplay";
import { OutsDisplay } from "@/components/poker/OutsDisplay";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "@/assets/icons";

export default function EquityCalculatorPage() {
  const pickerOpen = useEquityCalculatorStore((s) => s.pickerOpen);
  const closePicker = useEquityCalculatorStore((s) => s.closePicker);
  const setCard = useEquityCalculatorStore((s) => s.setCard);
  const isCardUsed = useEquityCalculatorStore((s) => s.isCardUsed);
  const resetAll = useEquityCalculatorStore((s) => s.resetAll);
  const dispose = useEquityCalculatorStore((s) => s.dispose);

  const outs = useOutsCalculation();

  useEffect(() => {
    return () => dispose();
  }, [dispose]);

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Equity Calculator</h1>
          <EquityDisplay />
        </div>
        <Button variant="outline" size="sm" onClick={resetAll}>
          <RotateCcw className="size-3.5" />
          New Hand
        </Button>
      </div>

      {/* Poker Table */}
      <PokerTable />

      {/* Outs section */}
      {(outs.data || outs.loading) && (
        <div className="mx-auto w-full max-w-4xl rounded-lg border border-border bg-card p-4">
          <h2 className="mb-2 text-sm font-semibold">Outs Analysis</h2>
          <OutsDisplay
            data={outs.data}
            loading={outs.loading}
            error={outs.error}
          />
        </div>
      )}

      {/* Card Picker Modal */}
      <CardPickerModal
        isOpen={pickerOpen}
        onClose={closePicker}
        onSelectCard={setCard}
        isCardUsed={isCardUsed}
      />
    </div>
  );
}
