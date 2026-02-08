import { useEffect, useMemo, useState } from "react";
import type { ActionTag, ActionType, Street } from "@common/interfaces";
import { VALID_ACTION_TAGS } from "@common/interfaces";
import { useHandRecorderStore } from "@/stores";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const STREET_OPTIONS: { value: Street; label: string }[] = [
  { value: "preflop", label: "Preflop" },
  { value: "flop", label: "Flop" },
  { value: "turn", label: "Turn" },
  { value: "river", label: "River" },
];

const ACTION_TYPE_OPTIONS: { value: ActionType; label: string }[] = [
  { value: "POST_SB", label: "Post Small Blind" },
  { value: "POST_BB", label: "Post Big Blind" },
  { value: "POST_ANTE", label: "Post Ante" },
  { value: "STRADDLE", label: "Straddle" },
  { value: "FOLD", label: "Fold" },
  { value: "CHECK", label: "Check" },
  { value: "CALL", label: "Call" },
  { value: "BET", label: "Bet" },
  { value: "RAISE", label: "Raise" },
  { value: "ALL_IN", label: "All-in" },
  { value: "REVEAL", label: "Reveal" },
  { value: "DEAL_FLOP", label: "Deal Flop" },
  { value: "DEAL_TURN", label: "Deal Turn" },
  { value: "DEAL_RIVER", label: "Deal River" },
  { value: "COLLECT", label: "Collect" },
  { value: "NOTE", label: "Note" },
];

const AMOUNT_ACTIONS = new Set<ActionType>([
  "POST_SB",
  "POST_BB",
  "POST_ANTE",
  "STRADDLE",
  "CALL",
  "BET",
  "RAISE",
  "ALL_IN",
  "COLLECT",
]);

const RAISE_ACTIONS = new Set<ActionType>(["RAISE"]);

interface ActionFormState {
  street: Street;
  actionType: ActionType;
  actorSeat: number | null;
  amount: number | null;
  raiseTo: number | null;
  decisionMs: number | null;
  tags: ActionTag[];
}

function TagToggle({
  tag,
  active,
  onToggle,
}: {
  tag: ActionTag;
  active: boolean;
  onToggle: (tag: ActionTag) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onToggle(tag)}
      className={cn(
        "rounded-full border px-2 py-0.5 text-xs transition-colors",
        active
          ? "border-primary bg-primary/10 text-primary"
          : "border-border text-muted-foreground hover:border-primary/50",
      )}
    >
      {tag.replace("_", " ")}
    </button>
  );
}

