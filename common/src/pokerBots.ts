import type { BotStyle } from "./interfaces/tableInterfaces";

export const BOT_PROFILES: Record<BotStyle, { name: string; label: string; tendency: string }> = {
  aggressive: { name: "Rico", label: "Aggressive", tendency: "Wide ranges · Frequent raises" },
  passive: { name: "Marina", label: "Passive", tendency: "Wide ranges · More calls" },
  balanced: { name: "Vega", label: "Balanced", tendency: "Selective hands · Measured bets" },
  random: { name: "Ziggy", label: "Random", tendency: "Unpredictable legal actions" },
};
export const BOT_STYLES = Object.keys(BOT_PROFILES) as BotStyle[];
