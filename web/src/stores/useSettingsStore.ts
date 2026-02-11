import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CardSelectionMode =
  | "Suit - Rank Selection"
  | "Rank - Suit Selection"
  | "52 Cards";

interface SettingsState {
  trayOpen: boolean;
  cardSelectionMode: CardSelectionMode;
  fourColorDeck: boolean;
  sidebarCollapsed: boolean;
  wizardMode: boolean;
}

interface SettingsActions {
  toggleTray: () => void;
  setTrayOpen: (open: boolean) => void;
  setCardSelectionMode: (mode: CardSelectionMode) => void;
  setFourColorDeck: (enabled: boolean) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setWizardMode: (enabled: boolean) => void;
  toggleWizardMode: () => void;
  resetSettings: () => void;
}

const DEFAULT_SETTINGS: SettingsState = {
  trayOpen: false,
  cardSelectionMode: "52 Cards",
  fourColorDeck: false,
  sidebarCollapsed: false,
  wizardMode: true,
};

export const useSettingsStore = create<SettingsState & SettingsActions>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,

      toggleTray: () => set((s) => ({ trayOpen: !s.trayOpen })),
      setTrayOpen: (open) => set({ trayOpen: open }),
      setCardSelectionMode: (mode) => set({ cardSelectionMode: mode }),
      setFourColorDeck: (enabled) => set({ fourColorDeck: enabled }),
      toggleSidebar: () =>
        set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSidebarCollapsed: (collapsed) =>
        set({ sidebarCollapsed: collapsed }),
      setWizardMode: (enabled) => set({ wizardMode: enabled }),
      toggleWizardMode: () => set((s) => ({ wizardMode: !s.wizardMode })),
      resetSettings: () => set(DEFAULT_SETTINGS),
    }),
    {
      name: "ship-inspector-settings",
      partialize: (s) => ({
        cardSelectionMode: s.cardSelectionMode,
        fourColorDeck: s.fourColorDeck,
        sidebarCollapsed: s.sidebarCollapsed,
        wizardMode: s.wizardMode,
      }),
    },
  ),
);
