import { useEffect } from "react";
import { useEquityCalculatorStore } from "@/stores";
import { useOutsCalculation } from "@/hooks/useOutsCalculation";
import { usePageHeader } from "@/app/PageHeaderContext";
import { PokerTable } from "@/components/poker/PokerTable";
import { CardPickerModal } from "@/components/poker/CardPickerModal";
import { EquityDisplay } from "@/components/poker/EquityDisplay";
import { OutsDisplay } from "@/components/poker/OutsDisplay";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "@/assets/icons";

function PageHeader() {
  const resetAll = useEquityCalculatorStore((s) => s.resetAll);

  return (
    <>
      <h1 className="shrink-0 text-sm font-bold md:text-base">
        Equity Calculator
      </h1>
      <EquityDisplay />
      <div className="ml-auto shrink-0">
        <Button variant="outline" size="sm" onClick={resetAll}>
          <RotateCcw className="size-3.5" />
          New Hand
        </Button>
      </div>
    </>
  );
}

export default function EquityCalculatorPage() {
  const pickerOpen = useEquityCalculatorStore((s) => s.pickerOpen);
  const closePicker = useEquityCalculatorStore((s) => s.closePicker);
  const setCard = useEquityCalculatorStore((s) => s.setCard);
  const isCardUsed = useEquityCalculatorStore((s) => s.isCardUsed);
  const dispose = useEquityCalculatorStore((s) => s.dispose);
  const { setHeaderContent } = usePageHeader();

  const outs = useOutsCalculation();

  useEffect(() => {
    setHeaderContent(<PageHeader />);
    return () => {
      setHeaderContent(null);
      dispose();
    };
  }, [setHeaderContent, dispose]);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 p-2">
      {/* Poker Table - fills available space */}
      <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden">
        <PokerTable />
      </div>

      {/* Outs section - fixed at bottom */}
      {(outs.data || outs.loading) && (
        <div className="shrink-0 overflow-auto rounded-lg border border-border bg-card p-3">
          <h2 className="mb-1 text-xs font-semibold">Outs Analysis</h2>
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
