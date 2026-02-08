import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CardSelectionMode =
  | "Suit - Rank Selection"
  | "Rank - Suit Selection"
  | "52 Cards";

interface SettingsState {
  trayOpen: boolean;
  cardSelectionMode: CardSelectionMode;
}

interface SettingsActions {
  toggleTray: () => void;
  setTrayOpen: (open: boolean) => void;
  setCardSelectionMode: (mode: CardSelectionMode) => void;
  resetSettings: () => void;
}

const DEFAULT_SETTINGS: SettingsState = {
  trayOpen: false,
  cardSelectionMode: "52 Cards",
};

export const useSettingsStore = create<SettingsState & SettingsActions>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,

      toggleTray: () => set((s) => ({ trayOpen: !s.trayOpen })),
      setTrayOpen: (open) => set({ trayOpen: open }),
      setCardSelectionMode: (mode) => set({ cardSelectionMode: mode }),
      resetSettings: () => set(DEFAULT_SETTINGS),
    }),
    {
      name: "ship-inspector-settings",
      partialize: (s) => ({ cardSelectionMode: s.cardSelectionMode }),
    },
  ),
);
