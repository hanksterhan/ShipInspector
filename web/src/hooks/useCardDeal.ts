import { useLayoutEffect, useRef } from "react";
import type { TableView } from "@common/interfaces/tableInterfaces";

export function useCardDeal(table: TableView) {
  const felt = useRef<HTMLDivElement>(null);
  const lastHand = useRef<{ id: string; number: number } | null>(null);
  const { id, handNumber, street, button } = table;
  const seatCount = table.settings.maxPlayers;

  useLayoutEffect(() => {
    const previous = lastHand.current;
    lastHand.current = { id, number: handNumber };
    const root = felt.current;
    // A saved snapshot is already dealt. Only animate a new hand seen live.
    if (
      !root ||
      previous?.id !== id ||
      handNumber <= previous.number ||
      street !== "preflop"
    )
      return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (
      reducedMotion.matches ||
      document.documentElement.dataset.inputMethod === "keyboard"
    )
      return;

    const bounds = root.getBoundingClientRect();
    const origin = {
      x: bounds.left + bounds.width / 2,
      y: bounds.top + bounds.height / 2,
    };
    const cards = [...root.querySelectorAll<HTMLElement>(".live-dealt-card")];
    const distance = (card: HTMLElement) =>
      (Number(card.dataset.seat) - button - 1 + seatCount) % seatCount;
    // Match the engine: clockwise from the button, one card per seat per round.
    cards.sort(
      (a, b) =>
        Number(a.dataset.card) - Number(b.dataset.card) ||
        distance(a) - distance(b),
    );
    const easing = getComputedStyle(root).getPropertyValue("--ease-out").trim();
    const animations = cards.map((card, index) => {
      const target = card.getBoundingClientRect();
      const x = origin.x - target.left - target.width / 2;
      const y = origin.y - target.top - target.height / 2;
      const animation = card.animate(
        [
          { transform: `translate(${x}px, ${y}px) rotate(-6deg)`, opacity: 0 },
          { opacity: 1, offset: 0.15 },
          { transform: "translate(0px, 0px) rotate(0deg)", opacity: 1 },
        ],
        { duration: 220, delay: index * 30, easing, fill: "backwards" },
      );
      animation.id = "live-hole-deal";
      return animation;
    });
    // If layout or input mode changes, show the cards in their final positions.
    const finish = () => animations.forEach((animation) => animation.cancel());
    const resize = new ResizeObserver(() => {
      const current = root.getBoundingClientRect();
      if (current.width !== bounds.width || current.height !== bounds.height)
        finish();
    });
    resize.observe(root);
    reducedMotion.addEventListener("change", finish);
    window.addEventListener("keydown", finish, true);
    return () => {
      finish();
      resize.disconnect();
      reducedMotion.removeEventListener("change", finish);
      window.removeEventListener("keydown", finish, true);
    };
  }, [id, handNumber, street, button, seatCount]);

  return felt;
}