function ActionRow({
  index,
  action,
  seatOptions,
  onUpdate,
  onRemove,
}: {
  index: number;
  action: ActionFormState;
  seatOptions: number[];
  onUpdate: (updates: Partial<ActionFormState>) => void;
  onRemove: () => void;
}) {
  const showAmount = AMOUNT_ACTIONS.has(action.actionType);
  const showRaiseTo = RAISE_ACTIONS.has(action.actionType);

  return (
    <div className="rounded-lg border border-border bg-background p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground">
          #{index + 1}
        </span>
        <Button size="xs" variant="ghost" onClick={onRemove}>
          Delete
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div>
          <Label className="text-xs">Street</Label>
          <Select
            value={action.street}
            onValueChange={(value) => onUpdate({ street: value as Street })}
          >
            <SelectTrigger size="sm" className="mt-1 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STREET_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs">Action</Label>
          <Select
            value={action.actionType}
            onValueChange={(value) =>
              onUpdate({ actionType: value as ActionType })
            }
          >
            <SelectTrigger size="sm" className="mt-1 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ACTION_TYPE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs">Actor Seat</Label>
          <Select
            value={action.actorSeat === null ? "dealer" : String(action.actorSeat)}
            onValueChange={(value) =>
              onUpdate({
                actorSeat: value === "dealer" ? null : Number(value),
              })
            }
          >
            <SelectTrigger size="sm" className="mt-1 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dealer">Dealer</SelectItem>
              {seatOptions.map((seat) => (
                <SelectItem key={seat} value={String(seat)}>
                  Seat {seat + 1}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs">Decision ms</Label>
          <Input
            type="number"
            min={0}
            step={1}
            value={action.decisionMs ?? ""}
            onChange={(event) =>
              onUpdate({
                decisionMs:
                  event.target.value === ""
                    ? null
                    : Number(event.target.value),
              })
            }
            className="mt-1 h-8"
          />
        </div>

        {showAmount ? (
          <div>
            <Label className="text-xs">Amount</Label>
            <Input
              type="number"
              min={0}
              step={1}
              value={action.amount ?? ""}
              onChange={(event) =>
                onUpdate({
                  amount:
                    event.target.value === ""
                      ? null
                      : Number(event.target.value),
                })
              }
              className="mt-1 h-8"
            />
          </div>
        ) : null}

        {showRaiseTo ? (
          <div>
            <Label className="text-xs">Raise To</Label>
            <Input
              type="number"
              min={0}
              step={1}
              value={action.raiseTo ?? ""}
              onChange={(event) =>
                onUpdate({
                  raiseTo:
                    event.target.value === ""
                      ? null
                      : Number(event.target.value),
                })
              }
              className="mt-1 h-8"
            />
          </div>
        ) : null}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {VALID_ACTION_TAGS.map((tag) => (
          <TagToggle
            key={tag}
            tag={tag}
            active={action.tags.includes(tag)}
            onToggle={(nextTag) => {
              const nextTags = action.tags.includes(nextTag)
                ? action.tags.filter((t) => t !== nextTag)
                : [...action.tags, nextTag];
              onUpdate({ tags: nextTags });
            }}
          />
        ))}
      </div>
    </div>
  );
}

export function ActionRecorder() {
  const actions = useHandRecorderStore((s) => s.actions);
  const currentStreet = useHandRecorderStore((s) => s.currentStreet);
  const setStreet = useHandRecorderStore((s) => s.setStreet);
  const addAction = useHandRecorderStore((s) => s.addAction);
  const updateAction = useHandRecorderStore((s) => s.updateAction);
  const removeAction = useHandRecorderStore((s) => s.removeAction);
  const tableSize = useHandRecorderStore((s) => s.gameSettings.tableSize);
  const validationErrors = useHandRecorderStore((s) => s.validationErrors);

  const seatOptions = useMemo(
    () => Array.from({ length: tableSize }, (_, i) => i),
    [tableSize],
  );

  const [form, setForm] = useState<ActionFormState>({
    street: currentStreet,
    actionType: "CHECK",
    actorSeat: null,
    amount: null,
    raiseTo: null,
    decisionMs: null,
    tags: [],
  });

  useEffect(() => {
    setForm((prev) => ({ ...prev, street: currentStreet }));
  }, [currentStreet]);

  const showAmount = AMOUNT_ACTIONS.has(form.actionType);
  const showRaiseTo = RAISE_ACTIONS.has(form.actionType);

  const handleAddAction = () => {
    addAction({
      street: form.street,
      actionType: form.actionType,
      actorSeat: form.actorSeat,
      amount: showAmount ? form.amount : null,
      raiseTo: showRaiseTo ? form.raiseTo : null,
      decisionMs: form.decisionMs,
      tags: form.tags,
    });
    setForm((prev) => ({
      ...prev,
      amount: null,
      raiseTo: null,
      decisionMs: null,
      tags: [],
    }));
  };

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-base">Action Recorder</CardTitle>
        <CardDescription>
          Log betting actions and dealer events in order.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {STREET_OPTIONS.map((option) => (
            <Button
              key={option.value}
              size="sm"
              variant={currentStreet === option.value ? "default" : "outline"}
              onClick={() => setStreet(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>

        <div className="rounded-lg border border-border bg-background p-4">
          <h3 className="text-sm font-semibold">Add Action</h3>
          <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
            <div>
              <Label className="text-xs">Street</Label>
              <Select
                value={form.street}
                onValueChange={(value) =>
                  setForm((prev) => ({
                    ...prev,
                    street: value as Street,
                  }))
                }
              >
                <SelectTrigger size="sm" className="mt-1 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STREET_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Action</Label>
              <Select
                value={form.actionType}
                onValueChange={(value) =>
                  setForm((prev) => ({
                    ...prev,
                    actionType: value as ActionType,
                  }))
                }
              >
                <SelectTrigger size="sm" className="mt-1 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACTION_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Actor Seat</Label>
              <Select
                value={form.actorSeat === null ? "dealer" : String(form.actorSeat)}
                onValueChange={(value) =>
                  setForm((prev) => ({
                    ...prev,
                    actorSeat: value === "dealer" ? null : Number(value),
                  }))
                }
              >
                <SelectTrigger size="sm" className="mt-1 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dealer">Dealer</SelectItem>
                  {seatOptions.map((seat) => (
                    <SelectItem key={seat} value={String(seat)}>
                      Seat {seat + 1}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Decision ms</Label>
              <Input
                type="number"
                min={0}
                step={1}
                value={form.decisionMs ?? ""}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    decisionMs:
                      event.target.value === ""
                        ? null
                        : Number(event.target.value),
                  }))
                }
                className="mt-1 h-8"
              />
            </div>

            {showAmount ? (
              <div>
                <Label className="text-xs">Amount</Label>
                <Input
                  type="number"
                  min={0}
                  step={1}
                  value={form.amount ?? ""}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      amount:
                        event.target.value === ""
                          ? null
                          : Number(event.target.value),
                    }))
                  }
                  className="mt-1 h-8"
                />
              </div>
            ) : null}

            {showRaiseTo ? (
              <div>
                <Label className="text-xs">Raise To</Label>
                <Input
                  type="number"
                  min={0}
                  step={1}
                  value={form.raiseTo ?? ""}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      raiseTo:
                        event.target.value === ""
                          ? null
                          : Number(event.target.value),
                    }))
                  }
                  className="mt-1 h-8"
                />
              </div>
            ) : null}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {VALID_ACTION_TAGS.map((tag) => (
              <TagToggle
                key={tag}
                tag={tag}
                active={form.tags.includes(tag)}
                onToggle={(nextTag) =>
                  setForm((prev) => ({
                    ...prev,
                    tags: prev.tags.includes(nextTag)
                      ? prev.tags.filter((t) => t !== nextTag)
                      : [...prev.tags, nextTag],
                  }))
                }
              />
            ))}
          </div>

          <div className="mt-4 flex justify-end">
            <Button size="sm" onClick={handleAddAction}>
              Add Action
            </Button>
          </div>
        </div>

        {validationErrors.actions?.length ? (
          <p className="text-xs text-destructive">
            {validationErrors.actions.join(", ")}
          </p>
        ) : null}

        <div className="space-y-3">
          {actions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No actions recorded yet.
            </p>
          ) : (
            actions.map((action, index) => (
              <ActionRow
                key={`${action.street}-${index}`}
                index={index}
                action={action}
                seatOptions={seatOptions}
                onUpdate={(updates) => updateAction(index, updates)}
                onRemove={() => removeAction(index)}
              />
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
